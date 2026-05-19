import { formatPHP, formatDate } from "@/lib/format";
import { LOAN_TYPE_LABELS } from "@/lib/loan-constants";

/* Minimal shapes needed for printing — matches API snake_case */
export interface PrintClient {
  name: string;
  store_name: string;
  address: string;
  phone: string;
}

export interface PrintCollector {
  name: string;
}

export interface PrintLoan {
  number: string;
  loan_type: string;
  principal: number;
  interest: number;
  service_charge: number;
  total_receivable: number;
  daily_payment: number;
  term_days: number;
  current_balance: number;
  release_date: string;
  due_date: string;
  client: PrintClient;
  collector: PrintCollector;
}

interface PrintTILAParams {
  client: PrintClient;
  collector: PrintCollector;
  loanType: string;
  date: string;
  principal: number;
  interest: number;
  sc: number;
  totalLoanAmount: number;
  totalReceivable: number;
  daily: number;
  termDays: number;
  dueDate: Date | null;
}

export function printTILA(p: PrintTILAParams) {
  const win = window.open("", "_blank");
  if (!win) return;
  const loanNum = `LN-${new Date().getFullYear()}-DRAFT`;
  win.document.write(`<!DOCTYPE html><html><head><title>Truth in Lending Disclosure</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:32px;color:#111}
  h1{font-size:16px;text-align:center;margin:0 0 2px}
  .co{text-align:center;font-size:13px;font-weight:bold;margin-bottom:4px}
  .sub{text-align:center;font-size:10px;color:#666;margin-bottom:16px}
  .div{border-top:2px solid #000;margin:10px 0}
  .sec{margin-bottom:14px}
  .sec-title{font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:.5px;background:#f0f0f0;padding:4px 8px;margin-bottom:6px}
  .row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dotted #ddd}
  .lbl{color:#555}.val{font-weight:bold}
  .total{display:flex;justify-content:space-between;font-weight:bold;font-size:13px;padding:6px 0;border-top:2px solid #333;margin-top:4px}
  .sigs{display:flex;gap:40px;margin-top:48px}
  .sig{flex:1;border-top:1px solid #000;padding-top:4px;font-size:9px;text-align:center}
  .footer{font-size:9px;color:#888;margin-top:20px;text-align:center;border-top:1px solid #ddd;padding-top:8px}
  p{line-height:1.6;margin:0}
  @media print{body{padding:20px}}
</style></head><body>
<div class="co">BuenaMano Lending Corporation</div>
<h1>TRUTH IN LENDING DISCLOSURE STATEMENT</h1>
<div class="sub">Pursuant to Republic Act No. 3765 (Truth in Lending Act)</div>
<div class="div"></div>
<div class="sec">
  <div class="sec-title">Parties</div>
  <div class="row"><span class="lbl">Creditor</span><span class="val">BuenaMano Lending Corporation</span></div>
  <div class="row"><span class="lbl">Borrower</span><span class="val">${p.client.name}</span></div>
  <div class="row"><span class="lbl">Business / Store</span><span class="val">${p.client.store_name}</span></div>
  <div class="row"><span class="lbl">Loan Reference</span><span class="val">${loanNum}</span></div>
  <div class="row"><span class="lbl">Loan Type</span><span class="val">${LOAN_TYPE_LABELS[p.loanType as keyof typeof LOAN_TYPE_LABELS] ?? p.loanType}</span></div>
  <div class="row"><span class="lbl">Release Date</span><span class="val">${p.date}</span></div>
</div>
<div class="sec">
  <div class="sec-title">Finance Details</div>
  <div class="row"><span class="lbl">Principal Amount</span><span class="val">${formatPHP(p.principal)}</span></div>
  <div class="row"><span class="lbl">Interest</span><span class="val">${formatPHP(p.interest)}</span></div>
  <div class="row"><span class="lbl">Total Loan Amount (Principal + Interest)</span><span class="val">${formatPHP(p.totalLoanAmount)}</span></div>
  <div class="row"><span class="lbl">Processing Fee</span><span class="val">${formatPHP(p.sc)}</span></div>
  <div class="total"><span>Total Amount to be Paid (Starting Balance)</span><span>${formatPHP(p.totalReceivable)}</span></div>
</div>
<div class="sec">
  <div class="sec-title">Repayment Schedule</div>
  <div class="row"><span class="lbl">Daily Payment</span><span class="val">${formatPHP(p.daily)}</span></div>
  <div class="row"><span class="lbl">Term of Loan</span><span class="val">${p.termDays} days (Sundays excluded)</span></div>
  <div class="row"><span class="lbl">Due Date</span><span class="val">${p.dueDate ? formatDate(p.dueDate) : "—"}</span></div>
  <div class="row"><span class="lbl">Assigned Collector</span><span class="val">${p.collector.name}</span></div>
</div>
<div class="sec">
  <div class="sec-title">Declaration</div>
  <p>I/We have read, understood, and agree to the terms and conditions of this loan as stated above. I/We acknowledge receipt of this Truth in Lending Disclosure Statement prior to the consummation of this credit transaction, in accordance with the provisions of Republic Act No. 3765.</p>
</div>
<div class="sigs">
  <div class="sig"><br/><br/><br/>Signature over Printed Name of Borrower<br/>Date: _______________</div>
  <div class="sig"><br/><br/><br/>Authorized Lending Representative<br/>Date: _______________</div>
</div>
<div class="footer">This disclosure is issued in compliance with Republic Act No. 3765 (Truth in Lending Act) and its implementing rules and regulations.</div>
</body></html>`);
  win.document.close(); win.focus(); win.print();
}

