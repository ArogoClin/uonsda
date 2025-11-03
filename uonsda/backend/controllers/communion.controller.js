import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get current quarter based on month
 */
function getCurrentQuarter() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 1 && month <= 3) return 1;
  if (month >= 4 && month <= 6) return 2;
  if (month >= 7 && month <= 9) return 3;
  return 4;
}

/**
 * Create a new communion service
 * @route POST /api/communion/services
 * @access Private (Admin)
 */
export const createCommunionService = async (req, res) => {
  try {
    const { serviceDate, location, notes } = req.body;

    if (!serviceDate) {
      return res.status(400).json({
        success: false,
        message: 'Service date is required'
      });
    }

    const date = new Date(serviceDate);
    const year = date.getFullYear();
    const quarter = Math.ceil((date.getMonth() + 1) / 3);

    const communionService = await prisma.communionService.create({
      data: {
        serviceDate: date,
        quarter,
        year,
        location,
        notes,
        status: 'DRAFT', // NEW: Default to DRAFT
        recordedBy: req.admin.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Communion service created successfully',
      data: communionService
    });
  } catch (error) {
    console.error('Error creating communion service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create communion service',
      error: error.message
    });
  }
};

/**
 * Add participant to communion service
 * @route POST /api/communion/services/:id/participants
 * @access Private (Admin)
 */
export const addCommunionParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { participantType, memberEmail, visitorName, visitorChurch, visitorPhone, visitorEmail } = req.body;

    const communionService = await prisma.communionService.findUnique({
      where: { id }
    });

    if (!communionService) {
      return res.status(404).json({
        success: false,
        message: 'Communion service not found'
      });
    }

    let recordData = {
      communionServiceId: id,
      participantType
    };

    if (participantType === 'MEMBER') {
      if (!memberEmail) {
        return res.status(400).json({
          success: false,
          message: 'Member email is required for member participants'
        });
      }

      const member = await prisma.member.findUnique({
        where: { email: memberEmail }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found with this email'
        });
      }

      // Check if member already participated in this service
      const existing = await prisma.communionRecord.findFirst({
        where: {
          communionServiceId: id,
          memberId: member.id
        }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'This member has already been recorded for this communion service'
        });
      }

      recordData.memberId = member.id;

      // Update member count
      await prisma.communionService.update({
        where: { id },
        data: {
          membersCount: { increment: 1 },
          totalParticipants: { increment: 1 }
        }
      });
    } else {
      // VISITOR
      if (!visitorName) {
        return res.status(400).json({
          success: false,
          message: 'Visitor name is required for visitor participants'
        });
      }

      recordData.visitorName = visitorName;
      recordData.visitorChurch = visitorChurch;
      recordData.visitorPhone = visitorPhone;
      recordData.visitorEmail = visitorEmail;

      // Update visitor count
      await prisma.communionService.update({
        where: { id },
        data: {
          visitorsCount: { increment: 1 },
          totalParticipants: { increment: 1 }
        }
      });
    }

    const record = await prisma.communionRecord.create({
      data: recordData,
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
      }
    });

    res.status(201).json({
      success: true,
      message: 'Participant added successfully',
      data: record
    });
  } catch (error) {
    console.error('Error adding communion participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participant',
      error: error.message
    });
  }
};

/**
 * Get all communion services with filters
 * @route GET /api/communion/services
 * @access Private (Admin)
 */
export const getCommunionServices = async (req, res) => {
  try {
    const { year, quarter } = req.query;

    const where = {};
    if (year) where.year = parseInt(year);
    if (quarter) where.quarter = parseInt(quarter);

    const services = await prisma.communionService.findMany({
      where,
      include: {
        communionRecords: {
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
          }
        }
      },
      orderBy: { serviceDate: 'desc' }
    });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching communion services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communion services',
      error: error.message
    });
  }
};

/**
 * Get communion service by ID
 * @route GET /api/communion/services/:id
 * @access Private (Admin)
 */
