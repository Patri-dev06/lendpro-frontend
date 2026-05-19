import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loans, clientById, generateSchedule } from "@/lib/mock-data";
import { formatPHP, formatDate } from "@/lib/format";
import { PermissionGuard } from "@/components/shared/AccessRestricted";

export const Route = createFileRoute("/_app/schedule")({
  head: () => ({ meta: [{ title: "Collection Schedule — BuenaMano" }] }),
  component: SchedulePage,
});

function SchedulePage() {
  const [loanId, setLoanId] = useState(loans[0].id);
  const loan = loans.find((l) => l.id === loanId)!;
  const client = clientById(loan.clientId);
  const rows = generateSchedule(loan, 7);

  return (
    <PermissionGuard permission="schedule:read">
    <div className="space-y-6">
      <PageHeader
        title="Automated collection schedule"
        subtitle="Daily payment plan generated when the loan was created."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Printer className="mr-1.5 h-4 w-4" />Print</Button>
            <Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" />Export</Button>
          </div>
        }
      />

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Schedule for</p>
            <h3 className="font-display text-xl font-semibold">{client.name}</h3>
            <p className="text-sm text-muted-foreground">{client.storeName} · Loan {loan.number}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <KV label="Total receivable" value={formatPHP(loan.totalReceivable)} />
            <KV label="Daily payment" value={formatPHP(loan.dailyPayment)} />
            <KV label="Current balance" value={formatPHP(loan.currentBalance)} highlight />
            <KV label="Status" value={<StatusBadge status={loan.status} />} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <Select value={loanId} onValueChange={setLoanId}>
            <SelectTrigger className="h-9 w-72"><SelectValue /></SelectTrigger>
            <SelectContent>{loans.map((l) => { const c = clientById(l.clientId); return <SelectItem key={l.id} value={l.id}>{l.number} — {c.name}</SelectItem>; })}</SelectContent>
          </Select>
          <Input type="date" className="h-9 w-44" />
          <Input type="date" className="h-9 w-44" />
          <Select defaultValue="all">
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="catch-up">Catch-Up</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-175">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Previous balance</TableHead>
                <TableHead className="text-right">Balance after</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.date}>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(r.expected)}</TableCell>
                  <TableCell className="text-right num font-medium">{formatPHP(r.actual)}</TableCell>
                  <TableCell className="text-right num text-muted-foreground">{formatPHP(r.previousBalance)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(r.balanceAfter)}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.remarks ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );
}

function KV({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${highlight ? "border-primary/30 bg-primary/5" : ""}`}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-sm font-semibold num">{value}</p>
    </div>
  );
}
