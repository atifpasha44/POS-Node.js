import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MARGIN_MM = 4;

// POSKOT01 - generates a Kitchen Order Token PDF matching the standard KOT layout:
// outlet name, "Kitchen Order Token", bold KOT number, date/time, table, steward -
// all center-aligned consistently - then a real Item/Qty/Notes table (no price/tax,
// KOT is kitchen-facing, not billing). The table renderer (not hand-placed text)
// is what keeps columns aligned regardless of item-name length or qty digit count,
// and wraps long content instead of overlapping the next column.
//
// paperWidthMm defaults to 80mm (common thermal receipt width); pass 58 for
// narrower printers - the column math below is proportional, so it holds at
// either width.
export function generateKotPdf({ outletName, kotNo, tableCode, steward, items, isReprint, paperWidthMm = 80 }) {
  const pageWidth = paperWidthMm;
  const centerX = pageWidth / 2;
  const contentWidth = pageWidth - MARGIN_MM * 2;

  // Generous height estimate - receipt paper is a continuous roll, not a fixed
  // page, so erring tall (rather than risking cut-off content) is the safe side.
  const doc = new jsPDF({ unit: 'mm', format: [pageWidth, 65 + items.length * 14] });
  let y = 8;

  const centerText = (text, fontSize, bold) => {
    doc.setFontSize(fontSize);
    doc.setFont(undefined, bold ? 'bold' : 'normal');
    doc.text(text, centerX, y, { align: 'center' });
  };

  centerText(outletName || '', 11, true); y += 6;
  centerText('Kitchen Order Token', 10, false); y += 6;

  if (isReprint) {
    doc.setTextColor(200, 0, 0);
    centerText('** REPRINT **', 9, true);
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  centerText(`KOT NO : ${String(kotNo).padStart(3, '0')}`, 12, true); y += 6;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  centerText(`${dateStr}  ${timeStr}`, 9, false); y += 5;
  centerText(`Table ${tableCode}`, 9, false); y += 5;
  if (steward) { centerText(`Steward: ${steward}`, 9, false); y += 5; }

  y += 2;

  const statusLabel = isReprint ? 'REPRINT' : 'Confirmed';

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN_MM, right: MARGIN_MM },
    tableWidth: contentWidth,
    head: [['Item', 'Qty', 'Notes', 'Status']],
    body: items.map(i => [i.item_name, String(i.qty), i.notes || '', statusLabel]),
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1, overflow: 'linebreak', valign: 'top' },
    headStyles: { fontStyle: 'bold', halign: 'left', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.38, halign: 'left' },
      1: { cellWidth: contentWidth * 0.12, halign: 'center' },
      2: { cellWidth: contentWidth * 0.26, halign: 'left', fontStyle: 'italic', fontSize: 8 },
      3: { cellWidth: contentWidth * 0.24, halign: 'center', fontStyle: 'bold', fontSize: 8 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3 && isReprint) {
        data.cell.styles.textColor = [200, 0, 0];
      }
    }
  });

  const fileSuffix = isReprint ? '-REPRINT' : '';
  doc.save(`KOT-${String(kotNo).padStart(3, '0')}${fileSuffix}.pdf`);
}
