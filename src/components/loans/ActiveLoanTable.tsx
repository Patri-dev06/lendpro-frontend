import { useState } from "react";
import { Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { formatPHP, formatDate } from "@/lib/format";
import { LOAN_TYPE_LABELS } from "@/lib/loan-constants";
import { printLedger } from "@/lib/loan-prints";
import type { ApiLoan } from "@/components/loans/LoanCreateSection";

interface Props {
  loans: ApiLoan[];
  loading: boolean;
}

export function ActiveLoanTable({ loans, loading }: Props) {
  const [q, setQ]           = useState("");
  const [status, setStatus] = useState("all");

  const filtered = loans.filter((l) => {
    const matchStatus = status === "all" || l.status === status;
    const search = q.toLowerCase();
    const matchQ = !search ||
      l.number.toLowerCase().includes(search) ||
      l.client.name.toLowerCase().includes(search) ||
      l.client.store_name.toLowerCase().includes(search) ||
      l.collector.name.toLowerCase().includes(search);
    return matchStatus && matchQ;
  });

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h3 className="font-display text-base font-semibold">Active loan ledger</h3>
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} of ${loans.length} loans`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 w-44 pl-8 text-xs"
              placeholder="Search loans…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="renew">Renew</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="past-due">Past Due</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="min-w-250">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} className="py-12 text-center text-sm text-muted-foreground">
                  Loading loans…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="py-12 text-center text-sm text-muted-foreground">
                  {loans.length === 0 ? "No loans yet. Create one above." : "No loans match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.number}</TableCell>
                  <TableCell>
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize">
                      {LOAN_TYPE_LABELS[l.loan_type as keyof typeof LOAN_TYPE_LABELS] ?? l.loan_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{l.client.name}</div>
                    <div className="text-xs text-muted-foreground">{l.client.store_name}</div>
                  </TableCell>
                  <TableCell className="text-right num">{formatPHP(l.principal)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.interest)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.service_charge)}</TableCell>
                  <TableCell className="text-right num font-medium">{formatPHP(l.total_receivable)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.daily_payment)}</TableCell>
                  <TableCell className="text-right num font-semibold">{formatPHP(l.current_balance)}</TableCell>
                  <TableCell><StatusBadge status={l.status} /></TableCell>
                  <TableCell className="text-xs">{formatDate(l.due_date)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.collector.name}</TableCell>
                  <TableCell>
                    <Button
                      size="sm" variant="ghost" className="h-7 px-2 text-xs"
                      onClick={() => printLedger(l)}
                    >
                      <Printer className="mr-1 h-3 w-3" />Ledger
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
