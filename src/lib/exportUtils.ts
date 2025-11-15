import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ScanData {
  id: string;
  url: string;
  domain: string;
  created_at: string;
  tech_stack: any;
  scan_status: string;
}

// Helper function to flatten tech stack data
const flattenTechStack = (scan: ScanData) => {
  const technologies: string[] = [];
  if (scan.tech_stack) {
    Object.entries(scan.tech_stack).forEach(([category, techs]: [string, any]) => {
      if (Array.isArray(techs)) {
        techs.forEach((tech: any) => {
          technologies.push(`${tech.name} (${category})`);
        });
      }
    });
  }
  return technologies;
};

// Helper function to prepare data rows
const prepareDataRows = (scans: ScanData[]) => {
  return scans.flatMap((scan) => {
    const technologies = flattenTechStack(scan);
    
    if (technologies.length === 0) {
      return [{
        Domain: scan.domain,
        URL: scan.url,
        'Scan Date': new Date(scan.created_at).toLocaleDateString(),
        Status: scan.scan_status,
        Category: '',
        Technology: 'No technologies detected',
        'First Detected': '',
        'Last Detected': ''
      }];
    }

    return technologies.map((tech, index) => {
      const [name, category] = tech.includes('(') 
        ? [tech.substring(0, tech.lastIndexOf('(')).trim(), tech.substring(tech.lastIndexOf('(') + 1, tech.lastIndexOf(')'))]
        : [tech, 'Other'];

      return {
        Domain: index === 0 ? scan.domain : '',
        URL: index === 0 ? scan.url : '',
        'Scan Date': index === 0 ? new Date(scan.created_at).toLocaleDateString() : '',
        Status: index === 0 ? scan.scan_status : '',
        Category: category,
        Technology: name,
        'First Detected': '',
        'Last Detected': ''
      };
    });
  });
};

export const exportToJSON = (scans: ScanData[], filename: string) => {
  const jsonData = scans.map((scan) => ({
    domain: scan.domain,
    url: scan.url,
    scanDate: scan.created_at,
    status: scan.scan_status,
    technologies: flattenTechStack(scan),
    techStack: scan.tech_stack
  }));

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
};

export const exportToCSV = (scans: ScanData[], filename: string) => {
  const rows = prepareDataRows(scans);
  
  const headers = Object.keys(rows[0] || {}).join(',');
  const csvRows = rows.map((row) =>
    Object.values(row).map((val) => `"${val}"`).join(',')
  );
  const csv = [headers, ...csvRows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `${filename}.csv`);
};

export const exportToXLSX = (scans: ScanData[], filename: string) => {
  const rows = prepareDataRows(scans);

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Domain
    { wch: 40 }, // URL
    { wch: 15 }, // Scan Date
    { wch: 12 }, // Status
    { wch: 15 }, // Category
    { wch: 30 }, // Technology
    { wch: 15 }, // First Detected
    { wch: 15 }  // Last Detected
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Scan Results');

  // Generate buffer and download
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (scans: ScanData[], filename: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(0, 180, 216); // Primary color
  doc.text('WebPulseSnap - Scan Export Report', 14, 15);

  // Add metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 22);
  doc.text(`Total Scans: ${scans.length}`, 14, 27);

  // Prepare table data
  const tableData = scans.map((scan) => {
    const technologies = flattenTechStack(scan);
    return [
      scan.domain,
      scan.url.length > 50 ? scan.url.substring(0, 47) + '...' : scan.url,
      new Date(scan.created_at).toLocaleDateString(),
      scan.scan_status,
      technologies.length.toString(),
      technologies.slice(0, 3).join(', ') + (technologies.length > 3 ? '...' : '')
    ];
  });

  // Generate table
  autoTable(doc, {
    startY: 32,
    head: [['Domain', 'URL', 'Scan Date', 'Status', 'Tech Count', 'Technologies']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 180, 216],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 60 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 85 }
    },
    margin: { top: 32 }
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
};

// Helper function to download blob
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};