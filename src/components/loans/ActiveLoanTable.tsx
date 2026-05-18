import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { loans, clientById, collectorById } from "@/lib/mock-data";
import { formatPHP, formatDate } from "@/lib/format";
import { LOAN_TYPE_LABELS } from "@/lib/loan-constants";
import { printLedger } from "@/lib/loan-prints";

export function ActiveLoanTable() {
  function handlePrintLedger(loanId: string) {
    const loan = loans.find((x) => x.id === loanId);
    if (!loan) return;
    printLedger(loan, clientById(loan.clientId), collectorById(loan.collectorId));
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h3 className="font-display text-base font-semibold">Active loan ledger</h3>
        <span className="text-xs text-muted-foreground">{loans.length} loans</span>
      </div>
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
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.storeName}</div>
                  </TableCell>
                  <TableCell className="text-right num">{formatPHP(l.principal)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.interest)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.serviceCharge)}</TableCell>
                  <TableCell className="text-right num font-medium">{formatPHP(l.totalReceivable)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.dailyPayment)}</TableCell>
                  <TableCell className="text-right num font-semibold">{formatPHP(l.currentBalance)}</TableCell>
                  <TableCell><StatusBadge status={l.status} /></TableCell>
                  <TableCell className="text-xs">{formatDate(l.dueDate)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{collectorById(l.collectorId).name}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handlePrintLedger(l.id)}>
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
  );
}
