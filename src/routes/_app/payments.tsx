import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Wallet, Upload, FileSpreadsheet, Printer, Lock } from "lucide-react";
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
        </TabsList>
        <TabsContent value="direct" className="mt-5"><DirectInputTab /></TabsContent>
        <TabsContent value="upload" className="mt-5">
          {isClerk ? <UploadExcelTab /> : <AccessRestricted />}
        </TabsContent>
        <TabsContent value="summary" className="mt-5"><CollectorSummaryTab /></TabsContent>
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