export const getCommunionServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.communionService.findUnique({
      where: { id },
      include: {
        communionRecords: {
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
          orderBy: { recordedAt: 'asc' }
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Communion service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching communion service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communion service',
      error: error.message
    });
  }
};

/**
 * Get communion statistics
 * @route GET /api/communion/stats
 * @access Private (Admin)
 */
export const getCommunionStats = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Get quarterly stats
    const quarterlyStats = await prisma.communionService.groupBy({
      by: ['quarter'],
      where: { year: currentYear },
      _sum: {
        totalParticipants: true,
        membersCount: true,
        visitorsCount: true
      },
      _count: true
    });

    // Get total for the year
    const yearTotal = await prisma.communionService.aggregate({
      where: { year: currentYear },
      _sum: {
        totalParticipants: true,
        membersCount: true,
        visitorsCount: true
      },
      _count: true
    });

    // Get member participation rate
    const totalMembers = await prisma.member.count({
      where: { membershipStatus: 'ACTIVE' }
    });

    // Get unique members who participated
    const uniqueMembers = await prisma.communionRecord.findMany({
      where: {
        participantType: 'MEMBER',
        communionService: {
          year: currentYear
        }
      },
      distinct: ['memberId'],
      select: {
        memberId: true
      }
    });

    res.json({
      success: true,
      data: {
        year: currentYear,
        quarterlyStats,
        yearTotal,
        totalActiveMembers: totalMembers,
        uniqueMembersParticipated: uniqueMembers.length,
        participationRate: totalMembers > 0 
          ? ((uniqueMembers.length / totalMembers) * 100).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching communion stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communion statistics',
      error: error.message
    });
  }
};

/**
 * Get member's communion history
 * @route GET /api/communion/members/:email
 * @access Public
 */
export const getMemberCommunionHistory = async (req, res) => {
  try {
    const { email } = req.params;

    const member = await prisma.member.findUnique({
      where: { email },
      include: {
        communions: {
          include: {
            communionService: true
          },
          orderBy: {
            recordedAt: 'desc'
          }
        }
      }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      data: {
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email
        },
        totalCommunions: member.communions.length,
        communions: member.communions
      }
    });
  } catch (error) {
    console.error('Error fetching member communion history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communion history',
      error: error.message
    });
  }
};

/**
 * Delete communion participant
 * @route DELETE /api/communion/participants/:id
 * @access Private (Admin)
 */
export const deleteCommunionParticipant = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await prisma.communionRecord.findUnique({
      where: { id }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Participant record not found'
      });
    }

    // Update counts
    const updateData = {
      totalParticipants: { decrement: 1 }
    };

    if (record.participantType === 'MEMBER') {
      updateData.membersCount = { decrement: 1 };
    } else {
      updateData.visitorsCount = { decrement: 1 };
    }

    await prisma.communionService.update({
      where: { id: record.communionServiceId },
      data: updateData
    });

    await prisma.communionRecord.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    console.error('Error deleting communion participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete participant',
      error: error.message
    });
  }
};

/**
 * Update communion service
 * @route PUT /api/communion/services/:id
 * @access Private (Admin)
 */
export const updateCommunionService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceDate, location, notes } = req.body;

    const updateData = {};
    
    if (serviceDate) {
      const date = new Date(serviceDate);
      updateData.serviceDate = date;
      updateData.year = date.getFullYear();
      updateData.quarter = Math.ceil((date.getMonth() + 1) / 3);
    }
    
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;

    const service = await prisma.communionService.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Communion service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Error updating communion service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update communion service',
      error: error.message
    });
  }
};

/**
 * Delete communion service
 * @route DELETE /api/communion/services/:id
 * @access Private (ELDER only)
 */
export const deleteCommunionService = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.communionService.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Communion service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting communion service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete communion service',
      error: error.message
    });
  }
};

/**
 * Get active (open) communion service for public participation
 * @route GET /api/communion/active
 * @access Public
 */