interface PrintInvoiceParams {
  client: PrintClient;
  collector: PrintCollector;
  loanType: string;
  date: string;
  principal: number;
  interest: number;
  sc: number;
  totalReceivable: number;
  daily: number;
  termDays: number;
  dueDate: Date | null;
  remarks: string;
}

export function printInvoice(p: PrintInvoiceParams) {
  const win = window.open("", "_blank");
  if (!win) return;
  const loanNum = `LN-${new Date().getFullYear()}-DRAFT`;
  win.document.write(`<!DOCTYPE html><html><head><title>Loan Invoice</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:32px;color:#111}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
  .co-name{font-size:18px;font-weight:bold}.co-sub{font-size:10px;color:#888}
  .inv-lbl{font-size:22px;font-weight:bold;color:#2563eb;text-align:right}
  .inv-num{font-size:11px;color:#555;text-align:right}
  .div{border-top:2px solid #2563eb;margin:12px 0}
  .bill-lbl{font-size:9px;text-transform:uppercase;color:#888;letter-spacing:1px}
  .bill-name{font-size:14px;font-weight:bold;margin-top:2px}
  table{width:100%;border-collapse:collapse;margin-top:14px}
  th{background:#eff6ff;font-size:10px;text-transform:uppercase;letter-spacing:.5px;padding:8px 10px;border:1px solid #d1d5db;text-align:left}
  td{padding:8px 10px;border:1px solid #e5e7eb}
  .right{text-align:right}
  .total-row td{font-weight:bold;background:#eff6ff;border-top:2px solid #2563eb;font-size:13px}
  .footer{margin-top:24px;font-size:9px;color:#999;border-top:1px solid #e5e7eb;padding-top:8px}
  @media print{body{padding:20px}}
</style></head><body>
<div class="hdr">
  <div><div class="co-name">BuenaMano Lending Corporation</div><div class="co-sub">Loan &amp; Collection Services</div></div>
  <div><div class="inv-lbl">INVOICE</div><div class="inv-num">No. ${loanNum}</div><div class="inv-num">Date: ${p.date}</div></div>
</div>
<div class="div"></div>
<div style="margin-bottom:16px">
  <div class="bill-lbl">Bill to</div>
  <div class="bill-name">${p.client.name}</div>
  <div>${p.client.store_name}</div>
  <div>${p.client.address}</div>
  <div>Phone: ${p.client.phone}</div>
  <div style="margin-top:4px">Loan Type: ${LOAN_TYPE_LABELS[p.loanType as keyof typeof LOAN_TYPE_LABELS] ?? p.loanType}</div>
</div>
<table>
  <thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
  <tbody>
    <tr><td>Principal loan disbursement</td><td class="right">${formatPHP(p.principal)}</td></tr>
    <tr><td>Interest</td><td class="right">${formatPHP(p.interest)}</td></tr>
    <tr><td>Processing fee</td><td class="right">${formatPHP(p.sc)}</td></tr>
    <tr class="total-row"><td>Starting Balance (Total Payable)</td><td class="right">${formatPHP(p.totalReceivable)}</td></tr>
  </tbody>
</table>
<div class="footer">
  <p>Thank you for your business. Daily payment of ${formatPHP(p.daily)} for ${p.termDays} days (Sundays excluded). Due date: ${p.dueDate ? formatDate(p.dueDate) : "—"}.</p>
  <p>Collector: ${p.collector.name}${p.remarks ? ` — Remarks: ${p.remarks}` : ""}</p>
</div>
</body></html>`);
  win.document.close(); win.focus(); win.print();
}

