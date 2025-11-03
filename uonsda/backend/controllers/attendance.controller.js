import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Track devices to prevent fraud (in production, use Redis)
const deviceAttendance = new Map();

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Determine current service type based on day and time
 * @returns {Object} { serviceType, isServiceTime }
 */
function getCurrentServiceInfo() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();

  // Saturday (Sabbath) 8 AM - 5 PM
  if (day === 6 && hour >= 8 && hour < 17) {
    return { serviceType: 'SABBATH_MORNING', isServiceTime: true };
  }

  // Wednesday Vespers 5 PM - 8 PM
  if (day === 3 && hour >= 17 && hour < 20) {
    return { serviceType: 'WEDNESDAY_VESPERS', isServiceTime: true };
  }

  // Friday Vespers 5 PM - 8 PM
  if (day === 5 && hour >= 17 && hour < 20) {
    return { serviceType: 'FRIDAY_VESPERS', isServiceTime: true };
  }

  return { serviceType: null, isServiceTime: false };
}

/**
 * Get active location for a specific service type
 * @param {string} serviceType - Service type
 * @returns {Promise<Object|null>} Church location
 */
async function getActiveLocationForService(serviceType) {
  const whereClause = {};
  
  switch (serviceType) {
    case 'SABBATH_MORNING':
      whereClause.isActiveSabbath = true;
      break;
    case 'WEDNESDAY_VESPERS':
      whereClause.isActiveWednesday = true;
      break;
    case 'FRIDAY_VESPERS':
      whereClause.isActiveFriday = true;
      break;
  }

  return await prisma.churchLocation.findFirst({
    where: whereClause
  });
}

/**
 * Mark attendance for a member (Simple one-click with fraud prevention)
 * @route POST /api/attendance/mark
 * @access Public
 */
