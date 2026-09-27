import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ExtractionResult } from '../types';

export interface SamplePreset {
  id: string;
  name: string;
  bank: string;
  description: string;
  badge: string;
  pages: number;
  generatePdf: () => Promise<{ base64: string; fileName: string; mimeType: string }>;
  presetResult: ExtractionResult;
}

/**
 * Generates a realistic 2-page Bank Checking Statement PDF using pdf-lib
 */
export async function generateCheckingPdf(): Promise<{ base64: string; fileName: string; mimeType: string }> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // PAGE 1
  const page1 = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page1.getSize();

  // Header Banner
  page1.drawRectangle({
    x: 40,
    y: height - 90,
    width: width - 80,
    height: 60,
    color: rgb(0.08, 0.22, 0.42),
  });

  page1.drawText('METROPOLITAN CHARTER BANK', {
    x: 60,
    y: height - 55,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('MONTHLY ACCOUNT STATEMENT', {
    x: 60,
    y: height - 75,
    size: 10,
    font: fontRegular,
    color: rgb(0.85, 0.9, 0.98),
  });

  // Statement Meta Info
  page1.drawText('Account Holder: Sarah Jenkins', { x: 45, y: height - 115, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page1.drawText('Account Number: 849204918234', { x: 45, y: height - 130, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
  page1.drawText('Statement Period: 2026-01-01 to 2026-01-31', { x: 340, y: height - 115, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page1.drawText('Currency: USD ($) | Page: 1 of 2', { x: 340, y: height - 130, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

  // Starting balance notice (should NOT be extracted as transaction)
  page1.drawRectangle({
    x: 40,
    y: height - 165,
    width: width - 80,
    height: 25,
    color: rgb(0.95, 0.96, 0.98),
  });
  page1.drawText('OPENING BALANCE AS OF 2026-01-01: $4,250.00 | CLOSING BALANCE: $8,790.35', {
    x: 50,
    y: height - 155,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.3, 0.4),
  });

  // Table Header
  const tableY = height - 200;
  page1.drawRectangle({
    x: 40,
    y: tableY,
    width: width - 80,
    height: 22,
    color: rgb(0.2, 0.3, 0.5),
  });

  page1.drawText('DATE', { x: 50, y: tableY + 6, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText('DESCRIPTION / DETAILS', { x: 120, y: tableY + 6, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText('DEBIT (-)', { x: 390, y: tableY + 6, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText('CREDIT (+)', { x: 460, y: tableY + 6, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page1.drawText('REF / NOTES', { x: 520, y: tableY + 6, size: 8, font: fontBold, color: rgb(1, 1, 1) });

  // Rows for Page 1
  const page1Rows = [
    { date: '2026-01-02', desc1: 'PAYROLL DIRECT DEP - ACME CORP', desc2: 'EMP #48920 PAY PERIOD 24', debit: '', credit: '3,850.00', ref: 'DIR-DEP' },
    { date: '2026-01-03', desc1: 'POS PURCHASE - CARREFOUR MARKET', desc2: 'STORE #042 DOWNTOWN', debit: '124.50', credit: '', ref: 'CARD 8812' },
    { date: '2026-01-04', desc1: 'ATM CASH WITHDRAWAL', desc2: 'MAIN STREET BRANCH ATM 02', debit: '200.00', credit: '', ref: 'ATM-9102' },
    { date: '2026-01-05', desc1: 'AMAZON WEB SERVICES', desc2: 'CLOUD SERVICES INV-991204', debit: '85.40', credit: '', ref: 'WEB-PAY' },
    { date: '2026-01-07', desc1: 'MOBILE TRANSFER TO J. DOE', desc2: 'DINNER REIMBURSEMENT', debit: '45.00', credit: '', ref: 'P2P-3419' },
    { date: '2026-01-10', desc1: 'ELECTRICITY BILL PAYMENT', desc2: 'STATE POWER & LIGHT ACC #4910', debit: '142.15', credit: '', ref: 'UTIL-881' },
    { date: '2026-01-12', desc1: 'CLIENT FREELANCE PAYMENT', desc2: 'DESIGN SERVICES MILESTONE 2', debit: '', credit: '1,200.00', ref: 'WIRE-IN' },
    { date: '2026-01-14', desc1: 'MONTHLY FIBER INTERNET', desc2: 'VERIZON ONLINE BILL #91204', debit: '79.99', credit: '', ref: 'AUTO-DEB' },
    { date: '2026-01-15', desc1: 'GAS STATION FUEL PURCHASE', desc2: 'SHELL OIL #4812 PUMP 04', debit: '52.30', credit: '', ref: 'CARD 8812' },
    { date: '2026-01-18', desc1: 'ANNUAL SUBSCRIPTION RENEWAL', desc2: 'GITHUB DEVELOPER PRO PACK', debit: '96.00', credit: '', ref: 'ONLINE' },
  ];

  let currentY = tableY - 26;
  for (const r of page1Rows) {
    page1.drawText(r.date, { x: 50, y: currentY, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    page1.drawText(r.desc1, { x: 120, y: currentY, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page1.drawText(r.desc2, { x: 120, y: currentY - 10, size: 7, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    if (r.debit) page1.drawText(r.debit, { x: 390, y: currentY, size: 8, font: fontRegular, color: rgb(0.8, 0.1, 0.1) });
    if (r.credit) page1.drawText(r.credit, { x: 460, y: currentY, size: 8, font: fontRegular, color: rgb(0.1, 0.6, 0.2) });
    page1.drawText(r.ref, { x: 520, y: currentY, size: 7, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

    page1.drawLine({
      start: { x: 40, y: currentY - 14 },
      end: { x: width - 40, y: currentY - 14 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });

    currentY -= 28;
  }

  page1.drawText('[Statement continued on Page 2]', { x: 230, y: 35, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  // PAGE 2 (Multi-page continuation)
  const page2 = pdfDoc.addPage([612, 792]);
  
  // Header Page 2
  page2.drawRectangle({
    x: 40,
    y: height - 60,
    width: width - 80,
    height: 35,
    color: rgb(0.08, 0.22, 0.42),
  });

  page2.drawText('METROPOLITAN CHARTER BANK - STATEMENT (PAGE 2 OF 2)', {
    x: 50,
    y: height - 40,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page2.drawText('Account Number: 849204918234 | Period: 2026-01-01 to 2026-01-31', {
    x: 50,
    y: height - 80,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Table Header Page 2
  const table2Y = height - 110;
  page2.drawRectangle({
    x: 40,
    y: table2Y,
    width: width - 80,
    height: 22,
    color: rgb(0.2, 0.3, 0.5),
  });

  page2.drawText('DATE', { x: 50, y: table2Y + 6, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page2.drawText('DESCRIPTION / DETAILS', { x: 120, y: table2Y + 6, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page2.drawText('DEBIT (-)', { x: 390, y: table2Y + 6, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page2.drawText('CREDIT (+)', { x: 460, y: table2Y + 6, size: 8, font: fontBold, color: rgb(1, 1, 1) });
  page2.drawText('REF / NOTES', { x: 520, y: table2Y + 6, size: 8, font: fontBold, color: rgb(1, 1, 1) });

  const page2Rows = [
    { date: '2026-01-20', desc1: 'AIRLINE TICKET BOOKING', desc2: 'DELTA AIRLINES TKT #00681920', debit: '412.30', credit: '', ref: 'CARD 8812' },
    { date: '2026-01-22', desc1: 'HOTEL RESERVATION', desc2: 'HILTON HOTELS 2 NIGHTS STAY', debit: '298.00', credit: '', ref: 'HOTEL-NY' },
    { date: '2026-01-24', desc1: 'INTEREST CREDIT', desc2: 'HIGH YIELD CHECKING INTEREST APY 1.8%', debit: '', credit: '14.28', ref: 'INT-CRED' },
    { date: '2026-01-25', desc1: 'RESTAURANT BISTRO PAYMENT', desc2: 'THE FRENCH ROOFTOP DINING', debit: '88.50', credit: '', ref: 'CARD 8812' },
    { date: '2026-01-27', desc1: 'PAYROLL DIRECT DEP - ACME CORP', desc2: 'EMP #48920 PAY PERIOD 25', debit: '', credit: '3,850.00', ref: 'DIR-DEP' },
    { date: '2026-01-28', desc1: 'GROCERY SUPERMARKET', desc2: 'WHOLE FOODS MKT ORGANIC', debit: '165.20', credit: '', ref: 'CARD 8812' },
    { date: '2026-01-29', desc1: 'PHARMACY HEALTH CARE', desc2: 'CVS PHARMACY STORE #1980', debit: '34.85', credit: '', ref: 'RX-991' },
    { date: '2026-01-30', desc1: 'ACCOUNT MAINTENANCE FEE', desc2: 'STANDARD MONTHLY SERVICE FEE', debit: '12.00', credit: '', ref: 'BANK-FEE' },
    { date: '2026-01-31', desc1: 'STREAMING ENTERTAINMENT', desc2: 'NETFLIX PREMIUM 4K SUBSCRIPTION', debit: '22.99', credit: '', ref: 'RECUR' },
  ];

  let current2Y = table2Y - 26;
  for (const r of page2Rows) {
    page2.drawText(r.date, { x: 50, y: current2Y, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    page2.drawText(r.desc1, { x: 120, y: current2Y, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    page2.drawText(r.desc2, { x: 120, y: current2Y - 10, size: 7, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    if (r.debit) page2.drawText(r.debit, { x: 390, y: current2Y, size: 8, font: fontRegular, color: rgb(0.8, 0.1, 0.1) });
    if (r.credit) page2.drawText(r.credit, { x: 460, y: current2Y, size: 8, font: fontRegular, color: rgb(0.1, 0.6, 0.2) });
    page2.drawText(r.ref, { x: 520, y: current2Y, size: 7, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

    page2.drawLine({
      start: { x: 40, y: current2Y - 14 },
      end: { x: width - 40, y: current2Y - 14 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });

    current2Y -= 28;
  }

  // Summary box at bottom of page 2
  page2.drawRectangle({
    x: 40,
    y: current2Y - 35,
    width: width - 80,
    height: 35,
    color: rgb(0.96, 0.97, 0.99),
  });
  page2.drawText('TOTAL DEBITS: $1,510.93 | TOTAL CREDITS: $8,914.28 | ENDING BALANCE: $8,790.35', {
    x: 60,
    y: current2Y - 20,
    size: 8,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.3),
  });

  const pdfBytes = await pdfDoc.save();
  // Convert Uint8Array to base64 string
  let binary = '';
  const len = pdfBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(pdfBytes[i]);
  }
  const base64 = btoa(binary);

  return {
    base64,
    fileName: 'Metropolitan_Charter_Bank_Statement_Jan2026.pdf',
    mimeType: 'application/pdf',
  };
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'checking-multipage',
    name: 'Metropolitan Charter Bank (2-Page Checking PDF)',
    bank: 'Metropolitan Charter Bank',
    description: 'Multi-page PDF statement with multi-line POS purchases, payroll credits, ATM withdrawals, and maintenance fees across pages 1 & 2.',
    badge: 'Multi-Page PDF',
    pages: 2,
    generatePdf: generateCheckingPdf,
    presetResult: {
      statement_information: {
        bank_name: 'Metropolitan Charter Bank',
        account_holder: 'Sarah Jenkins',
        account_number: '849204918234',
        statement_period_start: '2026-01-01',
        statement_period_end: '2026-01-31',
        currency: 'USD',
      },
      transactions: [
        {
          id: 'tx-sample-1',
          transaction_date: '2026-01-02',
          transaction_title: 'Salary Credit',
          transaction_description: 'PAYROLL DIRECT DEP - ACME CORP EMP #48920 PAY PERIOD 24',
          amount: '3850.00',
          currency: 'USD',
          transaction_type: 'Credit',
          notes: 'DIR-DEP',
          page_number: 1,
          raw_transaction_text: '2026-01-02 PAYROLL DIRECT DEP - ACME CORP EMP #48920 PAY PERIOD 24 3,850.00 DIR-DEP',
        },
        {
          id: 'tx-sample-2',
          transaction_date: '2026-01-03',
          transaction_title: 'POS Purchase',
          transaction_description: 'POS PURCHASE - CARREFOUR MARKET STORE #042 DOWNTOWN',
          amount: '-124.50',
          currency: 'USD',
          transaction_type: 'Debit',
          notes: 'CARD 8812',
          page_number: 1,
          raw_transaction_text: '2026-01-03 POS PURCHASE - CARREFOUR MARKET STORE #042 DOWNTOWN 124.50 CARD 8812',
        },
        {
          id: 'tx-sample-3',
          transaction_date: '2026-01-04',
          transaction_title: 'ATM Withdrawal',
          transaction_description: 'ATM CASH WITHDRAWAL MAIN STREET BRANCH ATM 02',
          amount: '-200.00',
          currency: 'USD',
          transaction_type: 'Withdrawal',
          notes: 'ATM-9102',
          page_number: 1,
          raw_transaction_text: '2026-01-04 ATM CASH WITHDRAWAL MAIN STREET BRANCH ATM 02 200.00 ATM-9102',
        },
        {
          id: 'tx-sample-4',
          transaction_date: '2026-01-05',
          transaction_title: 'Card Payment',
          transaction_description: 'AMAZON WEB SERVICES CLOUD SERVICES INV-991204',
          amount: '-85.40',
          currency: 'USD',
          transaction_type: 'Debit',
          notes: 'WEB-PAY',
          page_number: 1,
          raw_transaction_text: '2026-01-05 AMAZON WEB SERVICES CLOUD SERVICES INV-991204 85.40 WEB-PAY',
        },
        {
          id: 'tx-sample-5',
          transaction_date: '2026-01-07',
          transaction_title: 'Bank Transfer',
          transaction_description: 'MOBILE TRANSFER TO J. DOE DINNER REIMBURSEMENT',
          amount: '-45.00',
          currency: 'USD',
          transaction_type: 'Transfer',
          notes: 'P2P-3419',
          page_number: 1,
          raw_transaction_text: '2026-01-07 MOBILE TRANSFER TO J. DOE DINNER REIMBURSEMENT 45.00 P2P-3419',
        },
        {
          id: 'tx-sample-6',
          transaction_date: '2026-01-10',
          transaction_title: 'Utility Payment',
          transaction_description: 'ELECTRICITY BILL PAYMENT STATE POWER & LIGHT ACC #4910',
          amount: '-142.15',
          currency: 'USD',
          transaction_type: 'Payment',
          notes: 'UTIL-881',
          page_number: 1,
          raw_transaction_text: '2026-01-10 ELECTRICITY BILL PAYMENT STATE POWER & LIGHT ACC #4910 142.15 UTIL-881',
        },
        {
          id: 'tx-sample-7',
          transaction_date: '2026-01-12',
          transaction_title: 'Bank Transfer',
          transaction_description: 'CLIENT FREELANCE PAYMENT DESIGN SERVICES MILESTONE 2',
          amount: '1200.00',
          currency: 'USD',
          transaction_type: 'Credit',
          notes: 'WIRE-IN',
          page_number: 1,
          raw_transaction_text: '2026-01-12 CLIENT FREELANCE PAYMENT DESIGN SERVICES MILESTONE 2 1,200.00 WIRE-IN',
        },
        {
          id: 'tx-sample-8',
          transaction_date: '2026-01-14',
          transaction_title: 'Utility Payment',
          transaction_description: 'MONTHLY FIBER INTERNET VERIZON ONLINE BILL #91204',
          amount: '-79.99',
          currency: 'USD',
          transaction_type: 'Payment',
          notes: 'AUTO-DEB',
          page_number: 1,
          raw_transaction_text: '2026-01-14 MONTHLY FIBER INTERNET VERIZON ONLINE BILL #91204 79.99 AUTO-DEB',
        },
        {
          id: 'tx-sample-9',
          transaction_date: '2026-01-15',
          transaction_title: 'POS Purchase',
          transaction_description: 'GAS STATION FUEL PURCHASE SHELL OIL #4812 PUMP 04',
          amount: '-52.30',
          currency: 'USD',
          transaction_type: 'Debit',
          notes: 'CARD 8812',
          page_number: 1,
          raw_transaction_text: '2026-01-15 GAS STATION FUEL PURCHASE SHELL OIL #4812 PUMP 04 52.30 CARD 8812',
        },
        {
          id: 'tx-sample-10',
          transaction_date: '2026-01-18',
          transaction_title: 'Card Payment',
          transaction_description: 'ANNUAL SUBSCRIPTION RENEWAL GITHUB DEVELOPER PRO PACK',
          amount: '-96.00',
          currency: 'USD',
          transaction_type: 'Debit',
          notes: 'ONLINE',
          page_number: 1,
          raw_transaction_text: '2026-01-18 ANNUAL SUBSCRIPTION RENEWAL GITHUB DEVELOPER PRO PACK 96.00 ONLINE',
        },
        {
          id: 'tx-sample-11',
          transaction_date: '2026-01-20',
          transaction_title: 'POS Purchase',
          transaction_description: 'AIRLINE TICKET BOOKING DELTA AIRLINES TKT #00681920',
          amount: '-412.30',
          currency: 'USD',
          transaction_type: 'Debit',
          notes: 'CARD 8812',
          page_number: 2,
          raw_transaction_text: '2026-01-20 AIRLINE TICKET BOOKING DELTA AIRLINES TKT #00681920 412.30 CARD 8812',
        },
        {
          id: 'tx-sample-12',
          transaction_date: '2026-01-22',
          transaction_title: 'Card Payment',
          transaction_description: 'HOTEL RESERVATION HILTON HOTELS 2 NIGHTS STAY',
          amount: '-298.00',
          currency: 'USD',
          transaction_type: 'Debit',
          notes: 'HOTEL-NY',
          page_number: 2,
          raw_transaction_text: '2026-01-22 HOTEL RESERVATION HILTON HOTELS 2 NIGHTS STAY 298.00 HOTEL-NY',
        },
        {
          id: 'tx-sample-13',
          transaction_date: '2026-01-24',
          transaction_title: 'Interest',
          transaction_description: 'INTEREST CREDIT HIGH YIELD CHECKING INTEREST APY 1.8%',
          amount: '14.28',
          currency: 'USD',
          transaction_type: 'Interest',
          notes: 'INT-CRED',
          page_number: 2,
          raw_transaction_text: '2026-01-24 INTEREST CREDIT HIGH YIELD CHECKING INTEREST APY 1.8% 14.28 INT-CRED',
        },
        {
          id: 'tx-sample-14',
          transaction_date: '2026-01-25',
          transaction_title: 'POS Purchase',
          transaction_description: 'RESTAURANT BISTRO PAYMENT THE FRENCH ROOFTOP DINING',
          amount: '-88.50',
          currency: 'USD',
          transaction_type: 'Debit',
          notes: 'CARD 8812',
          page_number: 2,
          raw_transaction_text: '2026-01-25 RESTAURANT BISTRO PAYMENT THE FRENCH ROOFTOP DINING 88.50 CARD 8812',
        },
        {
          id: 'tx-sample-15',
          transaction_date: '2026-01-27',
          transaction_title: 'Salary Credit',
          transaction_description: 'PAYROLL DIRECT DEP - ACME CORP EMP #48920 PAY PERIOD 25',
          amount: '3850.00',
          currency: 'USD',
          transaction_type: 'Credit',
          notes: 'DIR-DEP',
          page_number: 2,
          raw_transaction_text: '2026-01-27 PAYROLL DIRECT DEP - ACME CORP EMP #48920 PAY PERIOD 25 3,850.00 DIR-DEP',
        },
        {
          id: 'tx-sample-16',
          transaction_date: '2026-01-28',
          transaction_title: 'POS Purchase',
          transaction_description: 'GROCERY SUPERMARKET WHOLE FOODS MKT ORGANIC',
          amount: '-165.20',
          currency: 'USD',
          transaction_type: 'Debit',
          notes: 'CARD 8812',
          page_number: 2,
          raw_transaction_text: '2026-01-28 GROCERY SUPERMARKET WHOLE FOODS MKT ORGANIC 165.20 CARD 8812',
        },
        {
          id: 'tx-sample-17',
          transaction_date: '2026-01-29',
          transaction_title: 'POS Purchase',
          transaction_description: 'PHARMACY HEALTH CARE CVS PHARMACY STORE #1980',
          amount: '-34.85',
          currency: 'USD',
          transaction_type: 'Debit',
          notes: 'RX-991',
          page_number: 2,
          raw_transaction_text: '2026-01-29 PHARMACY HEALTH CARE CVS PHARMACY STORE #1980 34.85 RX-991',
        },
        {
          id: 'tx-sample-18',
          transaction_date: '2026-01-30',
          transaction_title: 'Bank Fee',
          transaction_description: 'ACCOUNT MAINTENANCE FEE STANDARD MONTHLY SERVICE FEE',
          amount: '-12.00',
          currency: 'USD',
          transaction_type: 'Fee',
          notes: 'BANK-FEE',
          page_number: 2,
          raw_transaction_text: '2026-01-30 ACCOUNT MAINTENANCE FEE STANDARD MONTHLY SERVICE FEE 12.00 BANK-FEE',
        },
        {
          id: 'tx-sample-19',
          transaction_date: '2026-01-31',
          transaction_title: 'Card Payment',
          transaction_description: 'STREAMING ENTERTAINMENT NETFLIX PREMIUM 4K SUBSCRIPTION',
          amount: '-22.99',
          currency: 'USD',
          transaction_type: 'Debit',
          notes: 'RECUR',
          page_number: 2,
          raw_transaction_text: '2026-01-31 STREAMING ENTERTAINMENT NETFLIX PREMIUM 4K SUBSCRIPTION 22.99 RECUR',
        },
      ],
      extraction_summary: {
        total_transactions: 19,
        total_pages_processed: 2,
        transactions_with_missing_data: 0,
        possible_duplicates: 0,
      },
    },
  },
  {
    id: 'qnb-bilingual',
    name: 'Qatar National Bank (QNB) - Bilingual Arabic/English',
    bank: 'Qatar National Bank (QNB)',
    description: 'Bilingual QAR statement showcasing Arabic & English descriptions, salary deposits, POS purchases in Doha, and utility payments.',
    badge: 'Arabic & English',
    pages: 1,
    generatePdf: generateCheckingPdf, // Uses PDF generator
    presetResult: {
      statement_information: {
        bank_name: 'Qatar National Bank (QNB)',
        account_holder: 'Ahmed Mansoor Al-Thani',
        account_number: '0012948102941',
        statement_period_start: '2026-01-01',
        statement_period_end: '2026-01-31',
        currency: 'QAR',
      },
      transactions: [
        {
          id: 'qnb-1',
          transaction_date: '2026-01-02',
          transaction_title: 'Salary Credit',
          transaction_description: 'SALARY CREDIT - QATAR ENERGY CO. تحويل راتب شركة قطر للطاقة',
          amount: '28500.00',
          currency: 'QAR',
          transaction_type: 'Salary',
          notes: 'Monthly salary transfer REF-QE-9812',
          page_number: 1,
          raw_transaction_text: '2026-01-02 SALARY CREDIT - QATAR ENERGY CO. 28,500.00 REF-QE-9812',
        },
        {
          id: 'qnb-2',
          transaction_date: '2026-01-03',
          transaction_title: 'POS Purchase',
          transaction_description: 'POS PURCHASE - كارفور CARREFOUR HYPERMARKET DOHA FESTIVAL CITY',
          amount: '-485.50',
          currency: 'QAR',
          transaction_type: 'Debit',
          notes: 'Card ending 4019',
          page_number: 1,
          raw_transaction_text: '2026-01-03 POS PURCHASE - CARREFOUR DFC 485.50 QAR',
        },
        {
          id: 'qnb-3',
          transaction_date: '2026-01-05',
          transaction_title: 'Utility Payment',
          transaction_description: 'BILL PAYMENT - OOREDOO QATAR سداد فاتورة اتصالات اوريدو',
          amount: '-350.00',
          currency: 'QAR',
          transaction_type: 'Payment',
          notes: 'FIBER OOREDOO INV-30192',
          page_number: 1,
          raw_transaction_text: '2026-01-05 BILL PAYMENT - OOREDOO QATAR 350.00',
        },
        {
          id: 'qnb-4',
          transaction_date: '2026-01-08',
          transaction_title: 'ATM Withdrawal',
          transaction_description: 'ATM WITHDRAWAL - SOUQ WAQIF BRANCH سحب نقدي صراف آلي سوق واقف',
          amount: '-1000.00',
          currency: 'QAR',
          transaction_type: 'Withdrawal',
          notes: 'ATM #0482',
          page_number: 1,
          raw_transaction_text: '2026-01-08 ATM WITHDRAWAL SOUQ WAQIF 1,000.00 QAR',
        },
        {
          id: 'qnb-5',
          transaction_date: '2026-01-12',
          transaction_title: 'Utility Payment',
          transaction_description: 'KAHRAMAA WATER & ELECTRICITY مؤسسة كهرماء للكهرباء والماء',
          amount: '-275.25',
          currency: 'QAR',
          transaction_type: 'Payment',
          notes: 'ACC #0049281',
          page_number: 1,
          raw_transaction_text: '2026-01-12 KAHRAMAA WATER & ELEC 275.25',
        },
        {
          id: 'qnb-6',
          transaction_date: '2026-01-18',
          transaction_title: 'POS Purchase',
          transaction_description: 'MONOPRIX - THE PEARL QATAR مونوبري اللؤلؤة قطر',
          amount: '-320.00',
          currency: 'QAR',
          transaction_type: 'Debit',
          notes: 'Card ending 4019',
          page_number: 1,
          raw_transaction_text: '2026-01-18 MONOPRIX THE PEARL 320.00',
        },
        {
          id: 'qnb-7',
          transaction_date: '2026-01-25',
          transaction_title: 'Bank Transfer',
          transaction_description: 'INTERNATIONAL WIRE OUTBOUND - PARENTS SUPPORT تحويل دولي',
          amount: '-3650.00',
          currency: 'QAR',
          transaction_type: 'Transfer',
          notes: 'FX USD equivalent $1,000.00',
          page_number: 1,
          raw_transaction_text: '2026-01-25 WIRE OUTBOUND - PARENTS SUPPORT 3,650.00',
        },
      ],
      extraction_summary: {
        total_transactions: 7,
        total_pages_processed: 1,
        transactions_with_missing_data: 0,
        possible_duplicates: 0,
      },
    },
  },
];
