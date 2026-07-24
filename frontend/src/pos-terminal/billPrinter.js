import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { amountToWords } from './numberToWords';

const MARGIN = 8;

// POSCHK01 - generates the customer bill PDF matching the standard reference
// layout: centered header (group name / outlet name / address), a bordered
// Bill Info box (Bill No/Date/Time/NC Dept | Tbl No/Steward/Pax/Guest Name),
// then an itemized table with Sr No, category "Group Name" section rows,
// inline item notes, Sub Total / tax / Bill Total (bold), Amount In Words,
// and the KOT number(s) this bill's items were sent under.
export function generateBillPdf({
  groupName, outletName, addressName, currencyCode,
  billNo, billDate, billTime, ncDept,
  tableCode, steward, pax, guestName,
  items, // [{ categoryName, item_name, notes, qty, rate, value }]
  taxLabel, taxAmount, subTotal, billTotal,
  kotNumbers
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  const centerX = pageWidth / 2;
  let y = 12;

  doc.setFont(undefined, 'bold');
  doc.setFontSize(14);
  doc.text(groupName || '', centerX, y, { align: 'center' }); y += 6;

  doc.setFontSize(12);
  doc.text(outletName || '', centerX, y, { align: 'center' }); y += 6;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  const addressLines = doc.splitTextToSize(addressName || '', contentWidth - 20);
  addressLines.forEach(line => { doc.text(line, centerX, y, { align: 'center' }); y += 4.5; });
  y += 3;

  // Bill Info box - two side-by-side label:value columns, bordered
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: contentWidth,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: [180, 180, 180], lineWidth: 0.1 },
    body: [
      ['Bill No', billNo, 'Tbl No', tableCode],
      ['Bill Date', billDate, 'Steward', steward || ''],
      ['Bill Time', billTime, 'Pax', String(pax || '')],
      ['NC Dept', ncDept || '', 'Guest Name', guestName || '']
    ],
    columnStyles: {
      0: { cellWidth: contentWidth * 0.20, fontStyle: 'bold' },
      1: { cellWidth: contentWidth * 0.30 },
      2: { cellWidth: contentWidth * 0.20, fontStyle: 'bold' },
      3: { cellWidth: contentWidth * 0.30 }
    }
  });

  y = doc.lastAutoTable.finalY + 4;

  // Item table body, with a bold section-header row inserted whenever the
  // item's category changes.
  const body = [];
  let lastCategory = null;
  let srNo = 0;
  items.forEach(item => {
    if (item.categoryName && item.categoryName !== lastCategory) {
      body.push([{ content: item.categoryName, colSpan: 5, styles: { fontStyle: 'bold', fillColor: [235, 235, 235], halign: 'left' } }]);
      lastCategory = item.categoryName;
    }
    srNo += 1;
    const itemCell = item.notes ? `${item.item_name}\n(${item.notes})` : item.item_name;
    body.push([String(srNo), itemCell, String(item.qty), item.rate.toFixed(2), item.value.toFixed(2)]);
  });

  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: contentWidth,
    head: [['Sr No', 'Item Name', 'Qty', 'Rate', 'Value']],
    body,
    foot: [
      [{ content: 'Sub Total', colSpan: 2, styles: { fontStyle: 'bold' } }, String(totalQty), '', subTotal.toFixed(2)],
      [{ content: taxLabel, colSpan: 2 }, '', '', taxAmount.toFixed(2)],
      [{ content: 'Bill Total', colSpan: 2, styles: { fontStyle: 'bold' } }, '', '', { content: billTotal.toFixed(2), styles: { fontStyle: 'bold' } }]
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 1.5, overflow: 'linebreak', valign: 'top' },
    headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0] },
    footStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'normal', lineColor: [180, 180, 180], lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.10, halign: 'center' },
      1: { cellWidth: contentWidth * 0.40, halign: 'left' },
      2: { cellWidth: contentWidth * 0.15, halign: 'center' },
      3: { cellWidth: contentWidth * 0.15, halign: 'right' },
      4: { cellWidth: contentWidth * 0.20, halign: 'right' }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const wordsLines = doc.splitTextToSize(`Amount In Words: ${amountToWords(billTotal, currencyCode)}`, contentWidth);
  wordsLines.forEach(line => { doc.text(line, MARGIN, y); y += 4.5; });
  y += 3;

  const kotList = kotNumbers && kotNumbers.length
    ? kotNumbers.map(n => String(n).padStart(3, '0')).join(', ')
    : '-';
  doc.text(`KOT No's : ${kotList}`, MARGIN, y);

  doc.save(`bill-${billNo}.pdf`);
}