export const markAttendance = async (req, res) => {
  try {
    const { email, latitude, longitude, deviceId } = req.body;

    // Validate required fields
    if (!email || !latitude || !longitude || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Email, location, and device information are required'
      });
    }

    // Check if it's service time
    const { serviceType, isServiceTime } = getCurrentServiceInfo();
    if (!isServiceTime) {
      return res.status(403).json({
        success: false,
        message: 'Attendance can only be marked during service times',
        serviceSchedule: {
          sabbath: 'Saturday 8:00 AM - 5:00 PM',
          wednesdayVespers: 'Wednesday 5:00 PM - 8:00 PM',
          fridayVespers: 'Friday 5:00 PM - 8:00 PM'
        }
      });
    }

    // Device fraud prevention: Check if this device already marked attendance for someone else today
    const today = new Date().toISOString().split('T')[0];
    const deviceKey = `${deviceId}-${today}-${serviceType}`;
    
    if (deviceAttendance.has(deviceKey)) {
      const existingEmail = deviceAttendance.get(deviceKey);
      if (existingEmail !== email) {
        return res.status(429).json({
          success: false,
          message: 'This device has already been used to mark attendance for a different member today.',
          hint: 'Each person must use their own device to mark attendance. If you need help, please contact church administration.'
        });
      }
    }

    // Find member by email
    const member = await prisma.member.findUnique({
      where: { email }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found with this email. Please check your email address or register first.'
      });
    }

    // Get active church location for this service
    const churchLocation = await getActiveLocationForService(serviceType);

    if (!churchLocation) {
      return res.status(500).json({
        success: false,
        message: `No location has been set for this service. Please contact church administration.`
      });
    }

    // Calculate distance from church
    const distance = calculateDistance(
      latitude,
      longitude,
      churchLocation.latitude,
      churchLocation.longitude
    );

    // Check if within acceptable radius
    if (distance > churchLocation.radius) {
      return res.status(403).json({
        success: false,
        message: `You must be within ${churchLocation.radius}m of ${churchLocation.name} to mark attendance.`,
        yourDistance: `${Math.round(distance)}m away`,
        hint: 'Please make sure you are physically present at the church location.'
      });
    }

    // Check if already marked attendance today for this service
    const today_start = new Date();
    today_start.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today_start);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        memberId: member.id,
        serviceType,
        attendedAt: {
          gte: today_start,
          lt: tomorrow
        }
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked attendance for this service today! 🎉',
        attendance: {
          attendedAt: existingAttendance.attendedAt,
          location: existingAttendance.locationName
        }
      });
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        memberId: member.id,
        serviceType,
        latitude,
        longitude,
        locationName: churchLocation.name,
        isVerified: true
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Store device fingerprint to prevent reuse
    deviceAttendance.set(deviceKey, email);

    res.status(201).json({
      success: true,
      message: `Attendance marked successfully at ${churchLocation.name}! 🙏`,
      data: attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

/**
 * Get service status and schedule
 * @route GET /api/attendance/status
 * @access Public
 */
export const getServiceStatus = async (req, res) => {
  try {
    const { serviceType, isServiceTime } = getCurrentServiceInfo();

    let churchLocation = null;
    if (serviceType) {
      churchLocation = await getActiveLocationForService(serviceType);
    }

    res.json({
      success: true,
      data: {
        isServiceTime,
        currentService: serviceType,
        churchLocation: churchLocation ? {
          name: churchLocation.name,
          description: churchLocation.description,
          latitude: churchLocation.latitude,
          longitude: churchLocation.longitude,
          radius: churchLocation.radius,
          address: churchLocation.address
        } : null,
        schedule: {
          sabbath: {
            day: 'Saturday',
            time: '8:00 AM - 5:00 PM',
            type: 'SABBATH_MORNING'
          },
          wednesdayVespers: {
            day: 'Wednesday',
            time: '5:00 PM - 8:00 PM',
            type: 'WEDNESDAY_VESPERS'
          },
          fridayVespers: {
            day: 'Friday',
            time: '5:00 PM - 8:00 PM',
            type: 'FRIDAY_VESPERS'
          }
        }
      }
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service status',
      error: error.message
    });
  }
};

/**
 * Get attendance records with filters
 * @route GET /api/attendance
 * @access Private (Admin only)
 */
export const getAttendance = async (req, res) => {
  try {
    const { startDate, endDate, serviceType, memberId } = req.query;

    // Build filter object
    const where = {};

    if (startDate || endDate) {
      where.attendedAt = {};
      if (startDate) where.attendedAt.gte = new Date(startDate);
      if (endDate) where.attendedAt.lte = new Date(endDate);
    }

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (memberId) {
      where.memberId = memberId;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            ministry: true
          }
        }
      },
      orderBy: { attendedAt: 'desc' }
    });

    // Get statistics
    const total = attendances.length;
    const byService = await prisma.attendance.groupBy({
      by: ['serviceType'],
      where,
      _count: true
    });

    res.json({
      success: true,
      data: {
        attendances,
        total,
        byService
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

/**
 * Get member attendance history
 * @route GET /api/attendance/member/:email
 * @access Public
 */
export const getMemberAttendance = async (req, res) => {
  try {
    const { email } = req.params;

    const member = await prisma.member.findUnique({
      where: { email },
      include: {
        attendances: {
          orderBy: { attendedAt: 'desc' },
          take: 50 // Last 50 attendance records
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Calculate statistics
    const totalAttendances = member.attendances.length;
    const byService = member.attendances.reduce((acc, att) => {
      acc[att.serviceType] = (acc[att.serviceType] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email
        },
        totalAttendances,
        byService,
        recentAttendances: member.attendances
      }
    });
  } catch (error) {
    console.error('Error fetching member attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member attendance',
      error: error.message
    });
  }
};

/**
 * Get all saved church locations
 * @route GET /api/attendance/locations
 * @access Private (Admin)
 */
export const getAllLocations = async (req, res) => {
  try {
    const locations = await prisma.churchLocation.findMany({
      where: { isSaved: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message
    });
  }
};

/**
 * Create a new church location
 * @route POST /api/attendance/locations
 * @access Private (CLERK, ELDER)
 */
export const createLocation = async (req, res) => {
  try {
    const { name, description, latitude, longitude, radius, address } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Name, latitude, and longitude are required'
      });
    }

    // Check if location name already exists
    const existing = await prisma.churchLocation.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A location with this name already exists'
      });
    }

    const location = await prisma.churchLocation.create({
      data: {
        name,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: radius ? parseInt(radius) : 100,
        address,
        isActiveSabbath: false,
        isActiveWednesday: false,
        isActiveFriday: false,
        isSaved: true,
        createdBy: req.admin.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Church location created successfully',
      data: location
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: error.message
    });
  }
};

/**
 * Set active location for specific service(s)
 * @route PUT /api/attendance/locations/:id/activate
 * @access Private (CLERK, ELDER)
 */
export const setActiveLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { services } = req.body; // Array: ['SABBATH_MORNING', 'WEDNESDAY_VESPERS', 'FRIDAY_VESPERS']

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please specify which services to activate this location for'
      });
    }

    // Check if location exists
    const location = await prisma.churchLocation.findUnique({
      where: { id }
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Deactivate all locations for the specified services and activate the selected one
    const updateData = {};
    
    if (services.includes('SABBATH_MORNING')) {
      await prisma.churchLocation.updateMany({
        data: { isActiveSabbath: false }
      });
      updateData.isActiveSabbath = true;
    }
    
    if (services.includes('WEDNESDAY_VESPERS')) {
      await prisma.churchLocation.updateMany({
        data: { isActiveWednesday: false }
      });
      updateData.isActiveWednesday = true;
    }
    
    if (services.includes('FRIDAY_VESPERS')) {
      await prisma.churchLocation.updateMany({
        data: { isActiveFriday: false }
      });
      updateData.isActiveFriday = true;
    }

    // Activate the selected location for the specified services
    const activeLocation = await prisma.churchLocation.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: `${activeLocation.name} is now active for selected services`,
      data: activeLocation
    });
  } catch (error) {
    console.error('Error setting active location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set active location',
      error: error.message
    });
  }
};

