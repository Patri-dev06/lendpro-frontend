import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, Printer, FileText, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clients, collectors, loans, clientById, collectorById, LoanType } from "@/lib/mock-data";
import { formatPHP, formatDate, addNonSundayDays } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/loans")({
  head: () => ({ meta: [{ title: "Loans — LendPro" }] }),
  component: LoansPage,
});

const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  "new-loan": "New Loan",
  "reloan": "Reloan",
  "reconstruct": "Reconstruct",
};

const TERM_OPTIONS = [30, 45, 60] as const;

function LoansPage() {
  const [loanType, setLoanType] = useState<LoanType>("new-loan");
  const [client, setClient] = useState(clients[0].id);
  const [principal, setPrincipal] = useState(10000);
  const [interest, setInterest] = useState(1500);
  const [sc, setSc] = useState(500);
  const [termDays, setTermDays] = useState<number>(45);
  const [daily, setDaily] = useState(267);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [collector, setCollector] = useState(collectors[0].id);
  const [remarks, setRemarks] = useState("");

  const totalLoanAmount = principal + interest;
  const totalReceivable = totalLoanAmount + sc;
  const dueDate = date ? addNonSundayDays(date, termDays) : null;

  function handleTermChange(t: number) {
    setTermDays(t);
    if (totalReceivable > 0) setDaily(Math.ceil(totalReceivable / t));
  }

  function handlePrincipalOrInterestOrSc(p: number, i: number, s: number) {
    const tr = p + i + s;
    if (termDays > 0 && tr > 0) setDaily(Math.ceil(tr / termDays));
  }

  const selectedClient = clientById(client);
  const selectedCollector = collectorById(collector);

  /* ---- Print functions ---- */
  function printTILA() {
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
<div class="co">LendPro — Loan &amp; Collection</div>
<h1>TRUTH IN LENDING DISCLOSURE STATEMENT</h1>
<div class="sub">Pursuant to Republic Act No. 3765 (Truth in Lending Act)</div>
<div class="div"></div>
<div class="sec">
  <div class="sec-title">Parties</div>
  <div class="row"><span class="lbl">Creditor</span><span class="val">LendPro Loan &amp; Collection</span></div>
  <div class="row"><span class="lbl">Borrower</span><span class="val">${selectedClient.name}</span></div>
  <div class="row"><span class="lbl">Business / Store</span><span class="val">${selectedClient.storeName}</span></div>
  <div class="row"><span class="lbl">Loan Reference</span><span class="val">${loanNum}</span></div>
  <div class="row"><span class="lbl">Loan Type</span><span class="val">${LOAN_TYPE_LABELS[loanType]}</span></div>
  <div class="row"><span class="lbl">Release Date</span><span class="val">${date}</span></div>
</div>
<div class="sec">
  <div class="sec-title">Finance Details</div>
  <div class="row"><span class="lbl">Principal Amount</span><span class="val">${formatPHP(principal)}</span></div>
  <div class="row"><span class="lbl">Interest</span><span class="val">${formatPHP(interest)}</span></div>
  <div class="row"><span class="lbl">Total Loan Amount (Principal + Interest)</span><span class="val">${formatPHP(totalLoanAmount)}</span></div>
  <div class="row"><span class="lbl">Processing Fee</span><span class="val">${formatPHP(sc)}</span></div>
  <div class="total"><span>Total Amount to be Paid (Starting Balance)</span><span>${formatPHP(totalReceivable)}</span></div>
</div>
<div class="sec">
  <div class="sec-title">Repayment Schedule</div>
  <div class="row"><span class="lbl">Daily Payment</span><span class="val">${formatPHP(daily)}</span></div>
  <div class="row"><span class="lbl">Term of Loan</span><span class="val">${termDays} days (Sundays excluded)</span></div>
  <div class="row"><span class="lbl">Due Date</span><span class="val">${dueDate ? formatDate(dueDate) : "—"}</span></div>
  <div class="row"><span class="lbl">Assigned Collector</span><span class="val">${selectedCollector.name}</span></div>
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

  function printInvoice() {
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
  <div><div class="co-name">LendPro</div><div class="co-sub">Loan &amp; Collection Services</div></div>
  <div><div class="inv-lbl">INVOICE</div><div class="inv-num">No. ${loanNum}</div><div class="inv-num">Date: ${date}</div></div>
</div>
<div class="div"></div>
<div style="margin-bottom:16px">
  <div class="bill-lbl">Bill to</div>
  <div class="bill-name">${selectedClient.name}</div>
  <div>${selectedClient.storeName}</div>
  <div>${selectedClient.address}</div>
  <div>Phone: ${selectedClient.phone}</div>
  <div style="margin-top:4px">Loan Type: ${LOAN_TYPE_LABELS[loanType]}</div>
</div>
<table>
  <thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
  <tbody>
    <tr><td>Principal loan disbursement</td><td class="right">${formatPHP(principal)}</td></tr>
    <tr><td>Interest</td><td class="right">${formatPHP(interest)}</td></tr>
    <tr><td>Processing fee</td><td class="right">${formatPHP(sc)}</td></tr>
    <tr class="total-row"><td>Starting Balance (Total Payable)</td><td class="right">${formatPHP(totalReceivable)}</td></tr>
  </tbody>
</table>
<div class="footer">
  <p>Thank you for your business. Daily payment of ${formatPHP(daily)} for ${termDays} days (Sundays excluded). Due date: ${dueDate ? formatDate(dueDate) : "—"}.</p>
  <p>Collector: ${selectedCollector.name}${remarks ? ` — Remarks: ${remarks}` : ""}</p>
</div>
</body></html>`);
    win.document.close(); win.focus(); win.print();
  }

  function printLoanForm() {
    const win = window.open("", "_blank");
    if (!win) return;
    const loanNum = `LN-${new Date().getFullYear()}-DRAFT`;
    win.document.write(`<!DOCTYPE html><html><head><title>Loan Agreement Form</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:32px;color:#111}
  h1{font-size:16px;text-align:center;margin:0 0 2px}
  .sub{text-align:center;font-size:10px;color:#666;margin-bottom:14px}
  .div2{border-top:2px solid #000;margin:10px 0}
  .div1{border-top:1px solid #ccc;margin:8px 0}
  .sec-title{font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:.5px;background:#f0f0f0;padding:4px 8px;margin:10px 0 8px}
  .frow{display:flex;gap:20px;margin-bottom:10px}
  .field{flex:1}
  .flbl{font-size:9px;color:#777;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
  .fval{border-bottom:1px solid #333;padding-bottom:2px;min-height:16px;font-weight:bold}
  .fblank{border-bottom:1px solid #333;min-height:16px}
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
<div class="sub">LendPro Loan &amp; Collection</div>
<div class="div2"></div>
<div class="sec-title">Loan Information</div>
<div class="frow">
  <div class="field"><div class="flbl">Loan Number</div><div class="fval">${loanNum}</div></div>
  <div class="field"><div class="flbl">Loan Type</div><div class="fval">${LOAN_TYPE_LABELS[loanType]}</div></div>
  <div class="field"><div class="flbl">Release Date</div><div class="fval">${date}</div></div>
  <div class="field"><div class="flbl">Due Date</div><div class="fval">${dueDate ? formatDate(dueDate) : "—"}</div></div>
</div>
<div class="sec-title">Borrower Information</div>
<div class="frow">
  <div class="field"><div class="flbl">Full Name</div><div class="fval">${selectedClient.name}</div></div>
  <div class="field"><div class="flbl">Business / Store Name</div><div class="fval">${selectedClient.storeName}</div></div>
</div>
<div class="frow">
  <div class="field"><div class="flbl">Address</div><div class="fval">${selectedClient.address}</div></div>
  <div class="field"><div class="flbl">Phone</div><div class="fval">${selectedClient.phone}</div></div>
</div>
<div class="sec-title">Loan Amount Summary</div>
<table class="amt-table">
  <tr><td class="lbl">Principal</td><td class="val">${formatPHP(principal)}</td></tr>
  <tr><td class="lbl">Interest</td><td class="val">${formatPHP(interest)}</td></tr>
  <tr class="tot"><td>Total Loan Amount (Principal + Interest)</td><td class="val">${formatPHP(totalLoanAmount)}</td></tr>
  <tr><td class="lbl">Processing Fee</td><td class="val">${formatPHP(sc)}</td></tr>
  <tr class="tot"><td>Starting Balance (Total Payable)</td><td class="val">${formatPHP(totalReceivable)}</td></tr>
</table>
<div class="sec-title">Payment Terms</div>
<div class="frow">
  <div class="field"><div class="flbl">Daily Payment</div><div class="fval">${formatPHP(daily)}</div></div>
  <div class="field"><div class="flbl">Term of Loan</div><div class="fval">${termDays} days (Sundays excluded)</div></div>
  <div class="field"><div class="flbl">Assigned Collector</div><div class="fval">${selectedCollector.name}</div></div>
</div>
${remarks ? `<div class="frow"><div class="field"><div class="flbl">Remarks</div><div class="fval">${remarks}</div></div></div>` : ""}
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

  function printLedger(loanId: string) {
    const l = loans.find((x) => x.id === loanId);
    if (!l) return;
    const c = clientById(l.clientId);
    const col = collectorById(l.collectorId);
    const win = window.open("", "_blank");
    if (!win) return;
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
<div class="co">LendPro — Loan &amp; Collection</div>
<h2>Client Ledger</h2>
<div class="div2"></div>
<div class="info-grid">
  <div class="info-row"><span class="info-lbl">Client Name</span><span class="info-val">${c.name}</span></div>
  <div class="info-row"><span class="info-lbl">Loan Number</span><span class="info-val">${l.number}</span></div>
  <div class="info-row"><span class="info-lbl">Store / Business</span><span class="info-val">${c.storeName}</span></div>
  <div class="info-row"><span class="info-lbl">Loan Type</span><span class="info-val">${LOAN_TYPE_LABELS[l.loanType]}</span></div>
  <div class="info-row"><span class="info-lbl">Address</span><span class="info-val">${c.address}</span></div>
  <div class="info-row"><span class="info-lbl">Release Date</span><span class="info-val">${l.releaseDate}</span></div>
  <div class="info-row"><span class="info-lbl">Phone</span><span class="info-val">${c.phone}</span></div>
  <div class="info-row"><span class="info-lbl">Due Date</span><span class="info-val">${l.dueDate}</span></div>
  <div class="info-row"><span class="info-lbl">Principal</span><span class="info-val">${formatPHP(l.principal)}</span></div>
  <div class="info-row"><span class="info-lbl">Interest</span><span class="info-val">${formatPHP(l.interest)}</span></div>
  <div class="info-row"><span class="info-lbl">Total Loan Amount</span><span class="info-val">${formatPHP(l.principal + l.interest)}</span></div>
  <div class="info-row"><span class="info-lbl">Processing Fee</span><span class="info-val">${formatPHP(l.serviceCharge)}</span></div>
  <div class="info-row"><span class="info-lbl">Starting Balance</span><span class="info-val">${formatPHP(l.totalReceivable)}</span></div>
  <div class="info-row"><span class="info-lbl">Daily Payment</span><span class="info-val">${formatPHP(l.dailyPayment)}</span></div>
  <div class="info-row"><span class="info-lbl">Term of Loan</span><span class="info-val">${l.termDays} days</span></div>
  <div class="info-row"><span class="info-lbl">Collector</span><span class="info-val">${col.name}</span></div>
</div>
<div class="div1"></div>
<table>
  <thead>
    <tr>
      <th>#</th><th>Date</th><th class="right">Daily Due</th><th class="right">Amount Paid</th><th class="right">Running Balance</th><th>Status</th>
    </tr>
  </thead>
  <tbody>
    ${Array.from({ length: l.termDays }, (_, i) => {
      const dayNum = i + 1;
      const paidDays = Math.round((l.totalReceivable - l.currentBalance) / l.dailyPayment);
      const isPaid = i < paidDays;
      const bal = Math.max(0, l.totalReceivable - (Math.min(i + 1, paidDays) * l.dailyPayment));
      return `<tr>
        <td>${dayNum}</td>
        <td></td>
        <td class="right">${formatPHP(l.dailyPayment)}</td>
        <td class="right ${isPaid ? "paid" : ""}">${isPaid ? formatPHP(l.dailyPayment) : "—"}</td>
        <td class="right">${formatPHP(bal)}</td>
        <td class="${isPaid ? "paid" : "missed"}">${isPaid ? "Paid" : "Pending"}</td>
      </tr>`;
    }).join("")}
    <tr class="total-row">
      <td colspan="3">Total Paid</td>
      <td class="right">${formatPHP(l.totalReceivable - l.currentBalance)}</td>
      <td class="right">${formatPHP(l.currentBalance)}</td>
      <td></td>
    </tr>
  </tbody>
</table>
<div style="margin-top:20px;font-size:9px;color:#888">Printed: ${new Date().toLocaleDateString("en-PH")} — LendPro Loan &amp; Collection</div>
</body></html>`);
    win.document.close(); win.focus(); win.print();
  }

  const canPrint = principal > 0 && interest > 0 && date;

  return (
    <div className="space-y-6">
      <PageHeader title="Loan management" subtitle="Encode new loans and review the active loan ledger." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        {/* Form */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Label className="text-xs shrink-0">Loan type</Label>
              <Select value={loanType} onValueChange={(v) => setLoanType(v as LoanType)}>
                <SelectTrigger className="h-8 w-44 text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-loan">New Loan</SelectItem>
                  <SelectItem value="reloan">Reloan</SelectItem>
                  <SelectItem value="reconstruct">Reconstruct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">Auto-computed</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Select client">
              <Select value={client} onValueChange={setClient}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.storeName}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Assigned collector">
              <Select value={collector} onValueChange={setCollector}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{collectors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Principal loan (₱)">
              <Input type="number" value={principal} onChange={(e) => {
                const v = Number(e.target.value) || 0;
                setPrincipal(v);
                handlePrincipalOrInterestOrSc(v, interest, sc);
              }} />
            </Field>
            <Field label="Interest (₱)">
              <Input type="number" value={interest} onChange={(e) => {
                const v = Number(e.target.value) || 0;
                setInterest(v);
                handlePrincipalOrInterestOrSc(principal, v, sc);
              }} />
            </Field>
            <Field label="Term of loan">
              <Select value={String(termDays)} onValueChange={(v) => handleTermChange(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map((t) => <SelectItem key={t} value={String(t)}>{t} days</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Processing fee (₱)">
              <Input type="number" value={sc} onChange={(e) => {
                const v = Number(e.target.value) || 0;
                setSc(v);
                handlePrincipalOrInterestOrSc(principal, interest, v);
              }} />
            </Field>
            <Field label="Loan release date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Due date (computed)">
              <Input value={dueDate ? formatDate(dueDate) : "—"} readOnly className="bg-muted/40 text-muted-foreground" />
            </Field>
            <Field label="Daily payment (₱)">
              <Input type="number" value={daily} onChange={(e) => setDaily(Number(e.target.value) || 0)} />
            </Field>
            <Field label="Remarks (optional)" full>
              <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any internal notes about this loan…" />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button variant="outline" disabled={!canPrint} onClick={printTILA}>
              <FileText className="mr-1.5 h-4 w-4" />Print TILA
            </Button>
            <Button variant="outline" disabled={!canPrint} onClick={printInvoice}>
              <ClipboardList className="mr-1.5 h-4 w-4" />Print Invoice
            </Button>
            <Button variant="outline" disabled={!canPrint} onClick={printLoanForm}>
              <Printer className="mr-1.5 h-4 w-4" />Print Loan Form
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-glow"
              onClick={() => toast.success(`${LOAN_TYPE_LABELS[loanType]} created — ${termDays}-day schedule generated`)}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              Create loan &amp; generate schedule
            </Button>
          </div>
        </div>

        {/* Summary panel */}
        <div className="rounded-2xl border bg-linear-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-md">
          <h3 className="font-display text-base font-semibold">Loan summary</h3>
          <p className="text-xs opacity-75">Live calculation based on inputs</p>

          <dl className="mt-5 space-y-3 text-sm">
            <SumRow label="Principal" value={formatPHP(principal)} />
            <SumRow label="Interest" value={formatPHP(interest)} />
            <div className="my-2 border-t border-primary-foreground/20" />
            <SumRow label="Total loan amount" value={formatPHP(totalLoanAmount)} bold />
            <SumRow label="Processing fee" value={formatPHP(sc)} />
            <div className="my-2 border-t border-primary-foreground/20" />
            <SumRow label="Starting balance" value={formatPHP(totalReceivable)} bold />
            <div className="my-2 border-t border-primary-foreground/20" />
            <SumRow label="Daily payment" value={formatPHP(daily)} />
            <SumRow label="Term of loan" value={`${termDays} days`} />
            <SumRow label="Due date" value={dueDate ? formatDate(dueDate) : "—"} />
          </dl>
          <p className="mt-5 text-[11px] opacity-70">Total Loan Amount = Principal + Interest. Starting Balance = Total Loan Amount + Processing Fee. Sundays not counted in term.</p>
        </div>
      </div>

      {/* Active loan ledger */}
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-display text-base font-semibold">Active loan ledger</h3>
          <span className="text-xs text-muted-foreground">{loans.length} loans</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead className="text-right">Proc. Fee</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Daily</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Print</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((l) => {
                const c = clientById(l.clientId);
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{l.number}</TableCell>
                    <TableCell>
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize">
                        {LOAN_TYPE_LABELS[l.loanType]}
                      </span>
                    </TableCell>
                    <TableCell><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.storeName}</div></TableCell>
                    <TableCell className="text-right num">{formatPHP(l.principal)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(l.interest)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(l.serviceCharge)}</TableCell>
                    <TableCell className="text-right num font-medium">{formatPHP(l.totalReceivable)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(l.dailyPayment)}</TableCell>
                    <TableCell className="text-right num font-semibold">{formatPHP(l.currentBalance)}</TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                    <TableCell className="text-xs">{formatDate(l.dueDate)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{collectorById(l.collectorId).name}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => printLedger(l.id)}>
                        <Printer className="mr-1 h-3 w-3" />Ledger
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
function SumRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="opacity-80">{label}</span>
      <span className={`num ${bold ? "font-display text-lg font-semibold" : "text-sm"}`}>{value}</span>
    </div>
  );
}
