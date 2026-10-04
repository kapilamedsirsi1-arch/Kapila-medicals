import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Order, Payment, Party, Expense, Staff } from '../types';

export const COMPANY_HEADER = {
  name: 'M/s. KAPILA MEDICAL AGENCIES',
  tagline: 'Wholesale Pharmaceutical Distributors & Hospital Suppliers',
  address: '770/1,2, CTS No. 13A1, Basement & Ground Floor, Court Road, Sirsi – 581401, Karnataka',
  gstin: 'GSTIN: 29AABFK9897N1Z7',
  dl: 'D.L. No.: KA-UK-20B-224411 / KA-UK-21B-224412',
  phone: 'Phone: +91 94481 23456 / 08384-226101',
  email: 'Email: kapilamedsirsi1@gmail.com',
};

// --- Excel Exports ---
export function exportToExcel(data: any[], fileName: string, sheetName = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportOrdersToExcel(orders: Order[]) {
  const rows = orders.flatMap((o) =>
    o.items.map((item) => ({
      'Order No': o.orderNumber,
      Date: o.date,
      Time: o.time,
      'Party Name': o.partyName,
      'Staff / Tour Boy': o.staffName,
      Status: o.status,
      Product: item.productName,
      Company: item.companyName,
      Pack: item.packSize,
      MRP: item.mrp,
      PTR: item.ptr,
      Qty: item.quantity,
      'Free (Scheme)': item.freeQuantity,
      'Basic Amt': item.basicAmount,
      'GST %': item.gstRate,
      'GST Amt': item.gstAmount,
      'Net Amt': item.netAmount,
      'Grand Order Total': o.grandTotal,
    }))
  );
  exportToExcel(rows, 'Kapila_Orders_Report', 'Orders');
}

export function exportCollectionsToExcel(payments: Payment[]) {
  const rows = payments.map((p) => ({
    'Receipt No': p.receiptNumber,
    Date: p.date,
    Time: p.time,
    Party: p.partyName,
    'Collected By': p.staffName,
    Mode: p.mode,
    'Amount (₹)': p.amount,
    'Outstanding Before (₹)': p.outstandingBefore,
    'Outstanding After (₹)': p.outstandingAfter,
    'Cheque / Ref No': p.chequeDetails?.chequeNumber || p.upiDetails?.transactionId || '-',
    Bank: p.chequeDetails?.bankName || '-',
    'Cheque Status': p.chequeDetails?.status || '-',
    Remarks: p.remarks || '',
  }));
  exportToExcel(rows, 'Kapila_Collections_Report', 'Collections');
}

export function exportOutstandingToExcel(parties: Party[]) {
  const rows = parties.map((p) => {
    // calculate estimated ageing bracket
    const out = p.currentOutstanding;
    const bucket0_30 = out > 0 ? Math.min(out, p.currentOutstanding * 0.5) : 0;
    const bucket31_60 = out > bucket0_30 ? Math.min(out - bucket0_30, p.currentOutstanding * 0.3) : 0;
    const bucket61_90 = out > bucket0_30 + bucket31_60 ? Math.min(out - bucket0_30 - bucket31_60, p.currentOutstanding * 0.15) : 0;
    const bucket90_plus = Math.max(0, out - (bucket0_30 + bucket31_60 + bucket61_90));

    return {
      'Party Code': p.customerCode,
      'Party Name': p.name,
      Type: p.customerType,
      Area: p.area,
      City: p.city,
      Mobile: p.mobile,
      GSTIN: p.gstin,
      'Drug Licence': p.drugLicence,
      'Credit Limit (₹)': p.creditLimit,
      'Credit Days': p.creditDays,
      'Total Outstanding (₹)': p.currentOutstanding,
      '0-30 Days': Math.round(bucket0_30),
      '31-60 Days': Math.round(bucket31_60),
      '61-90 Days': Math.round(bucket61_90),
      '90+ Days (Overdue)': Math.round(bucket90_plus),
    };
  });
  exportToExcel(rows, 'Kapila_Outstanding_Ageing_Report', 'Outstanding');
}

export function exportExpensesToExcel(expenses: Expense[]) {
  const rows = expenses.map((e) => ({
    Date: e.date,
    'Staff Name': e.staffName,
    Category: e.category,
    'Amount (₹)': e.amount,
    'GST Amt (₹)': e.gstAmount || 0,
    Location: e.location,
    Description: e.description,
    'Payment Mode': e.paymentMode,
    'Bill Number': e.billNumber || '-',
    Status: e.status,
    'Admin Remarks': e.adminRemarks || '',
  }));
  exportToExcel(rows, 'Kapila_Staff_Expenses_Report', 'Expenses');
}

// --- PDF Generation ---

// 1. Payment Receipt PDF
export function generatePaymentReceiptPdf(payment: Payment) {
  const doc = new jsPDF();

  // Header Box
  doc.setFillColor(2, 132, 199);
  doc.rect(10, 10, 190, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_HEADER.name, 105, 20, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_HEADER.address, 105, 28, { align: 'center' });

  // Sub Header
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.text(`${COMPANY_HEADER.gstin}  |  ${COMPANY_HEADER.dl}`, 105, 39, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(10, 43, 200, 43);

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text('OFFICIAL PAYMENT RECEIPT', 105, 52, { align: 'center' });

  // Receipt meta
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);

  doc.text(`Receipt No: ${payment.receiptNumber}`, 15, 63);
  doc.text(`Date & Time: ${payment.date} ${payment.time}`, 140, 63);
  doc.text(`Payment Mode: ${payment.mode}`, 15, 71);
  doc.text(`Collected By: ${payment.staffName}`, 140, 71);

  // Box for Party Details
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(15, 78, 180, 26, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(`Received With Thanks From:`, 20, 86);
  doc.setFontSize(12);
  doc.setTextColor(2, 132, 199);
  doc.text(payment.partyName, 20, 93);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Party ID / Customer Account Ref`, 20, 99);

  // Amount Highlight Box
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(15, 110, 180, 24, 3, 3, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('AMOUNT RECEIVED:', 22, 122);
  doc.setFontSize(16);
  doc.text(`INR ${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 22, 130);

  // Cheque / Bank Details if any
  let yPos = 144;
  if (payment.mode === 'CHEQUE' && payment.chequeDetails) {
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text('CHEQUE DETAILS:', 15, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Cheque No: ${payment.chequeDetails.chequeNumber}`, 15, yPos);
    doc.text(`Date: ${payment.chequeDetails.chequeDate}`, 85, yPos);
    doc.text(`Bank: ${payment.chequeDetails.bankName}`, 140, yPos);
    yPos += 7;
    doc.text(`Cheque Status: ${payment.chequeDetails.status} (Subject to Realization)`, 15, yPos);
    yPos += 12;
  } else if (payment.mode === 'UPI' && payment.upiDetails) {
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text('ELECTRONIC TRANSFER DETAILS:', 15, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`UPI / UTR Ref: ${payment.upiDetails.transactionId}`, 15, yPos);
    yPos += 12;
  }

  // Outstanding Accounting Section
  doc.setFillColor(248, 250, 252);
  doc.rect(15, yPos, 180, 28, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(70, 70, 70);
  doc.text('ACCOUNT OUTSTANDING SUMMARY', 20, yPos + 8);

  doc.setFont('helvetica', 'normal');
  doc.text(`Previous Outstanding: INR ${payment.outstandingBefore.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, yPos + 16);
  doc.text(`Payment Credit: (-) INR ${payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, yPos + 23);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`Balance Outstanding: INR ${payment.outstandingAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 110, yPos + 23);

  yPos += 45;

  // Signatures
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Staff / Field Collector Signature', 20, yPos);
  doc.text('For M/s. KAPILA MEDICAL AGENCIES', 130, yPos);
  doc.text('(Authorised Signatory)', 142, yPos + 12);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer generated official payment receipt from Kapila Medical Agencies ERP.', 105, 285, { align: 'center' });

  doc.save(`${payment.receiptNumber}_Payment_Receipt.pdf`);
}

// 2. Order Summary PDF
export function generateOrderSummaryPdf(order: Order) {
  const doc = new jsPDF();

  // Header Box
  doc.setFillColor(2, 132, 199);
  doc.rect(10, 10, 190, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_HEADER.name, 105, 19, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${COMPANY_HEADER.address} | ${COMPANY_HEADER.gstin}`, 105, 26, { align: 'center' });

  // Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text('SALES ORDER BOOKING SUMMARY', 105, 40, { align: 'center' });

  // Order Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Order No: ${order.orderNumber}`, 15, 48);
  doc.text(`Date: ${order.date} ${order.time}`, 140, 48);
  doc.text(`Party: ${order.partyName}`, 15, 54);
  doc.text(`Staff: ${order.staffName}`, 140, 54);
  doc.text(`Address: ${order.partyAddress}`, 15, 60);
  doc.text(`Status: ${order.status}`, 140, 60);

  // Table Header
  let y = 68;
  doc.setFillColor(240, 244, 248);
  doc.rect(15, y, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Item / Product Name', 18, y + 5);
  doc.text('Pack', 90, y + 5);
  doc.text('PTR', 110, y + 5);
  doc.text('Qty', 130, y + 5);
  doc.text('Free', 145, y + 5);
  doc.text('GST%', 160, y + 5);
  doc.text('Total (₹)', 175, y + 5);

  y += 10;
  doc.setFont('helvetica', 'normal');
  order.items.forEach((item) => {
    doc.text(item.productName.substring(0, 34), 18, y);
    doc.text(item.packSize, 90, y);
    doc.text(item.ptr.toFixed(2), 110, y);
    doc.text(String(item.quantity), 130, y);
    doc.text(String(item.freeQuantity || 0), 145, y);
    doc.text(`${item.gstRate}%`, 160, y);
    doc.text(item.netAmount.toFixed(2), 175, y);
    y += 7;
  });

  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 6;

  // Totals
  doc.setFont('helvetica', 'bold');
  doc.text(`Basic Total: INR ${order.basicTotal.toFixed(2)}`, 130, y);
  y += 6;
  doc.text(`GST Total: INR ${order.gstTotal.toFixed(2)}`, 130, y);
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text(`Grand Total: INR ${order.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 115, y);

  if (order.remarks) {
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text(`Remarks / Delivery Instruction: ${order.remarks}`, 15, y);
  }

  doc.save(`${order.orderNumber}_Summary.pdf`);
}
