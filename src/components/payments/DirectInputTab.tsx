import { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/Field";
import { BalanceCard } from "@/components/payments/BalanceCard";
import { clients, loans, payments, clientById, collectorById, collectors } from "@/lib/mock-data";
import { formatPHP, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function DirectInputTab() {
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
