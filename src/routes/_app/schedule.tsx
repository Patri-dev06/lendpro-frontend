import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import { formatPHP, formatDate } from "@/lib/format";
import { PermissionGuard } from "@/components/shared/AccessRestricted";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/schedule")({
  head: () => ({ meta: [{ title: "Collection Schedule — BuenaMano" }] }),
  component: SchedulePage,
});

interface ApiLoan {
  id: number;
  number: string;
  total_receivable: number;
  daily_payment: number;
  current_balance: number;
  status: string;
  client: { name: string; store_name: string };
  collector: { name: string };
}

interface ScheduleRow {
  id: number;
  scheduled_date: string;
  expected: number;
  actual: number;
  previous_balance: number;
  balance_after: number;
  status: string;
  remarks: string | null;
}

function SchedulePage() {
  const { token } = useRole();
  const [loans, setLoans]           = useState<ApiLoan[]>([]);
  const [loanId, setLoanId]         = useState<number | null>(null);
  const [rows, setRows]             = useState<ScheduleRow[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [loadingRows, setLoadingRows]   = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");
  const [statusF, setStatusF]   = useState("all");

  const fetchLoans = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<ApiLoan[]>("GET", "loans", { token });
      setLoans(data);
      if (data.length > 0) setLoanId(data[0].id);
    } catch {
      toast.error("Failed to load loans.");
    } finally {
      setLoadingLoans(false);
    }
  }, [token]);

  const fetchSchedule = useCallback(async (id: number) => {
    if (!token) return;
    setLoadingRows(true);
    try {
      const data = await apiRequest<ScheduleRow[]>("GET", `loans/${id}/schedule`, { token });
      setRows(data);
    } catch {
      toast.error("Failed to load schedule.");
    } finally {
      setLoadingRows(false);
    }
  }, [token]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);
  useEffect(() => { if (loanId) fetchSchedule(loanId); }, [loanId, fetchSchedule]);

  const loan = loans.find((l) => l.id === loanId);

  const filtered = rows.filter((r) => {
    if (statusF !== "all" && r.status !== statusF) return false;
    if (fromDate && r.scheduled_date < fromDate) return false;
    if (toDate   && r.scheduled_date > toDate)   return false;
    return true;
  });

  function handlePrint() {
    window.print();
  }

  function handleExport() {
    if (!loan || rows.length === 0) return;
    const header = "Date,Expected,Actual,Prev Balance,Balance After,Status,Remarks";
    const csv = rows.map((r) =>
      [r.scheduled_date, r.expected, r.actual, r.previous_balance, r.balance_after, r.status, r.remarks ?? ""].join(",")
    ).join("\n");
    const blob = new Blob([header + "\n" + csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `schedule-${loan.number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PermissionGuard permission="schedule:read">
    <div className="space-y-6">
      <PageHeader
        title="Automated collection schedule"
        subtitle="Daily payment plan generated when the loan was created."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-1.5 h-4 w-4" />Print</Button>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-4 w-4" />Export</Button>
          </div>
        }
      />

      {/* Loan summary card */}
      {loan ? (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Schedule for</p>
              <h3 className="font-display text-xl font-semibold">{loan.client.name}</h3>
              <p className="text-sm text-muted-foreground">{loan.client.store_name} · Loan {loan.number}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <KV label="Total receivable" value={formatPHP(loan.total_receivable)} />
              <KV label="Daily payment"    value={formatPHP(loan.daily_payment)} />
              <KV label="Current balance"  value={formatPHP(loan.current_balance)} highlight />
              <KV label="Status"           value={<StatusBadge status={loan.status} />} />
            </div>
          </div>
        </div>
      ) : (
        !loadingLoans && (
          <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
            No loans found. Create a loan first.
          </div>
        )
      )}

      <div className="rounded-2xl border bg-card shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          {loadingLoans ? (
            <div className="flex h-9 w-72 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />Loading loans…
            </div>
          ) : (
            <Select value={String(loanId ?? "")} onValueChange={(v) => setLoanId(Number(v))}>
              <SelectTrigger className="h-9 w-72"><SelectValue placeholder="Select a loan…" /></SelectTrigger>
              <SelectContent>
                {loans.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.number} — {l.client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input type="date" className="h-9 w-44" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From" />
          <Input type="date" className="h-9 w-44" value={toDate}   onChange={(e) => setToDate(e.target.value)}   placeholder="To" />
          <Select value={statusF} onValueChange={setStatusF}>
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
          {(fromDate || toDate || statusF !== "all") && (
            <Button variant="ghost" size="sm" className="h-9 text-xs"
              onClick={() => { setFromDate(""); setToDate(""); setStatusF("all"); }}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Table */}
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
              {loadingRows ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  {rows.length === 0 ? "No schedule rows found." : "No rows match the current filters."}
                </td></tr>
              ) : filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.scheduled_date)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(r.expected)}</TableCell>
                  <TableCell className="text-right num font-medium">{formatPHP(r.actual)}</TableCell>
                  <TableCell className="text-right num text-muted-foreground">{formatPHP(r.previous_balance)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(r.balance_after)}</TableCell>
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
