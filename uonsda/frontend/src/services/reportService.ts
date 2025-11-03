import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ReportFilters {
  startDate: string;
  endDate: string;
  reportType: string;
  ministry?: string;
  yearGroup?: string;
  serviceType?: string;
}

interface ReportData {
  members?: any[];
  attendance?: any[];
  communion?: any[];
  statistics?: any;
  filters: ReportFilters;
}

export class ReportService {
  private static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private static getCurrentDateTime(): string {
    return new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ============================================
  // PDF GENERATION
  // ============================================

  static generatePDF(data: ReportData, reportTitle: string) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header with Logo Placeholder
    doc.setFillColor(20, 184, 166); // Teal color
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Church Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('UONSDA CHURCH', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('University of Nairobi Seventh-day Adventist Church', pageWidth / 2, 30, { align: 'center' });

    yPosition = 50;

    // Report Title
    doc.setTextColor(31, 41, 55); // Dark gray
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Report Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128); // Gray
    doc.text(`Generated: ${this.getCurrentDateTime()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    if (data.filters.startDate && data.filters.endDate) {
      doc.text(
        `Period: ${this.formatDate(data.filters.startDate)} - ${this.formatDate(data.filters.endDate)}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 5;
    }

    // Add filters
    const filterTexts: string[] = [];
    if (data.filters.ministry) filterTexts.push(`Ministry: ${data.filters.ministry}`);
    if (data.filters.yearGroup) filterTexts.push(`Year: ${data.filters.yearGroup}`);
    if (data.filters.serviceType) filterTexts.push(`Service: ${data.filters.serviceType}`);
    
    if (filterTexts.length > 0) {
      doc.text(`Filters: ${filterTexts.join(' | ')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
    }

    yPosition += 10;

    // Add a line separator
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(14, yPosition, pageWidth - 14, yPosition);
    yPosition += 10;

    // Statistics Summary (if available)
    if (data.statistics) {
      this.addStatisticsSummary(doc, data.statistics, yPosition);
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Add appropriate tables based on report type
    switch (data.filters.reportType) {
      case 'members':
        this.addMembersTable(doc, data.members || [], yPosition);
        break;
      case 'attendance':
        this.addAttendanceTable(doc, data.attendance || [], yPosition);
        break;
      case 'communion':
        this.addCommunionTable(doc, data.communion || [], yPosition);
        break;
      case 'comprehensive':
        this.addComprehensiveReport(doc, data, yPosition);
        break;
    }

    // Add footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        '© 2025 UONSDA Church. All rights reserved.',
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `UONSDA_${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  private static addStatisticsSummary(doc: jsPDF, stats: any, yPosition: number) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Summary Statistics', 14, yPosition);
    yPosition += 8;

    const summaryData = [];
    
    if (stats.totalMembers !== undefined) {
      summaryData.push(['Total Members', stats.totalMembers.toString()]);
    }
    if (stats.activeMembers !== undefined) {
      summaryData.push(['Active Members', stats.activeMembers.toString()]);
    }
    if (stats.inactiveMembers !== undefined) {
      summaryData.push(['Inactive Members', stats.inactiveMembers.toString()]);
    }
    if (stats.totalAttendance !== undefined) {
      summaryData.push(['Total Attendance Records', stats.totalAttendance.toString()]);
    }
    if (stats.averageAttendance !== undefined) {
      summaryData.push(['Average Attendance', stats.averageAttendance.toString()]);
    }
    if (stats.totalCommunion !== undefined) {
      summaryData.push(['Communion Participants', stats.totalCommunion.toString()]);
    }

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [20, 184, 166],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 14, right: 14 }
    });
  }

  private static addMembersTable(doc: jsPDF, members: any[], yPosition: number) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Members Directory', 14, yPosition);
    yPosition += 8;

