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

  // EIR via Newton's method: PV = PMT*(1-(1+r)^-n)/r, solve for r then annualise
  function computeEIR(principal: number, pmt: number, n: number): string {
    if (principal <= 0 || pmt <= 0 || n <= 0) return "0.00";
    let r = 0.001;
    for (let i = 0; i < 2000; i++) {
      const ipow = Math.pow(1 + r, -n);
      const f  = pmt * (1 - ipow) / r - principal;
      const fp = pmt * (n * ipow / ((1 + r) * r) - (1 - ipow) / (r * r));
      const delta = f / fp;
      r = Math.max(r - delta, 1e-10);
      if (Math.abs(delta) < 1e-12) break;
    }
    const eir = (Math.pow(1 + r, 365) - 1) * 100;
    return isFinite(eir) ? eir.toFixed(2) : "0.00";
  }

  const today  = new Date();
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const docRef = `BMLC_${String(today.getDate()).padStart(2,"0")}${MONTHS[today.getMonth()]}${today.getFullYear()}_${loanNum.replace(/[^A-Z0-9]/gi,"")}`;

  const esSigNotice = `This document may be executed electronically and/or by way of electronic signature by the parties. Both parties agree that any electronic signature/s of their respective signatories as indicated therein shall be deemed as an original signature/s, shall have the same force and effect as an original signature, and binding upon both parties. Furthermore, both of the parties agree that if this document shall be executed electronically or by way of electronic signature, the best evidence of this document shall be a copy of this document bearing an electronic signature, in portable document format (.pdf) form, or in any other electronic format intended to preserve the original graphic and pictorial appearance of a document.`;

  const annualAddOn  = p.principal > 0 && p.termDays > 0
    ? ((p.interest / p.principal) * (365 / p.termDays) * 100).toFixed(2)
    : "0.00";
  const finChargePct = p.principal > 0
    ? ((p.interest / p.principal) * 100).toFixed(2)
    : "0.00";
  const eirPct     = computeEIR(p.principal, p.daily, p.termDays);
  const dueDateStr = p.dueDate ? formatDate(p.dueDate) : "_______________";
  const PHP        = (n: number) => `PHP ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Disclosure Statement on Loan Granted / Credit Transaction</title>
<meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4;margin:10mm 12mm}
  body{font-family:Arial,sans-serif;font-size:8.5px;color:#000;padding:0;line-height:1.3}
  /* ── Electronic signature notice ── */
  .es{font-size:7px;line-height:1.45;border-bottom:1px solid #888;padding-bottom:5px;margin-bottom:4px}
  /* ── Doc reference bar ── */
  .ref-bar{text-align:right;font-size:7px;font-weight:bold;margin-bottom:2px}
  .pub{font-size:8px;font-weight:bold;text-align:center;margin-bottom:6px;letter-spacing:2px}
  /* ── Form title ── */
  .form-title{font-size:10.5px;font-weight:bold;text-align:center;margin-bottom:1px}
  .form-sub{font-size:8px;text-align:center;margin-bottom:5px}
  /* ── Borrower rows ── */
  .brow{display:flex;align-items:baseline;gap:4px;margin-bottom:3px;font-size:8.5px}
  .brow-lbl{font-weight:bold;white-space:nowrap;min-width:130px}
  .brow-val{border-bottom:1px solid #000;flex:1;font-weight:bold;min-height:11px;padding:0 3px}
  /* ── Section header ── */
  .sh{font-weight:bold;font-size:8.5px;background:#d9d9d9;border:1px solid #000;padding:2px 5px;margin-top:4px}
  /* ── Section body ── */
  .sb{border:1px solid #000;border-top:none;padding:3px 6px;font-size:8.5px}
  .sb .row{display:flex;align-items:baseline;gap:4px;margin:2px 0}
  .sb .lbl{flex:1}
  .sb .val{border-bottom:1px solid #000;min-width:180px;text-align:right;font-weight:bold;padding-right:2px}
  .sb .tag{font-weight:bold;min-width:20px;padding-left:4px}
  /* ── Charge tables (sections 2 & 3) ── */
  table.ct{width:100%;border-collapse:collapse;font-size:8px;border:1px solid #000;border-top:none}
  table.ct th{border:1px solid #000;padding:2px 4px;background:#f0f0f0;text-align:center;font-size:7.5px;line-height:1.3;vertical-align:middle}
  table.ct th.desc{text-align:left}
  table.ct td{border:1px solid #aaa;padding:2px 4px;vertical-align:top}
  table.ct td.d{width:48%}
  table.ct td.a{width:26%;text-align:right;vertical-align:middle;font-weight:bold}
  table.ct tr.tot td{font-weight:bold;background:#e8e8e8;border-top:1px solid #000}
  /* ── Footnote ── */
  .fn{font-size:7px;font-style:italic;margin:2px 5px 2px;line-height:1.4;color:#333}
  /* ── Section 7 explanation ── */
  .eir-expl{font-size:7.5px;font-style:italic;color:#333;margin:2px 0 0;line-height:1.4}
  /* ── Section 8 body ── */
  .s8{border:1px solid #000;border-top:none;padding:3px 6px;font-size:8.5px;line-height:1.7}
  /* ── Section 10 table ── */
  table.addl{width:100%;border-collapse:collapse;font-size:8px;border:1px solid #000;border-top:none}
  table.addl th{border:1px solid #000;padding:2px 5px;background:#f0f0f0;font-weight:bold;text-align:left}
  table.addl td{border:1px solid #aaa;padding:2px 5px}
  table.addl td.r{text-align:right}
  /* ── Certified correct ── */
  .cert{margin-top:8px;font-size:8.5px;line-height:1.8}
  .ul{display:inline-block;border-bottom:1px solid #000;min-width:200px;height:11px;vertical-align:bottom}
  /* ── Acknowledgment ── */
  .ack{font-size:8.5px;font-weight:bold;line-height:1.5;margin:8px 0 5px;border-top:1px solid #000;padding-top:5px}
  /* ── Customer signature grid ── */
  .cg{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px;font-size:8.5px}
  .ct-title{font-weight:bold;margin-bottom:2px}
  .sig-sp{height:26px;border-bottom:1px solid #000;margin:2px 0}
  .fl{display:flex;align-items:baseline;gap:3px;margin:2px 0}
  .fl .lb{font-weight:bold;white-space:nowrap;min-width:54px;font-size:8px}
  .fl .fv{border-bottom:1px solid #000;flex:1;min-height:10px}
  /* ── Signature verify + notice ── */
  .sv{text-align:right;font-size:7.5px;margin-top:6px}
  .notice{font-weight:bold;font-size:9px;text-align:center;border-top:1px solid #000;margin-top:8px;padding-top:4px}
  /* ── Footer mirrors header ── */
  .footer{margin-top:10px;border-top:1px solid #888;padding-top:5px}
  .footer .es{border:none;padding:0;margin:0 0 3px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>

<!-- ══ TOP: electronic signature notice + ref + PUBLIC ══ -->
<div class="es">${esSigNotice}</div>
<div class="ref-bar">${docRef}</div>
<div class="pub">PUBLIC</div>

<!-- ══ FORM TITLE ══ -->
<div class="form-title">DISCLOSURE STATEMENT ON LOAN GRANTED / CREDIT TRANSACTION</div>
<div class="form-sub">(As required under R.A. 3765, Truth in Lending Act and BSP Regulations)</div>

<!-- ══ BORROWER ══ -->
<div class="brow">
  <span class="brow-lbl">NAME OF BORROWER</span>
  <span class="brow-val">${p.client.name}</span>
</div>
<div class="brow">
  <span class="brow-lbl">ADDRESS</span>
  <span class="brow-val">${p.client.address}</span>
</div>

<!-- ══ 1. LOAN GRANTED ══ -->
<div class="sh">1. LOAN GRANTED / CREDIT TRANSACTION</div>
<div class="sb">
  <div class="row">
    <span class="lbl">Amount to be financed [CCY]</span>
    <span class="val">${PHP(p.principal)}</span>
    <span class="tag">(A)</span>
  </div>
  <div class="row">
    <span class="lbl">Term of Loan Granted / Credit Transaction</span>
    <span class="val">${p.termDays} collection days (Mon–Sat)</span>
    <span class="tag"></span>
  </div>
</div>

<!-- ══ 2. FINANCE CHARGES ══ -->
<div class="sh">2. FINANCE CHARGES (B)</div>
<table class="ct">
  <thead>
    <tr>
      <th class="desc d"></th>
      <th>Not deducted from Loan Granted/<br/>Credit Transaction Proceeds</th>
      <th>Deducted from Loan Granted/<br/>Credit Transaction Proceeds</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="d">
        a. Interest* <u><b>${annualAddOn}%</b></u> p.a. from <u>${p.date}</u> to <u>${dueDateStr}</u><br/>
        &#9744;&nbsp;Simple &nbsp;&#9744;&nbsp;Compound &nbsp;payable &nbsp;&#9744;&nbsp;Monthly &nbsp;&#9744;&nbsp;Quarterly<br/>
        &#9744;&nbsp;Semi-Annual &nbsp;&#9744;&nbsp;Annual &nbsp;&#9745;&nbsp;Other [Daily, Mon&ndash;Sat]<br/>
        &#9744;&nbsp;subject to repricing* &nbsp;&nbsp;&#9745;&nbsp;not subject to repricing
      </td>
      <td class="a">[CCY] ${PHP(p.interest)}</td>
      <td class="a">[CCY] _______________</td>
    </tr>
    <tr>
      <td class="d">b. Non-interest charges</td>
      <td class="a">[CCY] _______________</td>
      <td class="a">[CCY] _______________</td>
    </tr>
    <tr>
      <td class="d">c. Commitment fee</td>
      <td class="a">[CCY] _______________</td>
      <td class="a">[CCY] _______________</td>
    </tr>
    <tr>
      <td class="d">d. Guarantee fee</td>
      <td class="a">[CCY] _______________</td>
      <td class="a">[CCY] _______________</td>
    </tr>
    <tr>
      <td class="d">e. Other charges incidental to extension of credit (Specify) ____________________</td>
      <td class="a">[CCY] _______________</td>
      <td class="a">[CCY] _______________</td>
    </tr>
    <tr class="tot">
      <td class="d">TOTAL Finance Charges</td>
      <td class="a">[CCY] ${PHP(p.interest)}</td>
      <td class="a">[CCY] _______________</td>
    </tr>
  </tbody>
</table>
<div class="fn">* The interest rate shall be subject to change depending upon prevailing money market conditions on repricing date. Subsequent interest repricing details will be advised. Notices thereon can be picked up from the office unless other modes of delivery (physical or electronic) are agreed upon.</div>

<!-- ══ 3. NON-FINANCE CHARGES ══ -->
<div class="sh">3. NON-FINANCE CHARGES (C)</div>
<table class="ct">
  <thead>
    <tr>
      <th class="desc d"></th>
      <th>Not deducted from Loan Granted/<br/>Credit Transaction Proceeds</th>
      <th>Deducted from Loan Granted/<br/>Credit Transaction Proceeds</th>
    </tr>
  </thead>
  <tbody>
    <tr><td class="d">a. Fire / Property Insurance</td><td class="a">[CCY] _______________</td><td class="a">[CCY] _______________</td></tr>
    <tr><td class="d">b. Appraisal Fee</td><td class="a">[CCY] _______________</td><td class="a">[CCY] _______________</td></tr>
    <tr>
      <td class="d">c. Processing and Handling Fee</td>
      <td class="a">[CCY] ${PHP(p.sc)}</td>
      <td class="a">[CCY] _______________</td>
    </tr>
    <tr><td class="d">d. Registration and Filing Fees</td><td class="a">[CCY] _______________</td><td class="a">[CCY] _______________</td></tr>
    <tr><td class="d">e. Taxes (other than Documentary Stamps)</td><td class="a">[CCY] _______________</td><td class="a">[CCY] _______________</td></tr>
    <tr><td class="d">f. Documentary Stamps</td><td class="a">[CCY] _______________</td><td class="a">[CCY] _______________</td></tr>
    <tr><td class="d">g. Notarial Fee</td><td class="a">[CCY] _______________</td><td class="a">[CCY] _______________</td></tr>
    <tr><td class="d">h. Others (Specify) ____________________</td><td class="a">[CCY] _______________</td><td class="a">[CCY] _______________</td></tr>
    <tr class="tot">
      <td class="d">TOTAL Non-Finance Charges</td>
      <td class="a">[CCY] ${PHP(p.sc)}</td>
      <td class="a">[CCY] _______________</td>
    </tr>
  </tbody>
</table>

<!-- ══ 4. TOTAL DEDUCTIONS ══ -->
<div class="sh" style="display:flex;align-items:baseline;gap:6px">
  <span style="flex:1">4. TOTAL DEDUCTIONS FROM PROCEEDS OF LOAN GRANTED / CREDIT TRANSACTION (B plus C)</span>
  <span style="border-bottom:1px solid #000;min-width:160px;text-align:right;padding-right:2px">PHP 0.00</span>
  <span style="min-width:22px;padding-left:4px">(D)</span>
</div>

<!-- ══ 5. NET PROCEEDS ══ -->
<div class="sh" style="display:flex;align-items:baseline;gap:6px">
  <span style="flex:1">5. NET PROCEEDS OF LOAN GRANTED/ CREDIT TRANSACTION (A less D)</span>
  <span style="border-bottom:1px solid #000;min-width:160px;text-align:right;padding-right:2px">${PHP(p.principal)}</span>
</div>

<!-- ══ 6. PERCENTAGE ══ -->
<div class="sh" style="display:flex;align-items:baseline;gap:5px">
  <span style="flex:1">6. PERCENTAGE OF FINANCE CHARGES TO TOTAL AMOUNT FINANCED is</span>
  <span style="border-bottom:1px solid #000;min-width:70px;text-align:center;font-weight:bold">${finChargePct}</span>
  <span>%</span>
</div>

<!-- ══ 7. EFFECTIVE INTEREST RATE ══ -->
<div class="sh" style="display:flex;align-items:baseline;gap:5px">
  <span style="flex:1">7. EFFECTIVE INTEREST RATE</span>
  <span style="border-bottom:1px solid #000;min-width:70px;text-align:center;font-weight:bold">${eirPct}</span>
  <span>% p.a.</span>
</div>
<div class="sb">
  <div class="eir-expl">
    Explanation: The effective interest rate is higher than the contractual interest rate of ${annualAddOn}% p.a. because of the imposition of charges detailed in items (2) and (3) above.<br/>
    Interest shall be computed on the basis of the original principal of the loan granted / credit transaction and interest rate quoted in section 2a.
  </div>
</div>

<!-- ══ 8. SCHEDULE OF PAYMENT ══ -->
<div class="sh">8. SCHEDULE OF PAYMENT OF THE PRINCIPAL (A)</div>
<div class="s8">
  <div>a.&nbsp; Single payment due on Date _______________________&nbsp; [CCY] _______________________</div>
  <div>
    b.&nbsp; Instalment payments &nbsp;&#9745;&nbsp;see attached schedule<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#9745;&nbsp;payable in <u><b>${p.termDays}</b></u> instalments (number of payments) at [CCY]
    <u><b>${PHP(p.daily)}</b></u> for each instalment.<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Please see relative Promissory Note Number <u><b>${loanNum}</b></u>
  </div>
</div>

<!-- ══ 9. COLLATERAL ══ -->
<div class="sh">9. COLLATERAL</div>
<div class="sb">
  This loan is wholly/partially secured by: &nbsp;&#9744;&nbsp;Real Estate &nbsp;&#9744;&nbsp;Chattels &nbsp;&#9744;&nbsp;Government Securities &nbsp;&#9745;&nbsp;Unsecured &nbsp;&#9744;&nbsp;Others __________________
</div>

<!-- ══ 10. ADDITIONAL CHARGES ══ -->
<div class="sh">10. ADDITIONAL CHARGES IN CASE CERTAIN STIPULATIONS ARE NOT MET BY THE BORROWER:</div>
<table class="addl">
  <thead><tr><th style="width:72%">NATURE</th><th>AMOUNT</th></tr></thead>
  <tbody>
    <tr><td>a. Late Payment charge</td><td class="r">[CCY] _______________</td></tr>
    <tr><td>b. Attorney's Fees</td><td class="r">[CCY] _______________</td></tr>
    <tr><td>c. Liquidated Damages</td><td class="r">[CCY] _______________</td></tr>
    <tr><td>d. Collection and Legal Costs</td><td class="r">[CCY] _______________</td></tr>
    <tr><td>e. Others, specify ____________________</td><td class="r">[CCY] _______________</td></tr>
  </tbody>
</table>

<!-- ══ CERTIFIED CORRECT ══ -->
<div class="cert">
  <b>CERTIFIED CORRECT:</b><br/>
  <b>BUENAMANO LENDING CORPORATION</b><br/>
  By:<br/>
  Name: <span class="ul" style="min-width:220px">&nbsp;</span><br/>
  Position/Department: <span class="ul" style="min-width:200px">&nbsp;</span>
</div>

<!-- ══ ACKNOWLEDGMENT ══ -->
<div class="ack">
  FOR AND IN BEHALF OF THE CORPORATION I REPRESENT, I ACKNOWLEDGE RECEIPT OF A COPY OF THIS STATEMENT PRIOR TO THE CONSUMMATION OF THE CREDIT TRANSACTION AND I
  CERTIFY THAT I UNDERSTAND AND FULLY AGREE TO THE TERMS AND CONDITIONS THEREOF.
</div>

<!-- ══ CUSTOMER SIGNATURES (2 columns, 2 sets each) ══ -->
<div class="cg">
  <div>
    <div class="ct-title">Customer Name 1</div>
    By:
    <div class="sig-sp"></div>
    <div class="fl"><span class="lb">Signature:</span><span class="fv">&nbsp;</span></div>
    <div class="fl"><span class="lb">Name:</span><span class="fv">${p.client.name}</span></div>
    <div class="fl"><span class="lb">Date:</span><span class="fv">&nbsp;</span></div>
    <br/>
    <div class="sig-sp"></div>
    <div class="fl"><span class="lb">Signature:</span><span class="fv">&nbsp;</span></div>
    <div class="fl"><span class="lb">Name:</span><span class="fv">&nbsp;</span></div>
    <div class="fl"><span class="lb">Date:</span><span class="fv">&nbsp;</span></div>
  </div>
  <div>
    <div class="ct-title">Customer Name 2</div>
    By:
    <div class="sig-sp"></div>
    <div class="fl"><span class="lb">Signature:</span><span class="fv">&nbsp;</span></div>
    <div class="fl"><span class="lb">Name:</span><span class="fv">&nbsp;</span></div>
    <div class="fl"><span class="lb">Date:</span><span class="fv">&nbsp;</span></div>
    <br/>
    <div class="sig-sp"></div>
    <div class="fl"><span class="lb">Signature:</span><span class="fv">&nbsp;</span></div>
    <div class="fl"><span class="lb">Name:</span><span class="fv">&nbsp;</span></div>
    <div class="fl"><span class="lb">Date:</span><span class="fv">&nbsp;</span></div>
  </div>
</div>

<div class="sv">Signature Verified per Corporate Mandate dated ____________________</div>
<div class="notice">NOTICE TO BORROWER: YOU ARE ENTITLED TO A COPY OF THIS PAPER WHICH YOU SHALL SIGN.</div>

<!-- ══ FOOTER: repeat of top notice + ref + PUBLIC ══ -->
<div class="footer">
  <div class="es">${esSigNotice}</div>
  <div class="ref-bar">${docRef}</div>
  <div class="pub">PUBLIC</div>
</div>

</body>
</html>`);
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
    <tr><td>Processing fee (collected upfront in cash)</td><td class="right">${formatPHP(p.sc)}</td></tr>
    <tr class="total-row"><td>Starting Balance (Total Repayable)</td><td class="right">${formatPHP(p.totalReceivable)}</td></tr>
  </tbody>
