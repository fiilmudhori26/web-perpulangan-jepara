import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Core: Export array of objects to Excel (.xlsx)
 */
function exportExcelCore(data, filename = 'export', sheetName = 'Data') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...data.map(r => String(Object.values(r)[i] || '').length)
    );
    return { wch: Math.min(maxLen + 3, 40) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Core: Export array of objects to PDF via jsPDF + jspdf-autotable
 */
function exportPDFCore(data, columns, filename = 'export', title = '', opts = {}) {
  const { fontSize = 8, landscape = false } = opts;

  const doc = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Pondok Pesantren', 14, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Sistem Informasi Perpulangan Santri', 14, 24);

  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, 14, 32);
  }

  const yStart = title ? 36 : 30;
  doc.setDrawColor(200);
  doc.line(14, yStart - 2, doc.internal.pageSize.width - 14, yStart - 2);

  const body = data.map(row =>
    columns.map(c => {
      const val = row[c.key];
      return val !== null && val !== undefined ? String(val) : '';
    })
  );

  doc.autoTable({
    startY: yStart,
    head: [columns.map(c => c.label)],
    body,
    theme: 'grid',
    styles: { fontSize, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.2 },
    headStyles: { fillColor: [25, 118, 210], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: fontSize + 1 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    margin: { top: 20 },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — Halaman ${i} dari ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${filename}.pdf`);
}

/**
 * ===== NEW API (dipakai halaman baru) =====
 */
export function exportExcel(data, filename = 'export', sheetName = 'Data') {
  return exportExcelCore(data, filename, sheetName);
}

export function exportPDF(data, columns, filename = 'export', title = '', opts = {}) {
  return exportPDFCore(data, columns, filename, title, opts);
}

/**
 * ===== LEGACY API (kompatibel halaman lama) =====
 * Terima objek: { title, headers, rows, filename, orientation/subtitle }
 */
export function exportToExcel({ title = 'Data', headers = [], rows = [], filename = 'export' }) {
  const data = rows.map((row, i) => {
    const obj = {};
    headers.forEach((h, j) => { obj[h] = row[j]; });
    return obj;
  });
  return exportExcelCore(data, filename, title);
}

export function exportToPDF({
  title = 'Laporan',
  subtitle = '',
  headers = [],
  rows = [],
  filename = 'export',
  orientation,
}) {
  const columns = headers.map(h => ({ label: h, key: h.toLowerCase().replace(/\s+/g, '') }));
  const data = rows.map((row, i) => {
    const obj = {};
    headers.forEach((h, j) => { obj[columns[j].key] = row[j]; });
    return obj;
  });
  return exportPDFCore(data, columns, filename, title, { subtitle, orientation });
}

export function prepareExportData(data, columns) {
  const headers = columns.map(c => c.label);
  const rows = data.map(item =>
    columns.map(col =>
      col.render ? String(col.render(item)).replace(/<[^>]*>/g, '').trim() : String(item[col.key] ?? '')
    )
  );
  return { headers, rows };
}