export const getActiveCommunionService = async (req, res) => {
  try {
    const activeService = await prisma.communionService.findFirst({
      where: { status: 'OPEN' },
      orderBy: { serviceDate: 'desc' }
    });

    if (!activeService) {
      return res.json({
        success: true,
        data: null,
        message: 'No active communion service available'
      });
    }

    res.json({
      success: true,
      data: {
        id: activeService.id,
        serviceDate: activeService.serviceDate,
        quarter: activeService.quarter,
        year: activeService.year,
        location: activeService.location,
        notes: activeService.notes,
        totalParticipants: activeService.totalParticipants
      }
    });
  } catch (error) {
    console.error('Error fetching active communion service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active communion service',
      error: error.message
    });
  }
};

/**
 * Member self-registration for communion
 * @route POST /api/communion/participate
 * @access Public
 */
export const participateInCommunion = async (req, res) => {
  try {
    const { email, participantType, visitorName, visitorChurch, visitorPhone, visitorEmail } = req.body;

    // Get active communion service
    const activeService = await prisma.communionService.findFirst({
      where: { status: 'OPEN' }
    });

    if (!activeService) {
      return res.status(404).json({
        success: false,
        message: 'No active communion service available at this time'
      });
    }

    let recordData = {
      communionServiceId: activeService.id,
      participantType
    };

    if (participantType === 'MEMBER') {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required for member participants'
        });
      }

      const member = await prisma.member.findUnique({
        where: { email }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found with this email. Please check your email or register first.'
        });
      }

      // Check if member already participated
      const existing = await prisma.communionRecord.findFirst({
        where: {
          communionServiceId: activeService.id,
          memberId: member.id
        }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'You have already registered for this communion service! 🙏'
        });
      }

      recordData.memberId = member.id;

      // Update counts
      await prisma.communionService.update({
        where: { id: activeService.id },
        data: {
          membersCount: { increment: 1 },
          totalParticipants: { increment: 1 }
        }
      });
    } else {
      // VISITOR
      if (!visitorName) {
        return res.status(400).json({
          success: false,
          message: 'Name is required for visitor participants'
        });
      }

      recordData.visitorName = visitorName;
      recordData.visitorChurch = visitorChurch;
      recordData.visitorPhone = visitorPhone;
      recordData.visitorEmail = visitorEmail;

      // Update counts
      await prisma.communionService.update({
        where: { id: activeService.id },
        data: {
          visitorsCount: { increment: 1 },
          totalParticipants: { increment: 1 }
        }
      });
    }

    const record = await prisma.communionRecord.create({
      data: recordData,
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

    res.status(201).json({
      success: true,
      message: 'Successfully registered for communion! 🍞🍷',
      data: record
    });
  } catch (error) {
    console.error('Error participating in communion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for communion',
      error: error.message
    });
  }
};

/**
 * Open communion service for participation
 * @route PUT /api/communion/services/:id/open
 * @access Private (Admin)
 */
export const openCommunionService = async (req, res) => {
  try {
    const { id } = req.params;

    // Close any currently open services
    await prisma.communionService.updateMany({
      where: { status: 'OPEN' },
      data: { status: 'DRAFT' }
    });

    // Open the selected service
    const service = await prisma.communionService.update({
      where: { id },
      data: { status: 'OPEN' }
    });

    res.json({
      success: true,
      message: 'Communion service is now open for participation',
      data: service
    });
  } catch (error) {
    console.error('Error opening communion service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to open communion service',
      error: error.message
    });
  }
};

/**
 * Close communion service
 * @route PUT /api/communion/services/:id/close
 * @access Private (Admin)
 */
export const closeCommunionService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.communionService.update({
      where: { id },
      data: { status: 'CLOSED' }
    });

    res.json({
      success: true,
      message: 'Communion service has been closed',
      data: service
    });
  } catch (error) {
    console.error('Error closing communion service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close communion service',
      error: error.message
    });
  }
};