    const tableData = members.map((member, index) => [
      (index + 1).toString(),
      `${member.firstName} ${member.lastName}`,
      member.email,
      member.phone || 'N/A',
      member.ministry || 'N/A',
      member.yearGroup || 'N/A',
      member.membershipStatus || 'ACTIVE'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Name', 'Email', 'Phone', 'Ministry', 'Year', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [20, 184, 166],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 45 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 20 }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 14, right: 14 }
    });
  }

  private static addAttendanceTable(doc: jsPDF, attendance: any[], yPosition: number) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Attendance Records', 14, yPosition);
    yPosition += 8;

    const tableData = attendance.map((record, index) => [
      (index + 1).toString(),
      record.member ? `${record.member.firstName} ${record.member.lastName}` : 'N/A',
      this.getServiceName(record.serviceType),
      this.formatDate(record.attendedAt),
      record.locationName || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Member Name', 'Service Type', 'Date', 'Location']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 14, right: 14 }
    });
  }

  private static addCommunionTable(doc: jsPDF, communion: any[], yPosition: number) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Communion Records', 14, yPosition);
    yPosition += 8;

    const tableData = communion.map((record, index) => [
      (index + 1).toString(),
      record.participantType,
      record.member 
        ? `${record.member.firstName} ${record.member.lastName}`
        : record.visitorName || 'N/A',
      record.member?.email || record.visitorEmail || 'N/A',
      record.member?.ministry || record.visitorChurch || 'N/A',
      this.formatDate(record.recordedAt)
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Type', 'Name', 'Email', 'Ministry/Church', 'Date']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [147, 51, 234],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 14, right: 14 }
    });
  }

  private static addComprehensiveReport(doc: jsPDF, data: ReportData, yPosition: number) {
    // Add all tables with page breaks
    if (data.members && data.members.length > 0) {
      this.addMembersTable(doc, data.members, yPosition);
      doc.addPage();
      yPosition = 20;
    }

    if (data.attendance && data.attendance.length > 0) {
      this.addAttendanceTable(doc, data.attendance, yPosition);
      doc.addPage();
      yPosition = 20;
    }

    if (data.communion && data.communion.length > 0) {
      this.addCommunionTable(doc, data.communion, yPosition);
    }
  }

  private static getServiceName(serviceType: string): string {
    switch (serviceType) {
      case 'SABBATH_MORNING':
        return 'Sabbath Service';
      case 'WEDNESDAY_VESPERS':
        return 'Wednesday Vespers';
      case 'FRIDAY_VESPERS':
        return 'Friday Vespers';
      default:
        return serviceType;
    }
  }

  // ============================================
  // EXCEL GENERATION
  // ============================================

  static generateExcel(data: ReportData, reportTitle: string) {
    const workbook = XLSX.utils.book_new();

    // Add Summary Sheet
    if (data.statistics) {
      const summaryData = [
        ['UONSDA CHURCH REPORT'],
        [reportTitle],
        [`Generated: ${this.getCurrentDateTime()}`],
        [''],
        ['SUMMARY STATISTICS'],
        ['Metric', 'Value']
      ];

      if (data.statistics.totalMembers !== undefined) {
        summaryData.push(['Total Members', data.statistics.totalMembers]);
      }
      if (data.statistics.activeMembers !== undefined) {
        summaryData.push(['Active Members', data.statistics.activeMembers]);
      }
      if (data.statistics.inactiveMembers !== undefined) {
        summaryData.push(['Inactive Members', data.statistics.inactiveMembers]);
      }
      if (data.statistics.totalAttendance !== undefined) {
        summaryData.push(['Total Attendance Records', data.statistics.totalAttendance]);
      }
      if (data.statistics.averageAttendance !== undefined) {
        summaryData.push(['Average Attendance', data.statistics.averageAttendance]);
      }
      if (data.statistics.totalCommunion !== undefined) {
        summaryData.push(['Communion Participants', data.statistics.totalCommunion]);
      }

      if (data.filters.startDate && data.filters.endDate) {
        summaryData.push(['']);
        summaryData.push(['Report Period']);
        summaryData.push(['Start Date', this.formatDate(data.filters.startDate)]);
        summaryData.push(['End Date', this.formatDate(data.filters.endDate)]);
      }

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Style the summary sheet
      summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Add Members Sheet
    if (data.members && data.members.length > 0) {
      const membersData = [
        ['#', 'First Name', 'Last Name', 'Email', 'Phone', 'Ministry', 'Year Group', 'Gender', 'Status', 'Date Joined']
      ];

      data.members.forEach((member, index) => {
        membersData.push([
          index + 1,
          member.firstName,
          member.lastName,
          member.email,
          member.phone || 'N/A',
          member.ministry || 'N/A',
          member.yearGroup || 'N/A',
          member.gender || 'N/A',
          member.membershipStatus || 'ACTIVE',
          member.dateJoined ? this.formatDate(member.dateJoined) : 'N/A'
        ]);
      });

      const membersSheet = XLSX.utils.aoa_to_sheet(membersData);
      membersSheet['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, 
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, 
        { wch: 12 }, { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, membersSheet, 'Members');
    }

    // Add Attendance Sheet
    if (data.attendance && data.attendance.length > 0) {
      const attendanceData = [
        ['#', 'Member Name', 'Email', 'Service Type', 'Date', 'Location', 'Ministry']
      ];

      data.attendance.forEach((record, index) => {
        attendanceData.push([
          index + 1,
          record.member ? `${record.member.firstName} ${record.member.lastName}` : 'N/A',
          record.member?.email || 'N/A',
          this.getServiceName(record.serviceType),
          this.formatDate(record.attendedAt),
          record.locationName || 'N/A',
          record.member?.ministry || 'N/A'
        ]);
      });

      const attendanceSheet = XLSX.utils.aoa_to_sheet(attendanceData);
      attendanceSheet['!cols'] = [
        { wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, 
        { wch: 15 }, { wch: 20 }, { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');
    }

    // Add Communion Sheet
    if (data.communion && data.communion.length > 0) {
      const communionData = [
        ['#', 'Type', 'Name', 'Email', 'Ministry/Church', 'Phone', 'Date']
      ];

      data.communion.forEach((record, index) => {
        communionData.push([
          index + 1,
          record.participantType,
          record.member 
            ? `${record.member.firstName} ${record.member.lastName}`
            : record.visitorName || 'N/A',
          record.member?.email || record.visitorEmail || 'N/A',
          record.member?.ministry || record.visitorChurch || 'N/A',
          record.visitorPhone || 'N/A',
          this.formatDate(record.recordedAt)
        ]);
      });

      const communionSheet = XLSX.utils.aoa_to_sheet(communionData);
      communionSheet['!cols'] = [
        { wch: 5 }, { wch: 10 }, { wch: 25 }, { wch: 30 }, 
        { wch: 20 }, { wch: 15 }, { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, communionSheet, 'Communion');
    }

    // Generate and save the Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `UONSDA_${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  }
}