interface PrintLoanFormParams {
  client: PrintClient;
  collector: PrintCollector;
  loanType: string;
  date: string;
  principal: number;
  interest: number;
  sc: number;
  totalLoanAmount: number;
  totalReceivable: number;
  daily: number;
  termDays: number;
  dueDate: Date | null;
  remarks: string;
}

export function printLoanForm(p: PrintLoanFormParams) {
  const win = window.open("", "_blank");
  if (!win) return;
  const loanNum = `LN-${new Date().getFullYear()}-DRAFT`;
  win.document.write(`<!DOCTYPE html><html><head><title>Loan Agreement Form</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:32px;color:#111}
  h1{font-size:16px;text-align:center;margin:0 0 2px}
  .sub{text-align:center;font-size:10px;color:#666;margin-bottom:14px}
  .div2{border-top:2px solid #000;margin:10px 0}
  .sec-title{font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:.5px;background:#f0f0f0;padding:4px 8px;margin:10px 0 8px}
  .frow{display:flex;gap:20px;margin-bottom:10px}
  .field{flex:1}
  .flbl{font-size:9px;color:#777;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
  .fval{border-bottom:1px solid #333;padding-bottom:2px;min-height:16px;font-weight:bold}
  .amt-table{width:100%;border-collapse:collapse}
  .amt-table td{padding:5px 8px;border:1px solid #ddd}
  .amt-table .lbl{color:#555}.amt-table .val{font-weight:bold;text-align:right}
  .amt-table .tot{font-weight:bold;font-size:12px;background:#f8f8f8}
  .terms{font-size:9px;line-height:1.6;color:#555;border:1px solid #ddd;padding:8px;border-radius:4px;margin-top:8px}
  .sigs{display:flex;gap:24px;margin-top:44px}
  .sig{flex:1;border-top:1px solid #000;padding-top:4px;font-size:9px;text-align:center}
  @media print{body{padding:20px}}
</style></head><body>
<h1>LOAN AGREEMENT &amp; PROMISSORY NOTE</h1>
<div class="sub">BuenaMano Lending Corporation</div>
<div class="div2"></div>
<div class="sec-title">Loan Information</div>
<div class="frow">
  <div class="field"><div class="flbl">Loan Number</div><div class="fval">${loanNum}</div></div>
  <div class="field"><div class="flbl">Loan Type</div><div class="fval">${LOAN_TYPE_LABELS[p.loanType as keyof typeof LOAN_TYPE_LABELS] ?? p.loanType}</div></div>
  <div class="field"><div class="flbl">Release Date</div><div class="fval">${p.date}</div></div>
  <div class="field"><div class="flbl">Due Date</div><div class="fval">${p.dueDate ? formatDate(p.dueDate) : "—"}</div></div>
</div>
<div class="sec-title">Borrower Information</div>
<div class="frow">
  <div class="field"><div class="flbl">Full Name</div><div class="fval">${p.client.name}</div></div>
  <div class="field"><div class="flbl">Business / Store Name</div><div class="fval">${p.client.store_name}</div></div>
</div>
<div class="frow">
  <div class="field"><div class="flbl">Address</div><div class="fval">${p.client.address}</div></div>
  <div class="field"><div class="flbl">Phone</div><div class="fval">${p.client.phone}</div></div>
</div>
<div class="sec-title">Loan Amount Summary</div>
<table class="amt-table">
  <tr><td class="lbl">Principal</td><td class="val">${formatPHP(p.principal)}</td></tr>
  <tr><td class="lbl">Interest</td><td class="val">${formatPHP(p.interest)}</td></tr>
  <tr class="tot"><td>Total Loan Amount (Principal + Interest)</td><td class="val">${formatPHP(p.totalLoanAmount)}</td></tr>
  <tr><td class="lbl">Processing Fee</td><td class="val">${formatPHP(p.sc)}</td></tr>
  <tr class="tot"><td>Starting Balance (Total Payable)</td><td class="val">${formatPHP(p.totalReceivable)}</td></tr>
</table>
<div class="sec-title">Payment Terms</div>
<div class="frow">
  <div class="field"><div class="flbl">Daily Payment</div><div class="fval">${formatPHP(p.daily)}</div></div>
  <div class="field"><div class="flbl">Term of Loan</div><div class="fval">${p.termDays} days (Sundays excluded)</div></div>
  <div class="field"><div class="flbl">Assigned Collector</div><div class="fval">${p.collector.name}</div></div>
</div>
${p.remarks ? `<div class="frow"><div class="field"><div class="flbl">Remarks</div><div class="fval">${p.remarks}</div></div></div>` : ""}
<div class="terms">
  <strong>Terms &amp; Conditions:</strong> The borrower agrees to pay the daily payment amount on all non-Sunday days until the full balance is settled. Late payments are subject to penalty charges as agreed upon. The borrower acknowledges receipt of the full principal amount stated above. This document constitutes a promissory note and is legally binding upon signing.
</div>
<div class="sigs">
  <div class="sig"><br/><br/><br/>Signature over Printed Name of Borrower<br/>Date: _______________</div>
  <div class="sig"><br/><br/><br/>Printed Name &amp; Signature of Co-Borrower / Guarantor<br/>Date: _______________</div>
  <div class="sig"><br/><br/><br/>Authorized Lending Officer<br/>Date: _______________</div>
</div>
</body></html>`);
  win.document.close(); win.focus(); win.print();
}

