import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, CompanyProfile } from '../types';
import { formatCurrency, formatCurrencyDec, numberToWords, getTodayDate } from './formatters';

/**
 * Downloads a reliable, crisp, vector-rendered A4 Tax Invoice PDF using jsPDF.
 * 
 * FIX FOR BUG #6: Triggers EXACTLY ONE download per click (no duplicate save + anchor click).
 * FIX FOR AMENDMENT #1: Reduced, compact Subtotal & Tax section sizing with tight spacing.
 * FIX FOR AMENDMENT #7: NET BALANCE PAYABLE amount displayed in pure WHITE (#FFFFFF) on dark navy banner.
 */
export async function downloadInvoicePDF(
  invoice: Invoice,
  companyProfile: CompanyProfile,
  customFilename?: string
): Promise<boolean> {
  try {
    const filename = customFilename || `${invoice.invoice_no}.pdf`;
    const sanitizedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const drawDivider = (currentY: number, color: [number, number, number] = [200, 205, 215]) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, pageWidth - margin, currentY);
    };

    // 1. Top Header Banner
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 30, 'F');
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.rect(margin, y, contentWidth, 30, 'S');

    // Company Name & Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text((companyProfile.name || 'ANORI TRANSPORT SERVICES').toUpperCase(), margin + 4, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const addrLine1 = companyProfile.addr_lines?.[0] || companyProfile.addr || 'Plot No. 12, Transport Nagar, Kalamboli, Navi Mumbai - 410218';
    const addrLine2 = companyProfile.addr_lines?.[1] || '';
    doc.text(addrLine1.slice(0, 75), margin + 4, y + 11);
    if (addrLine2) {
      doc.text(addrLine2.slice(0, 75), margin + 4, y + 15);
    }

    const regDetails = `GSTIN: ${companyProfile.gst || '27AAACA1234A1Z5'}  |  PAN: ${companyProfile.pan || 'AAACA1234A'}  |  Mob: ${companyProfile.phone || '+91 98200 12345'}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(regDetails, margin + 4, y + (addrLine2 ? 19.5 : 17));

    // Right Side: Tax Invoice Title & Number
    const isGst = invoice.is_gst && invoice.tax_type !== 'none';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text(isGst ? 'TAX INVOICE' : 'COMMERCIAL INVOICE', pageWidth - margin - 4, y + 6.5, { align: 'right' });

    doc.setFillColor(239, 246, 255);
    doc.roundedRect(pageWidth - margin - 58, y + 9.5, 54, 11, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('INVOICE NO.', pageWidth - margin - 31, y + 13.5, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(invoice.invoice_no, pageWidth - margin - 31, y + 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date: ${invoice.date}   |   Due Date: ${invoice.due_date}`, pageWidth - margin - 4, y + 26.5, { align: 'right' });

    y += 33;

    // 2. Bill To & Terms Cards
    const colWidth = (contentWidth - 4) / 2;
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, colWidth, 24, 1, 1, 'FD');
    doc.roundedRect(margin + colWidth + 4, y, colWidth, 24, 1, 1, 'FD');

    // Bill To
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('BILL TO (CUSTOMER / CONSIGNEE)', margin + 3, y + 4.5);
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text((invoice.party_name || 'Valued Customer').slice(0, 42), margin + 3, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text((invoice.party_addr || 'Address on record').slice(0, 50), margin + 3, y + 13.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${invoice.party_gst || 'UNREGISTERED'}`, margin + 3, y + 18);

    // Terms
    const rightColX = margin + colWidth + 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('BILLING TERMS & DETAILS', rightColX, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(`Credit Period: `, rightColX, y + 9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoice.credit_days || 0} Days ${invoice.credit_days === 0 ? '(Immediate Payment)' : ''}`, rightColX + 22, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tax Mode: `, rightColX, y + 13.5);
    doc.setFont('helvetica', 'bold');
    const taxLabel = invoice.tax_type === 'igst' ? 'IGST @ 18%' : isGst ? 'CGST (9%) + SGST (9%)' : 'None (Exempt)';
    doc.text(taxLabel, rightColX + 22, y + 13.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Trips: `, rightColX, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoice.trip_count || invoice.trip_ids.length} Trip(s)`, rightColX + 22, y + 18);

    y += 27;

    // 3. Trips Table Header
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('#', margin + 2, y + 4.5);
    doc.text('Date', margin + 7, y + 4.5);
    doc.text('Trip No.', margin + 24, y + 4.5);
    doc.text('Vehicle', margin + 45, y + 4.5);
    doc.text('Route (Origin -> Destination)', margin + 72, y + 4.5);
    doc.text('Freight (Rs.)', margin + 142, y + 4.5, { align: 'right' });
    doc.text('Advance', margin + 162, y + 4.5, { align: 'right' });
    doc.text('Net (Rs.)', margin + contentWidth - 2, y + 4.5, { align: 'right' });

    y += 6.5;

    // 4. Trips Table Rows
    const trips = invoice.trips_data || [];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    trips.forEach((t, i) => {
      if (y > 220) {
        doc.addPage();
        y = margin;
      }
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 6, 'F');
      }
      doc.setTextColor(30, 41, 59);
      doc.text(String(i + 1), margin + 2, y + 4.2);
      doc.text(t.date || '', margin + 7, y + 4.2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(t.trip_no || '', margin + 24, y + 4.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text((t.vehicle_number || t.vehicle_manual || '').slice(0, 14), margin + 45, y + 4.2);
      const routeStr = `${t.from || ''} -> ${t.to || ''}`.slice(0, 34);
      doc.text(routeStr, margin + 72, y + 4.2);
      doc.text((t.freight || 0).toLocaleString('en-IN'), margin + 142, y + 4.2, { align: 'right' });
      doc.text((t.trip_advance_amount || 0).toLocaleString('en-IN'), margin + 162, y + 4.2, { align: 'right' });
      const netTrip = (t.freight || 0) - (t.trip_advance_amount || 0);
      doc.setFont('helvetica', 'bold');
      doc.text(netTrip.toLocaleString('en-IN'), margin + contentWidth - 2, y + 4.2, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      drawDivider(y + 6, [235, 238, 243]);
      y += 6;
    });

    // 5. Additional Charges / Expense Lines
    if (invoice.expense_lines && invoice.expense_lines.length > 0) {
      invoice.expense_lines.forEach((exp) => {
        if (y > 225) {
          doc.addPage();
          y = margin;
        }
        doc.setFillColor(254, 252, 232);
        doc.rect(margin, y, contentWidth, 5.5, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(113, 63, 18);
        doc.text(`+ Additional Charge: ${exp.name}`, margin + 8, y + 3.8);
        doc.setFont('helvetica', 'bold');
        doc.text((exp.amount || 0).toLocaleString('en-IN'), margin + contentWidth - 2, y + 3.8, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        drawDivider(y + 5.5, [245, 230, 180]);
        y += 5.5;
      });
    }

    y += 2.5;

    // 6. Compact Summary Calculation Box & Bank Details (AMENDMENT #1: Reduced size & spacing)
    if (y > 218) {
      doc.addPage();
      y = margin;
    }

    const summaryY = y;
    const leftBoxWidth = 96;
    const rightBoxWidth = contentWidth - leftBoxWidth - 4;
    const rightBoxX = margin + leftBoxWidth + 4;

    // Left Box: Bank Details & Amount In Words
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, summaryY, leftBoxWidth, 34, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text('REMITTANCE BANK DETAILS', margin + 3, summaryY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank Name: `, margin + 3, summaryY + 9);
    doc.setFont('helvetica', 'bold');
    doc.text(companyProfile.bank_name || 'HDFC Bank Ltd', margin + 22, summaryY + 9);

    doc.setFont('helvetica', 'normal');
    doc.text(`Account No: `, margin + 3, summaryY + 13);
    doc.setFont('helvetica', 'bold');
    doc.text(companyProfile.acc || '50200012345678', margin + 22, summaryY + 13);

    doc.setFont('helvetica', 'normal');
    doc.text(`IFSC Code: `, margin + 3, summaryY + 17);
    doc.setFont('helvetica', 'bold');
    doc.text(companyProfile.bank || 'HDFC0001234', margin + 22, summaryY + 17);

    // Amount in Words
    doc.setDrawColor(226, 232, 240);
    doc.line(margin + 2, summaryY + 20, margin + leftBoxWidth - 2, summaryY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('AMOUNT IN WORDS:', margin + 3, summaryY + 23.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    const inWords = numberToWords(Math.round(invoice.balance_due || invoice.total_amount));
    const splitWords = doc.splitTextToSize(`INR ${inWords}`, leftBoxWidth - 6);
    doc.text(splitWords, margin + 3, summaryY + 27);

    // Right Box: Compact Financial Breakdown (AMENDMENT #1: Reduced padding & compact text)
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(rightBoxX, summaryY, rightBoxWidth, 34, 1, 1, 'FD');

    let curCalcY = summaryY + 4;
    const addCalcLine = (label: string, value: number, isBold = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text(label, rightBoxX + 3.5, curCalcY);
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, rightBoxX + rightBoxWidth - 3.5, curCalcY, { align: 'right' });
      curCalcY += 3.8;
    };

    addCalcLine('Subtotal (Trips + Charges)', invoice.subtotal || 0);

    if (invoice.is_gst && invoice.tax_type !== 'none') {
      if (invoice.tax_type === 'cgst_sgst') {
        addCalcLine('CGST @ 9%', invoice.cgst || 0);
        addCalcLine('SGST @ 9%', invoice.sgst || 0);
      } else if (invoice.tax_type === 'igst') {
        addCalcLine('IGST @ 18%', invoice.igst || 0);
      }
    }

    if ((invoice.advance || 0) > 0) {
      addCalcLine('Less: Advance Received', -(invoice.advance || 0));
    }

    // AMENDMENT #1 & #7: NET BALANCE PAYABLE Banner
    // Background is dark navy (RGB: 15, 23, 42)
    // Amount & currency must be PURE WHITE (#FFFFFF), NOT BLUE!
    const bannerHeight = 8.5;
    const bannerY = summaryY + 34 - bannerHeight;
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(rightBoxX, bannerY, rightBoxWidth, bannerHeight, 0, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255); // White label
    doc.text('NET BALANCE PAYABLE', rightBoxX + 3.5, bannerY + 5.5);

    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255); // AMENDMENT #7: Explicitly WHITE (NOT BLUE #60a5fa)
    doc.text(
      `Rs. ${(invoice.balance_due || invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      rightBoxX + rightBoxWidth - 3.5,
      bannerY + 5.5,
      { align: 'right' }
    );

    y = summaryY + 37;

    // 7. Stamp & Signature Box (Single Uploaded Image)
    if (y > 235) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, 22, 1, 1, 'FD');

    // Left terms
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Terms & Conditions:', margin + 3, y + 4);
    doc.text('1. Payment is strictly due according to agreed credit terms (0 days / Immediate unless noted).', margin + 3, y + 7.5);
    doc.text('2. Interest @ 18% p.a. charged on all overdue settlements.', margin + 3, y + 10.5);
    doc.text('3. Subject to local jurisdiction. Computer-generated tax document.', margin + 3, y + 13.5);

    // Right Signatory & Stamp Box
    const signX = pageWidth - margin - 58;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`FOR ${(companyProfile.name || 'ANORI TRANSPORT SERVICES').toUpperCase()}`, pageWidth - margin - 3, y + 4, { align: 'right' });

    if (companyProfile.stamp_signature_image) {
      try {
        doc.addImage(
          companyProfile.stamp_signature_image,
          'PNG',
          signX + 6,
          y + 5,
          46,
          12,
          undefined,
          'FAST'
        );
      } catch (imgErr) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.text('[ Stamp & Signature Attached ]', pageWidth - margin - 3, y + 11.5, { align: 'right' });
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('(Company Rubber Stamp & Signature)', pageWidth - margin - 3, y + 11.5, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Authorized Signatory', pageWidth - margin - 3, y + 19, { align: 'right' });

    // FIX FOR BUG #6: Download EXACTLY ONCE via a single clean blob download anchor
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = sanitizedFilename;
    downloadAnchor.style.display = 'none';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    setTimeout(() => {
      downloadAnchor.remove();
      URL.revokeObjectURL(blobUrl);
    }, 500);

    return true;
  } catch (err) {
    console.error('downloadInvoicePDF error:', err);
    return false;
  }
}

/**
 * Downloads any tabular report as an A4 Landscape or Portrait PDF.
 * Ensures readable text, correct column widths, no clipped content, and EXACTLY ONE download.
 */
export async function downloadReportPDF(
  reportTitle: string,
  columns: { header: string; dataKey: string; width?: number; align?: 'left' | 'right' | 'center' }[],
  data: Record<string, any>[],
  filename: string,
  subtitle?: string
): Promise<boolean> {
  try {
    const sanitizedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const orientation = columns.length > 5 ? 'landscape' : 'portrait';
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Header Title Banner
    doc.setFillColor(15, 23, 42); // Navy
    doc.rect(margin, y, contentWidth, 16, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(`ANORI TRANSPORT ERP - ${reportTitle.toUpperCase()}`, margin + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    const sub = subtitle || `Generated on: ${getTodayDate()} | Total Records: ${data.length}`;
    doc.text(sub, margin + 4, y + 12);

    y += 20;

    // Calculate Column Widths
    const totalCustomWidth = columns.reduce((acc, c) => acc + (c.width || 0), 0);
    const columnsWithoutWidth = columns.filter((c) => !c.width);
    const remainingWidth = contentWidth - totalCustomWidth;
    const defaultColWidth = columnsWithoutWidth.length > 0 ? remainingWidth / columnsWithoutWidth.length : 30;

    const colWidths = columns.map((c) => c.width || defaultColWidth);

    // Draw Table Header
    const drawTableHeader = () => {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(margin, y, contentWidth, 7, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      let curX = margin;
      columns.forEach((col, idx) => {
        const w = colWidths[idx];
        const align = col.align || 'left';
        let textX = curX + 2;
        if (align === 'right') textX = curX + w - 2;
        else if (align === 'center') textX = curX + w / 2;

        doc.text(col.header, textX, y + 4.8, { align });
        curX += w;
      });

      y += 7;
    };

    drawTableHeader();

    // Draw Data Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    data.forEach((row, rowIdx) => {
      if (y > pageHeight - 18) {
        doc.addPage();
        y = margin;
        drawTableHeader();
      }

      if (rowIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 6, 'F');
      }

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);

      doc.setTextColor(30, 41, 59);

      let curX = margin;
      columns.forEach((col, idx) => {
        const w = colWidths[idx];
        const align = col.align || 'left';
        let rawVal = row[col.dataKey];
        if (rawVal === undefined || rawVal === null) rawVal = '-';
        const strVal = String(rawVal);

        let textX = curX + 2;
        if (align === 'right') textX = curX + w - 2;
        else if (align === 'center') textX = curX + w / 2;

        // Truncate if too long to prevent clipping
        const maxLen = Math.floor(w / 1.7);
        const displayVal = strVal.length > maxLen ? strVal.slice(0, maxLen - 2) + '..' : strVal;

        doc.text(displayVal, textX, y + 4.2, { align });
        curX += w;
      });

      y += 6;
    });

    // Footer with Page Numbers
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Anori Transport ERP - Page ${p} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    // FIX FOR BUG #6: EXACTLY ONE single download
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = sanitizedFilename;
    downloadAnchor.style.display = 'none';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    setTimeout(() => {
      downloadAnchor.remove();
      URL.revokeObjectURL(blobUrl);
    }, 500);

    return true;
  } catch (err) {
    console.error('downloadReportPDF error:', err);
    return false;
  }
}

/**
 * Downloads any DOM element as a PDF with protective cloning.
 * FIX: Guarantees single download without duplicate save + anchor click.
 */
export async function downloadElementAsPDF(
  element: HTMLElement,
  filename = 'document.pdf'
): Promise<boolean> {
  try {
    const sanitizedFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style) {
            if (htmlEl.style.color && htmlEl.style.color.includes('oklch')) {
              htmlEl.style.color = '#1e293b';
            }
            if (htmlEl.style.backgroundColor && htmlEl.style.backgroundColor.includes('oklch')) {
              htmlEl.style.backgroundColor = '#ffffff';
            }
          }
        });
      },
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgHeightInPdf = (canvasHeight * pdfWidth) / canvasWidth;

    if (imgHeightInPdf <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightInPdf, undefined, 'FAST');
    } else {
      let heightLeft = imgHeightInPdf;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeightInPdf;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    // Single download via blob
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = sanitizedFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(blobUrl);
    }, 500);

    return true;
  } catch (error) {
    console.error('Error in downloadElementAsPDF:', error);
    return false;
  }
}
