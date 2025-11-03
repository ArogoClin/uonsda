import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get comprehensive report data
 * @route GET /api/reports/comprehensive
 * @access Private (Admin)
 */
export const getComprehensiveReport = async (req, res) => {
  try {
    const { startDate, endDate, ministry, yearGroup, serviceType } = req.query;

    const whereClause = {};
    const attendanceWhere = {};
    const communionWhere = {};

    // Build member filters
    if (ministry) whereClause.ministry = ministry;
    if (yearGroup) whereClause.yearGroup = yearGroup;

    // Build date filters for attendance
    if (startDate || endDate) {
      attendanceWhere.attendedAt = {};
      if (startDate) attendanceWhere.attendedAt.gte = new Date(startDate);
      if (endDate) attendanceWhere.attendedAt.lte = new Date(endDate);
    }
    if (serviceType) attendanceWhere.serviceType = serviceType;

    // Build date filters for communion
    if (startDate || endDate) {
      communionWhere.recordedAt = {};
      if (startDate) communionWhere.recordedAt.gte = new Date(startDate);
      if (endDate) communionWhere.recordedAt.lte = new Date(endDate);
    }

    // Fetch members
    const members = await prisma.member.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        ministry: true,
        yearGroup: true,
        membershipStatus: true,
        dateJoined: true,
        createdAt: true
      },
      orderBy: { firstName: 'asc' }
    });

    // Fetch attendance
    const attendance = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            ministry: true
          }
        }
      },
      orderBy: { attendedAt: 'desc' }
    });

    // Fetch communion records
    const communion = await prisma.communionRecord.findMany({
      where: communionWhere,
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            ministry: true
          }
        }
      },
      orderBy: { recordedAt: 'desc' }
    });

    // Calculate statistics
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.membershipStatus === 'ACTIVE').length;
    const inactiveMembers = members.filter(m => m.membershipStatus === 'INACTIVE').length;
    
    const membersByMinistry = await prisma.member.groupBy({
      by: ['ministry'],
      where: whereClause,
      _count: true
    });

    const membersByYear = await prisma.member.groupBy({
      by: ['yearGroup'],
      where: whereClause,
      _count: true
    });

    const membersByGender = await prisma.member.groupBy({
      by: ['gender'],
      where: whereClause,
      _count: true
    });

    const attendanceByService = await prisma.attendance.groupBy({
      by: ['serviceType'],
      where: attendanceWhere,
      _count: true
    });

    const statistics = {
      totalMembers,
      activeMembers,
      inactiveMembers,
      totalAttendance: attendance.length,
      totalCommunion: communion.length,
      membersByMinistry,
      membersByYear,
      membersByGender,
      attendanceByService
    };

    res.json({
      success: true,
      data: {
        members,
        attendance,
        communion,
        statistics
      }
    });
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

/**
 * Get members report
 * @route GET /api/reports/members
 * @access Private (Admin)
 */
export const getMembersReport = async (req, res) => {
  try {
    const { ministry, yearGroup, membershipStatus } = req.query;

    const whereClause = {};
    if (ministry) whereClause.ministry = ministry;
    if (yearGroup) whereClause.yearGroup = yearGroup;
    if (membershipStatus) whereClause.membershipStatus = membershipStatus;

    const members = await prisma.member.findMany({
      where: whereClause,
      orderBy: { firstName: 'asc' }
    });

    const statistics = {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.membershipStatus === 'ACTIVE').length,
      inactiveMembers: members.filter(m => m.membershipStatus === 'INACTIVE').length
    };

    res.json({
      success: true,
      data: {
        members,
        statistics
      }
    });
  } catch (error) {
    console.error('Error generating members report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate members report',
      error: error.message
    });
  }
};

/**
 * Get attendance report
 * @route GET /api/reports/attendance
 * @access Private (Admin)
 */
export const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, serviceType } = req.query;

    const whereClause = {};
    if (startDate || endDate) {
      whereClause.attendedAt = {};
      if (startDate) whereClause.attendedAt.gte = new Date(startDate);
      if (endDate) whereClause.attendedAt.lte = new Date(endDate);
    }
    if (serviceType) whereClause.serviceType = serviceType;

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            ministry: true
          }
        }
      },
      orderBy: { attendedAt: 'desc' }
    });

    const statistics = {
      totalAttendance: attendance.length,
      averageAttendance: attendance.length > 0 ? (attendance.length / 
        new Set(attendance.map(a => a.attendedAt.toDateString())).size).toFixed(1) : 0
    };

    res.json({
      success: true,
      data: {
        attendance,
        statistics
      }
    });
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate attendance report',
      error: error.message
    });
  }
};

/**
 * Get communion report
 * @route GET /api/reports/communion
 * @access Private (Admin)
 */
export const getCommunionReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause = {};
    if (startDate || endDate) {
      whereClause.recordedAt = {};
      if (startDate) whereClause.recordedAt.gte = new Date(startDate);
      if (endDate) whereClause.recordedAt.lte = new Date(endDate);
    }

    const communion = await prisma.communionRecord.findMany({
      where: whereClause,
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            ministry: true
          }
        }
      },
      orderBy: { recordedAt: 'desc' }
    });

    const statistics = {
      totalCommunion: communion.length,
      members: communion.filter(c => c.participantType === 'MEMBER').length,
      visitors: communion.filter(c => c.participantType === 'VISITOR').length
    };

    res.json({
      success: true,
      data: {
        communion,
        statistics
      }
    });
  } catch (error) {
    console.error('Error generating communion report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate communion report',
      error: error.message
    });
  }
};