/**
 * Update a church location
 * @route PUT /api/attendance/locations/:id
 * @access Private (CLERK, ELDER)
 */
export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, latitude, longitude, radius, address } = req.body;

    const location = await prisma.churchLocation.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(latitude && { latitude: parseFloat(latitude) }),
        ...(longitude && { longitude: parseFloat(longitude) }),
        ...(radius && { radius: parseInt(radius) }),
        ...(address !== undefined && { address })
      }
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

/**
 * Delete a church location
 * @route DELETE /api/attendance/locations/:id
 * @access Private (ELDER only)
 */
export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's an active location for any service
    const location = await prisma.churchLocation.findUnique({
      where: { id }
    });

    if (location?.isActiveSabbath || location?.isActiveWednesday || location?.isActiveFriday) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a location that is active for any service. Please deactivate it first.'
      });
    }

    await prisma.churchLocation.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: error.message
    });
  }
};

/**
 * Get currently active locations for all services
 * @route GET /api/attendance/locations/active
 * @access Private (Admin)
 */
export const getActiveLocations = async (req, res) => {
  try {
    const sabbathLocation = await prisma.churchLocation.findFirst({
      where: { isActiveSabbath: true }
    });

    const wednesdayLocation = await prisma.churchLocation.findFirst({
      where: { isActiveWednesday: true }
    });

    const fridayLocation = await prisma.churchLocation.findFirst({
      where: { isActiveFriday: true }
    });

    res.json({
      success: true,
      data: {
        sabbath: sabbathLocation,
        wednesday: wednesdayLocation,
        friday: fridayLocation
      }
    });
  } catch (error) {
    console.error('Error fetching active locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active locations',
      error: error.message
    });
  }
};