export function printLedger(loan: PrintLoan) {
  const win = window.open("", "_blank");
  if (!win) return;
  const { client, collector } = loan;
  win.document.write(`<!DOCTYPE html><html><head><title>Client Ledger</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:32px;color:#111}
  h2{font-size:16px;margin:0 0 2px}.co{font-size:13px;font-weight:bold;margin-bottom:4px}
  .div2{border-top:2px solid #000;margin:10px 0}.div1{border-top:1px solid #ccc;margin:8px 0}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:12px}
  .info-row{display:flex;gap:8px}.info-lbl{color:#555;min-width:120px}.info-val{font-weight:bold}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th{background:#f0f0f0;font-size:10px;text-transform:uppercase;padding:6px 8px;border:1px solid #ccc;text-align:left}
  td{padding:5px 8px;border:1px solid #e0e0e0}
  .right{text-align:right}.paid{color:#16a34a}.missed{color:#dc2626}
  .total-row td{font-weight:bold;background:#f8f8f8;border-top:2px solid #aaa}
  @media print{body{padding:20px}}
</style></head><body>
<div class="co">BuenaMano Lending Corporation</div>
<h2>Client Ledger</h2>
<div class="div2"></div>
<div class="info-grid">
  <div class="info-row"><span class="info-lbl">Client Name</span><span class="info-val">${client.name}</span></div>
  <div class="info-row"><span class="info-lbl">Loan Number</span><span class="info-val">${loan.number}</span></div>
  <div class="info-row"><span class="info-lbl">Store / Business</span><span class="info-val">${client.store_name}</span></div>
  <div class="info-row"><span class="info-lbl">Loan Type</span><span class="info-val">${LOAN_TYPE_LABELS[loan.loan_type as keyof typeof LOAN_TYPE_LABELS] ?? loan.loan_type}</span></div>
  <div class="info-row"><span class="info-lbl">Address</span><span class="info-val">${client.address}</span></div>
  <div class="info-row"><span class="info-lbl">Release Date</span><span class="info-val">${loan.release_date}</span></div>
  <div class="info-row"><span class="info-lbl">Phone</span><span class="info-val">${client.phone}</span></div>
  <div class="info-row"><span class="info-lbl">Due Date</span><span class="info-val">${loan.due_date}</span></div>
  <div class="info-row"><span class="info-lbl">Principal</span><span class="info-val">${formatPHP(loan.principal)}</span></div>
  <div class="info-row"><span class="info-lbl">Interest</span><span class="info-val">${formatPHP(loan.interest)}</span></div>
  <div class="info-row"><span class="info-lbl">Total Loan Amount</span><span class="info-val">${formatPHP(loan.principal + loan.interest)}</span></div>
  <div class="info-row"><span class="info-lbl">Processing Fee</span><span class="info-val">${formatPHP(loan.service_charge)}</span></div>
  <div class="info-row"><span class="info-lbl">Starting Balance</span><span class="info-val">${formatPHP(loan.total_receivable)}</span></div>
  <div class="info-row"><span class="info-lbl">Daily Payment</span><span class="info-val">${formatPHP(loan.daily_payment)}</span></div>
  <div class="info-row"><span class="info-lbl">Term of Loan</span><span class="info-val">${loan.term_days} days</span></div>
  <div class="info-row"><span class="info-lbl">Collector</span><span class="info-val">${collector.name}</span></div>
</div>
<div class="div1"></div>
<table>
  <thead>
    <tr><th>#</th><th>Date</th><th class="right">Daily Due</th><th class="right">Amount Paid</th><th class="right">Running Balance</th><th>Status</th></tr>
  </thead>
  <tbody>
    ${Array.from({ length: loan.term_days }, (_, i) => {
      const paidDays = Math.round((loan.total_receivable - loan.current_balance) / loan.daily_payment);
      const isPaid = i < paidDays;
      const bal = Math.max(0, loan.total_receivable - (Math.min(i + 1, paidDays) * loan.daily_payment));
      return `<tr>
        <td>${i + 1}</td><td></td>
        <td class="right">${formatPHP(loan.daily_payment)}</td>
        <td class="right ${isPaid ? "paid" : ""}">${isPaid ? formatPHP(loan.daily_payment) : "—"}</td>
        <td class="right">${formatPHP(bal)}</td>
        <td class="${isPaid ? "paid" : "missed"}">${isPaid ? "Paid" : "Pending"}</td>
      </tr>`;
    }).join("")}
    <tr class="total-row">
      <td colspan="3">Total Paid</td>
      <td class="right">${formatPHP(loan.total_receivable - loan.current_balance)}</td>
      <td class="right">${formatPHP(loan.current_balance)}</td>
      <td></td>
    </tr>
  </tbody>
</table>
<div style="margin-top:20px;font-size:9px;color:#888">Printed: ${new Date().toLocaleDateString("en-PH")} — BuenaMano Lending Corporation</div>
</body></html>`);
  win.document.close(); win.focus(); win.print();
}
