import { useMemo, useRef, useState } from "react";
import { BookOpen, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InfoItem } from "@/components/payments/InfoItem";
import { loans, clientById, collectorById } from "@/lib/mock-data";
import { formatPHP, formatDate } from "@/lib/format";
import { LOAN_TYPE_LABELS } from "@/lib/loan-constants";

export function ClientLedgerTab() {
  const activeLoans = loans.filter((l) => l.status !== "paid");
  const [selectedLoanId, setSelectedLoanId] = useState(activeLoans[0]?.id ?? "");
  const printRef = useRef<HTMLDivElement>(null);

  const loan = loans.find((l) => l.id === selectedLoanId);
  const client = loan ? clientById(loan.clientId) : null;
  const collector = loan ? collectorById(loan.collectorId) : null;

  const ledgerRows = useMemo(() => {
    if (!loan) return [];
    return Array.from({ length: loan.termDays }, (_, i) => {
      const paidDays = Math.round((loan.totalReceivable - loan.currentBalance) / loan.dailyPayment);
      const isPaid = i < paidDays;
      const prevBal = Math.max(0, loan.totalReceivable - i * loan.dailyPayment);
      const newBal = Math.max(0, prevBal - (isPaid ? loan.dailyPayment : 0));
      return { day: i + 1, due: loan.dailyPayment, paid: isPaid ? loan.dailyPayment : 0, balance: newBal, status: isPaid ? "Paid" : "Pending" };
    });
  }, [loan]);

  const totalPaid = ledgerRows.reduce((s, r) => s + r.paid, 0);

  function handlePrint() {
    if (!loan || !client || !collector) return;
    const content = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Client Ledger — ${client.name}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;padding:32px;color:#111;margin:0}
  h2{font-size:16px;margin:0 0 2px}.co{font-size:13px;font-weight:bold;margin-bottom:4px}
  .div2{border-top:2px solid #000;margin:10px 0}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:12px}
  .info-row{display:flex;gap:8px}.info-lbl{color:#555;min-width:110px}.info-val{font-weight:bold}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th{background:#f0f0f0;font-size:10px;text-transform:uppercase;padding:6px 8px;border:1px solid #ccc}
  td{padding:5px 8px;border:1px solid #e0e0e0}
  .right{text-align:right}.paid{color:#16a34a}.pending{color:#9ca3af}
  .total-row td{font-weight:bold;background:#f8f8f8;border-top:2px solid #aaa}
  .sig-block{display:flex;gap:40px;margin-top:32px}
  .sig{flex:1;border-top:1px solid #000;padding-top:4px;font-size:9px;text-align:center}
  @media print{body{padding:20px}}
</style></head><body>
<div class="co">BuenaMano Lending Corporation</div>
<h2>Client Ledger — ${client.name}</h2>
<div class="div2"></div>
<div class="info-grid">
  <div class="info-row"><span class="info-lbl">Client Name</span><span class="info-val">${client.name}</span></div>
  <div class="info-row"><span class="info-lbl">Loan Number</span><span class="info-val">${loan.number}</span></div>
  <div class="info-row"><span class="info-lbl">Store / Business</span><span class="info-val">${client.storeName}</span></div>
  <div class="info-row"><span class="info-lbl">Loan Type</span><span class="info-val">${LOAN_TYPE_LABELS[loan.loanType] ?? loan.loanType}</span></div>
  <div class="info-row"><span class="info-lbl">Address</span><span class="info-val">${client.address}</span></div>
  <div class="info-row"><span class="info-lbl">Release Date</span><span class="info-val">${loan.releaseDate}</span></div>
  <div class="info-row"><span class="info-lbl">Phone</span><span class="info-val">${client.phone}</span></div>
  <div class="info-row"><span class="info-lbl">Due Date</span><span class="info-val">${loan.dueDate}</span></div>
  <div class="info-row"><span class="info-lbl">Starting Balance</span><span class="info-val">${formatPHP(loan.totalReceivable)}</span></div>
  <div class="info-row"><span class="info-lbl">Daily Payment</span><span class="info-val">${formatPHP(loan.dailyPayment)}</span></div>
  <div class="info-row"><span class="info-lbl">Term of Loan</span><span class="info-val">${loan.termDays} days</span></div>
  <div class="info-row"><span class="info-lbl">Collector</span><span class="info-val">${collector.name}</span></div>
</div>
${content}
<div class="sig-block">
  <div class="sig"><br/><br/>Signature of Borrower / Date</div>
  <div class="sig"><br/><br/>Verified by (Collector) / Date</div>
</div>
<div style="margin-top:16px;font-size:9px;color:#888">Printed: ${new Date().toLocaleDateString("en-PH")} — LendPro Loan &amp; Collection</div>
</body></html>`);
    win.document.close(); win.focus(); win.print();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Select Borrower / Loan</Label>
          <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
            <SelectTrigger className="h-9 w-72">
              <SelectValue placeholder="Select a loan…" />
            </SelectTrigger>
            <SelectContent>
              {loans.map((l) => {
                const c = clientById(l.clientId);
                return <SelectItem key={l.id} value={l.id}>{c.name} — {l.number}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="ml-auto" onClick={handlePrint} disabled={!loan}>
          <Printer className="mr-2 h-4 w-4" />Print Ledger
        </Button>
      </div>

      {loan && client && collector ? (
        <>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border bg-card p-5 shadow-sm sm:grid-cols-4">
            <InfoItem label="Client" value={client.name} />
            <InfoItem label="Loan #" value={loan.number} />
            <InfoItem label="Release date" value={formatDate(loan.releaseDate)} />
            <InfoItem label="Due date" value={formatDate(loan.dueDate)} />
            <InfoItem label="Starting balance" value={formatPHP(loan.totalReceivable)} />
            <InfoItem label="Daily payment" value={formatPHP(loan.dailyPayment)} />
            <InfoItem label="Term of loan" value={`${loan.termDays} days`} />
            <InfoItem label="Remaining balance" value={formatPHP(loan.currentBalance)} highlight />
          </div>

          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="font-display text-base font-semibold">Daily Payment Ledger</h3>
              <p className="text-xs text-muted-foreground">For reconciliation with client's own record (blue card)</p>
            </div>
            <div ref={printRef} className="overflow-x-auto">
              <Table className="min-w-150">
                <TableHeader>
                  <TableRow>
                    <TableHead>Day #</TableHead>
                    <TableHead className="text-right">Daily Due</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="text-right">Running Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerRows.map((r) => (
                    <TableRow key={r.day} className={r.status === "Pending" ? "opacity-50" : ""}>
                      <TableCell className="num text-xs text-muted-foreground">{r.day}</TableCell>
                      <TableCell className="text-right num">{formatPHP(r.due)}</TableCell>
                      <TableCell className="text-right num font-medium">
                        {r.paid > 0 ? <span className="text-success">{formatPHP(r.paid)}</span> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right num">{formatPHP(r.balance)}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${r.status === "Paid" ? "text-success" : "text-muted-foreground"}`}>{r.status}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 bg-muted/40 font-bold">
                    <TableCell colSpan={2} className="text-sm font-semibold">Total</TableCell>
                    <TableCell className="text-right num font-semibold text-success">{formatPHP(totalPaid)}</TableCell>
                    <TableCell className="text-right num font-semibold">{formatPHP(loan.currentBalance)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-16 text-center shadow-sm">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">Select a borrower to view their ledger.</p>
        </div>
      )}
    </div>
  );
}
