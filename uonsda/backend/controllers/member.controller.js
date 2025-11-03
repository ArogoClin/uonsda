import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all members with optional filtering
 * @route GET /api/members
 * @access Private (All authenticated admins)
 */
export const getAllMembers = async (req, res) => {
  try {
    const { ministry, membershipStatus, yearGroup, search } = req.query;

    // Build filter object dynamically
    const where = {};

    if (ministry) {
      where.ministry = ministry;
    }

    if (membershipStatus) {
      where.membershipStatus = membershipStatus;
    }

    if (yearGroup) {
      where.yearGroup = yearGroup;
    }

    // Search across multiple fields
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { course: { contains: search, mode: 'insensitive' } },
        { faculty: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch members with filters
    const members = await prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Get total count for pagination info
    const total = await prisma.member.count({ where });

    res.json({
      success: true,
      data: {
        members,
        total,
        count: members.length
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message
    });
  }
};

/**
 * Get single member by ID
 * @route GET /api/members/:id
 * @access Private
 */
export const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await prisma.member.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member',
      error: error.message
    });
  }
};

/**
 * Create a new member
 * @route POST /api/members
 * @access Public (Registration is open to everyone)
 */
export const createMember = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      dateBaptised,
      gender,
      address,
      city,
      ministry,
      course,
      faculty,
      yearGroup
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    // Check if email already exists
    const existingMember = await prisma.member.findUnique({
      where: { email }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create member
    const member = await prisma.member.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateBaptised: dateBaptised ? new Date(dateBaptised) : null,
        gender,
        address,
        city,
        ministry,
        course,
        faculty,
        yearGroup
      }
    });

    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: member
    });
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create member',
      error: error.message
    });
  }
};

/**
 * Update member information
 * @route PUT /api/members/:id
 * @access Private
 * - ELDER: Can update all fields including status and leadership
 * - CLERK: Can update basic info only
 */
export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const adminRole = req.admin.role;

    // Check if member exists
    const existingMember = await prisma.member.findUnique({
      where: { id }
    });

    if (!existingMember) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Prepare update data based on admin role
    let updateData = { ...req.body };

    // If CLERK, restrict sensitive fields
    if (adminRole === 'CLERK') {
      const { membershipStatus, isLeader, ...allowedData } = req.body;
      updateData = allowedData;
    }

    // Convert date strings to Date objects if present
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.dateBaptised) {
      updateData.dateBaptised = new Date(updateData.dateBaptised);
    }

    // Update member
    const member = await prisma.member.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: member
    });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member',
      error: error.message
    });
  }
};

/**
 * Delete a member
 * @route DELETE /api/members/:id
 * @access Private (ELDER only)
 */
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if member exists
    const member = await prisma.member.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Delete member
    await prisma.member.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete member',
      error: error.message
    });
  }
};

/**
 * Get member statistics
 * @route GET /api/members/stats/overview
 * @access Private
 */
export const getMemberStats = async (req, res) => {
  try {
    // Total members
    const totalMembers = await prisma.member.count();

    // Active members
    const activeMembers = await prisma.member.count({
      where: { membershipStatus: 'ACTIVE' }
    });

    // Members by ministry
    const membersByMinistry = await prisma.member.groupBy({
      by: ['ministry'],
      _count: true
    });

    // Members by year group
    const membersByYear = await prisma.member.groupBy({
      by: ['yearGroup'],
      _count: true
    });

    // Members by gender
    const membersByGender = await prisma.member.groupBy({
      by: ['gender'],
      _count: true
    });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await prisma.member.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        inactiveMembers: totalMembers - activeMembers,
        membersByMinistry,
        membersByYear,
        membersByGender,
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Error fetching member stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};