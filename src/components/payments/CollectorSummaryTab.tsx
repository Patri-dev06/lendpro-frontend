import { useMemo, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loans, payments, collectors, clientById } from "@/lib/mock-data";
import { formatPHP } from "@/lib/format";

export function CollectorSummaryTab() {
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
        return { loanNumber: l.number, clientName: client.name, collectible: l.dailyPayment, balance: l.currentBalance, payment };
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
    win.document.write(`<html><head><title>Collector Summary — ${date}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;padding:32px;color:#111}
  h2{font-size:18px;margin:0 0 4px}.meta{font-size:11px;color:#666;margin-bottom:20px}
  table{width:100%;border-collapse:collapse}
  th{background:#f0f0f0;font-weight:600;text-align:left;padding:8px 10px;border:1px solid #ccc}
  td{padding:7px 10px;border:1px solid #ddd}.right{text-align:right}
  .total td{font-weight:700;background:#f8f8f8;border-top:2px solid #aaa}
</style></head><body>
<h2>Collector Summary</h2>
<div class="meta">Date: ${date} &nbsp;·&nbsp; ${collectorName}</div>
${content}
</body></html>`);
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
          <Table className="min-w-150">
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
                  <TableCell className="num text-xs text-muted-foreground">{r.loanNumber}</TableCell>
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
                <TableCell colSpan={2} className="text-sm font-semibold">Total</TableCell>
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
