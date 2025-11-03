export const reportTemplates = {
  monthlyAttendance: {
    name: 'Monthly Attendance Summary',
    description: 'Detailed monthly attendance breakdown by service',
    filters: {
      reportType: 'attendance',
      presetDateRange: 'thisMonth'
    }
  },
  quarterlyMembership: {
    name: 'Quarterly Membership Report',
    description: 'Member statistics and growth for the quarter',
    filters: {
      reportType: 'members',
      presetDateRange: 'thisQuarter'
    }
  },
  annualComprehensive: {
    name: 'Annual Comprehensive Report',
    description: 'Complete church report for the year',
    filters: {
      reportType: 'comprehensive',
      presetDateRange: 'thisYear'
    }
  },
  communionQuarterly: {
    name: 'Quarterly Communion Report',
    description: 'Communion participation for the quarter',
    filters: {
      reportType: 'communion',
      presetDateRange: 'thisQuarter'
    }
  }
};