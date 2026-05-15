import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collectors, loans, payments, clientById, collectorById } from "@/lib/mock-data";
import { formatPHP, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — LendPro" }] }),
  component: ReportsPage,
});

const categories = [
  "Daily Collection Report",
  "Borrower Payment History",
  "Active Loans Report",
  "Fully Paid Loans Report",
  "Overdue +3 Days Report",
  "Past Due +30 Days Report",
  "Collector Performance Report",
  "Portfolio Collection Summary",
];

function ReportsPage() {
  const [active, setActive] = useState(categories[0]);

  return (
    <div className="space-y-6">
      <PageHeader title="Report center" subtitle="Generate, preview and export operational reports." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={cn(
              "rounded-2xl border bg-card p-4 text-left text-sm shadow-sm transition hover:border-primary-glow/40 hover:shadow-md",
              active === c && "border-primary-glow/60 ring-2 ring-primary-glow/20"
            )}
          >
            <FileText className="h-5 w-5 text-primary-glow" />
            <p className="mt-2 font-medium leading-tight">{c}</p>
            <p className="mt-1 text-xs text-muted-foreground">Tap to preview</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b p-5">
          <div>
            <h3 className="font-display text-base font-semibold">{active}</h3>
            <p className="text-xs text-muted-foreground">Filter, generate, then export.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input type="date" className="h-9 w-36" />
            <Input type="date" className="h-9 w-36" />
            <Select defaultValue="all">
              <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Collector" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All collectors</SelectItem>
                {collectors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="past-due">Past Due</SelectItem>
                <SelectItem value="paid">Fully Paid</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => toast.success("Report generated")} className="h-9 bg-primary text-primary-foreground hover:bg-primary-glow"><Sparkles className="mr-1.5 h-4 w-4" />Generate</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
          <Summary label="Total expected" value={formatPHP(loans.reduce((s, l) => s + l.dailyPayment, 0))} />
          <Summary label="Total collected" value={formatPHP(payments.reduce((s, p) => s + p.amount, 0))} />
          <Summary label="Outstanding balance" value={formatPHP(loans.reduce((s, l) => s + l.currentBalance, 0))} />
          <Summary label="Accounts in report" value={String(loans.length)} />
        </div>

        <div className="overflow-x-auto px-5 pb-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Loan #</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const l = loans.find((x) => x.id === p.loanId)!;
                return (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell className="font-medium">{clientById(p.clientId).name}</TableCell>
                    <TableCell className="font-mono text-xs">{l.number}</TableCell>
                    <TableCell>{collectorById(p.collectorId).name}</TableCell>
                    <TableCell className="text-right num">{formatPHP(p.amount)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(p.newBalance)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-4">
          <Button variant="outline" size="sm" onClick={() => toast.success("Exported to Excel")}><FileSpreadsheet className="mr-1.5 h-4 w-4" />Export Excel</Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Exported to PDF")}><Download className="mr-1.5 h-4 w-4" />Export PDF</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-1.5 h-4 w-4" />Print</Button>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-base font-semibold num">{value}</p>
    </div>
  );
}
