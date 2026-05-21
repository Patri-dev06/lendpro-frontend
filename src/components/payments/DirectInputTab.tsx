import { useCallback, useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/Field";
import { BalanceCard } from "@/components/payments/BalanceCard";
import { apiRequest } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import { formatPHP, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface ApiLoan {
  id: number;
  number: string;
  daily_payment: number;
  current_balance: number;
  status: string;
  client_id: number;
  collector_id: number;
  client: { id: number; name: string; store_name: string };
  collector: { id: number; name: string };
}

interface ApiCollector { id: number; name: string; }

interface ApiPayment {
  id: number;
  payment_date: string;
  amount: number;
  previous_balance: number;
  new_balance: number;
  remarks: string | null;
  client: { name: string };
  collector: { name: string };
}

export function DirectInputTab() {
  const { token } = useRole();

  const [loans, setLoans]           = useState<ApiLoan[]>([]);
  const [collectors, setCollectors] = useState<ApiCollector[]>([]);
  const [history, setHistory]       = useState<ApiPayment[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [amount, setAmount]     = useState(0);
  const [collectorId, setCollectorId] = useState<number | null>(null);
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks]   = useState("");
  const [saving, setSaving]     = useState(false);

  const selectedLoan = loans.find((l) => l.id === selectedLoanId);
  const newBalance   = Math.max(0, (selectedLoan?.current_balance ?? 0) - amount);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [loanData, colData, payData] = await Promise.all([
        apiRequest<ApiLoan[]>("GET", "loans", { token }),
        apiRequest<ApiCollector[]>("GET", "collectors", { token }),
        apiRequest<ApiPayment[]>("GET", "payments", { token }),
      ]);
      const active = loanData.filter((l) => l.status !== "paid");
      setLoans(active);
      setCollectors(colData);
      setHistory(payData.slice(0, 20));
      if (active.length > 0) {
        setSelectedLoanId(active[0].id);
        setAmount(active[0].daily_payment);
        setCollectorId(active[0].collector_id);
      }
    } catch {
      toast.error("Failed to load payment data.");
    } finally {
      setLoadingInit(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleLoanChange(id: number) {
    setSelectedLoanId(id);
    const loan = loans.find((l) => l.id === id);
    if (loan) {
      setAmount(loan.daily_payment);
      setCollectorId(loan.collector_id);
    }
  }

  async function handleSubmit() {
    if (!token || !selectedLoanId || !collectorId || amount <= 0) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const paidAmount = amount;
    setSaving(true);
    try {
      const result = await apiRequest<{ amount: number; new_balance: number }>("POST", "payments", {
        token,
        body: {
          loan_id:      selectedLoanId,
          collector_id: collectorId,
          payment_date: date,
          amount:       paidAmount,
          remarks:      remarks || null,
        },
      });
      toast.success(`Payment of ${formatPHP(result.amount)} recorded.`, {
        description: `New balance: ${formatPHP(result.new_balance)}`,
      });
      setRemarks("");
      // Refresh data
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingInit) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="font-display text-base font-semibold">Payment details</h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Borrower">
              <Select value={String(selectedLoanId ?? "")} onValueChange={(v) => handleLoanChange(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select borrower…" /></SelectTrigger>
                <SelectContent>
                  {loans.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.client.name} — {l.client.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Loan number">
              <Input value={selectedLoan?.number ?? "—"} readOnly className="bg-muted/40 text-muted-foreground" />
            </Field>

            <Field label="Outstanding balance">
              <Input value={formatPHP(selectedLoan?.current_balance ?? 0)} readOnly className="bg-muted/40 text-muted-foreground" />
            </Field>

            <Field label="Expected payment today">
              <Input value={formatPHP(selectedLoan?.daily_payment ?? 0)} readOnly className="bg-muted/40 text-muted-foreground" />
            </Field>

            <Field label="Payment amount (₱)">
              <Input type="number" min={0.01} value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)} />
            </Field>

            <Field label="Payment date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            <Field label="Collector">
              <Select value={String(collectorId ?? "")} onValueChange={(v) => setCollectorId(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select collector…" /></SelectTrigger>
                <SelectContent>
                  {collectors.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Remarks" full>
              <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes…" />
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setRemarks("");
              if (selectedLoan) { setAmount(selectedLoan.daily_payment); }
            }}>Reset</Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-glow"
              onClick={handleSubmit}
              disabled={saving || !selectedLoanId || amount <= 0}
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Wallet className="mr-1.5 h-4 w-4" />}
              {saving ? "Recording…" : "Record payment"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <BalanceCard label="Previous balance"        value={formatPHP(selectedLoan?.current_balance ?? 0)} tone="muted" />
          <BalanceCard label="Payment amount"          value={formatPHP(amount)}     tone="info" />
          <BalanceCard label="New balance after payment" value={formatPHP(newBalance)} tone="success" big />
        </div>
      </div>

      {/* Recent history */}
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h3 className="font-display text-base font-semibold">Recent payment history</h3>
          <p className="text-xs text-muted-foreground">Last collected payments across all borrowers</p>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-175">
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
              {history.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No payments recorded yet.</td></tr>
              ) : history.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.payment_date)}</TableCell>
                  <TableCell className="font-medium">{p.client.name}</TableCell>
                  <TableCell className="text-right num font-medium">{formatPHP(p.amount)}</TableCell>
                  <TableCell className="text-right num text-muted-foreground">{formatPHP(p.previous_balance)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(p.new_balance)}</TableCell>
                  <TableCell>{p.collector.name}</TableCell>
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
