import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Wallet, Upload, FileSpreadsheet, Printer, Lock, BookOpen } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { PageHeader } from "@/components/finance/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clients, loans, payments, clientById, collectorById, collectors } from "@/lib/mock-data";
import { formatPHP, formatDate } from "@/lib/format";
import { toast } from "sonner";

const LOAN_TYPE_LABELS: Record<string, string> = {
  "new-loan": "New Loan",
  "reloan": "Reloan",
  "reconstruct": "Reconstruct",
};

export const Route = createFileRoute("/_app/payments")({
  head: () => ({ meta: [{ title: "Payments — LendPro" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const { role } = useRole();
  const isClerk = role === "accounting_clerk";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Collections"
        subtitle="Record daily collections, upload Excel files, and generate printable collector summary reports."
      />
      <Tabs defaultValue="direct">
        <TabsList>
          <TabsTrigger value="direct">Direct Input</TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-1.5">
            Upload Excel
            {!isClerk && <Lock className="h-3 w-3 opacity-50" />}
          </TabsTrigger>
          <TabsTrigger value="summary">Collector Summary</TabsTrigger>
          <TabsTrigger value="ledger" className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />Client Ledger
          </TabsTrigger>
        </TabsList>
        <TabsContent value="direct" className="mt-5"><DirectInputTab /></TabsContent>
        <TabsContent value="upload" className="mt-5">
          {isClerk ? <UploadExcelTab /> : <AccessRestricted />}
        </TabsContent>
        <TabsContent value="summary" className="mt-5"><CollectorSummaryTab /></TabsContent>
        <TabsContent value="ledger" className="mt-5"><ClientLedgerTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function AccessRestricted() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-20 text-center shadow-sm">
      <div className="rounded-full bg-muted p-5">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-display text-base font-semibold">Access Restricted</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        This section is only available to the <span className="font-medium text-foreground">Accounting Clerk</span>. Switch your role to access it.
      </p>
    </div>
  );
}

/* ---------- DIRECT INPUT TAB ---------- */
function DirectInputTab() {
  const [clientId, setClientId] = useState(clients[0].id);
  const loan = useMemo(() => loans.find((l) => l.clientId === clientId)!, [clientId]);
  const [amount, setAmount] = useState(loan?.dailyPayment ?? 0);
  const [collector, setCollector] = useState(loan?.collectorId ?? collectors[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");
  const newBalance = Math.max(0, (loan?.currentBalance ?? 0) - amount);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="font-display text-base font-semibold">Payment details</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Borrower">
              <Select value={clientId} onValueChange={(v) => {
                setClientId(v);
                const l = loans.find((x) => x.clientId === v);
                if (l) { setAmount(l.dailyPayment); setCollector(l.collectorId); }
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.storeName}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Loan number"><Input value={loan?.number ?? ""} readOnly /></Field>
            <Field label="Outstanding balance"><Input value={formatPHP(loan?.currentBalance ?? 0)} readOnly /></Field>
            <Field label="Expected payment today"><Input value={formatPHP(loan?.dailyPayment ?? 0)} readOnly /></Field>
            <Field label="Payment amount (₱)"><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} /></Field>
            <Field label="Payment date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Collector">
              <Select value={collector} onValueChange={setCollector}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{collectors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Remarks" full>
              <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes…" />
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-glow"
              onClick={() => toast.success(`Payment of ${formatPHP(amount)} recorded — new balance ${formatPHP(newBalance)}`)}
            >
              <Wallet className="mr-1.5 h-4 w-4" />Record payment
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <BalanceCard label="Previous balance" value={formatPHP(loan?.currentBalance ?? 0)} tone="muted" />
          <BalanceCard label="Payment amount" value={formatPHP(amount)} tone="info" />
          <BalanceCard label="New balance after payment" value={formatPHP(newBalance)} tone="success" big />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h3 className="font-display text-base font-semibold">Recent payment history</h3>
          <p className="text-xs text-muted-foreground">Last collected payments across all borrowers</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Previous</TableHead>
                <TableHead className="text-right">New balance</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.date)}</TableCell>
                  <TableCell className="font-medium">{clientById(p.clientId).name}</TableCell>
                  <TableCell className="text-right num font-medium">{formatPHP(p.amount)}</TableCell>
                  <TableCell className="text-right num text-muted-foreground">{formatPHP(p.previousBalance)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(p.newBalance)}</TableCell>
                  <TableCell>{collectorById(p.collectorId).name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.remarks ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/* ---------- UPLOAD EXCEL TAB ---------- */
function UploadExcelTab() {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const valid = f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv");
    if (!valid) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file.");
      return;
    }
    setFile(f);
    toast.success(`"${f.name}" ready to import.`);
  }

  function handleRemove() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-10 shadow-sm">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="rounded-full bg-primary/10 p-5">
            <FileSpreadsheet className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">Upload Collection File</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Upload the Excel file encoded by the accounting clerk to bulk-import the day's collections into the system.
            </p>
          </div>
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-glow"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />Choose file
          </Button>
          {file && (
            <div className="w-full max-w-sm rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-left">
              <p className="font-medium text-success">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          )}
        </div>
      </div>

      {file && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleRemove}>Remove file</Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-glow"
            onClick={() => toast.success("Collection data imported successfully!")}
          >
            <Upload className="mr-2 h-4 w-4" />Import collections
          </Button>
        </div>
      )}

      <div className="rounded-2xl border bg-muted/40 p-5 text-sm">
        <p className="font-semibold text-foreground">Expected file format</p>
        <p className="mt-1 text-muted-foreground">
          Use the Excel template provided by the accounting department. Accepted formats: <span className="font-medium text-foreground">.xlsx, .xls, .csv</span>
        </p>
      </div>
    </div>
  );
}

/* ---------- COLLECTOR SUMMARY TAB ---------- */
function CollectorSummaryTab() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [collectorFilter, setCollectorFilter] = useState("all");
  const printRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    return loans
      .filter((l) => l.status !== "paid")
      .filter((l) => collectorFilter === "all" || l.collectorId === collectorFilter)
      .map((l) => {
        const client = clientById(l.clientId);
        const payment = payments
          .filter((p) => p.clientId === l.clientId && p.date === date)
          .reduce((s, p) => s + p.amount, 0);
        return {
          loanNumber: l.number,
          clientName: client.name,
          collectible: l.dailyPayment,
          balance: l.currentBalance,
          payment,
        };
      });
  }, [date, collectorFilter]);

  const totals = useMemo(() => ({
    collectible: rows.reduce((s, r) => s + r.collectible, 0),
    balance: rows.reduce((s, r) => s + r.balance, 0),
    payment: rows.reduce((s, r) => s + r.payment, 0),
  }), [rows]);

  function handlePrint() {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const collectorName = collectorFilter === "all"
      ? "All Collectors"
      : collectors.find((c) => c.id === collectorFilter)?.name ?? "";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Collector Summary — ${date}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 32px; color: #111; }
        h2 { font-size: 18px; margin: 0 0 4px; }
        .meta { font-size: 11px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f0f0f0; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #ccc; }
        td { padding: 7px 10px; border: 1px solid #ddd; }
        .right { text-align: right; }
        .total td { font-weight: 700; background: #f8f8f8; border-top: 2px solid #aaa; }
      </style></head>
      <body>
        <h2>Collector Summary</h2>
        <div class="meta">Date: ${date} &nbsp;·&nbsp; ${collectorName}</div>
        ${content}
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-44" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Collector</Label>
          <Select value={collectorFilter} onValueChange={setCollectorFilter}>
            <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collectors</SelectItem>
              {collectors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="ml-auto" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />Print Summary
        </Button>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h3 className="font-display text-base font-semibold">Collector Summary</h3>
          <p className="text-xs text-muted-foreground">Daily collection report — {date}</p>
        </div>
        <div ref={printRef} className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ct#</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead className="text-right">Collectible for the Day</TableHead>
                <TableHead className="text-right">Total Balance</TableHead>
                <TableHead className="text-right">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.loanNumber}>
                  <TableCell className="num text-muted-foreground text-xs">{r.loanNumber}</TableCell>
                  <TableCell className="font-medium">{r.clientName}</TableCell>
                  <TableCell className="text-right num">{formatPHP(r.collectible)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(r.balance)}</TableCell>
                  <TableCell className="text-right num font-semibold">
                    {r.payment > 0 ? formatPHP(r.payment) : <span className="font-normal text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No active loans found.</TableCell>
                </TableRow>
              )}
              <TableRow className="border-t-2 bg-muted/40 font-bold">
                <TableCell colSpan={2} className="font-semibold text-sm">Total</TableCell>
                <TableCell className="text-right num font-semibold">{formatPHP(totals.collectible)}</TableCell>
                <TableCell className="text-right num font-semibold">{formatPHP(totals.balance)}</TableCell>
                <TableCell className="text-right num font-bold text-primary">{formatPHP(totals.payment)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/* ---------- CLIENT LEDGER TAB ---------- */
function ClientLedgerTab() {
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
<div class="co">LendPro — Loan &amp; Collection</div>
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
              <Table>
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
                      <TableCell className="num text-muted-foreground text-xs">{r.day}</TableCell>
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
                    <TableCell colSpan={2} className="font-semibold text-sm">Total</TableCell>
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

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-semibold num ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}

/* ---------- SHARED ---------- */
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function BalanceCard({ label, value, tone, big }: { label: string; value: string; tone: "muted" | "info" | "success"; big?: boolean }) {
  const cls = tone === "success"
    ? "border-success/30 bg-success/5 text-success"
    : tone === "info"
    ? "border-info/30 bg-info/5 text-info"
    : "border-border bg-muted/30 text-foreground";
  return (
    <div className={`rounded-2xl border p-5 ${cls}`}>
      <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
      <p className={`mt-1 font-display font-semibold num ${big ? "text-3xl" : "text-2xl"}`}>{value}</p>
    </div>
  );
}