</table>
<div class="footer">
  <p>Daily payment of ${formatPHP(p.daily)} for ${p.termDays} collection days (Mon–Sat). Due date: ${p.dueDate ? formatDate(p.dueDate) : "—"}.</p>
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
  <tr><td class="lbl">Interest (add-on)</td><td class="val">${formatPHP(p.interest)}</td></tr>
  <tr class="tot"><td>Starting Balance (Total Repayable)</td><td class="val">${formatPHP(p.totalLoanAmount)}</td></tr>
  <tr><td class="lbl">Processing Fee (collected upfront in cash)</td><td class="val">${formatPHP(p.sc)}</td></tr>
</table>
<div class="sec-title">Payment Terms</div>
<div class="frow">
  <div class="field"><div class="flbl">Daily Payment</div><div class="fval">${formatPHP(p.daily)}</div></div>
  <div class="field"><div class="flbl">Term of Loan</div><div class="fval">${p.termDays} collection days (Mon–Sat)</div></div>
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
  <div class="info-row"><span class="info-lbl">Starting Balance</span><span class="info-val">${formatPHP(loan.total_receivable)}</span></div>
  <div class="info-row"><span class="info-lbl">Processing Fee (upfront)</span><span class="info-val">${formatPHP(loan.service_charge)}</span></div>
  <div class="info-row"><span class="info-lbl">Daily Payment</span><span class="info-val">${formatPHP(loan.daily_payment)}</span></div>
  <div class="info-row"><span class="info-lbl">Term of Loan</span><span class="info-val">${loan.term_days} collection days</span></div>
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
