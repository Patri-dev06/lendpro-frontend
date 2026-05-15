import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clients, collectors, loans, clientById, collectorById } from "@/lib/mock-data";
import { formatPHP, formatDate, addDays } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/loans")({
  head: () => ({ meta: [{ title: "Loans — LendPro" }] }),
  component: LoansPage,
});

function LoansPage() {
  const [client, setClient] = useState(clients[0].id);
  const [principal, setPrincipal] = useState(10000);
  const [interest, setInterest] = useState(1500);
  const [sc, setSc] = useState(500);
  const [daily, setDaily] = useState(250);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [collector, setCollector] = useState(collectors[0].id);
  const [remarks, setRemarks] = useState("");

  const totalReceivable = principal + interest + sc;
  const days = daily > 0 ? Math.ceil(totalReceivable / daily) : 0;
  const expectedEnd = days > 0 ? addDays(date, days) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Loan management" subtitle="Encode new loans and review the active loan ledger." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        {/* Form */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Create new loan</h3>
            <span className="rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">Auto-computed</span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Select client">
              <Select value={client} onValueChange={setClient}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.storeName}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Assigned collector">
              <Select value={collector} onValueChange={setCollector}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{collectors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Principal loan (₱)"><Input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value) || 0)} /></Field>
            <Field label="Interest (₱)"><Input type="number" value={interest} onChange={(e) => setInterest(Number(e.target.value) || 0)} /></Field>
            <Field label="Service charge (₱)"><Input type="number" value={sc} onChange={(e) => setSc(Number(e.target.value) || 0)} /></Field>
            <Field label="Daily payment (₱)"><Input type="number" value={daily} onChange={(e) => setDaily(Number(e.target.value) || 0)} /></Field>
            <Field label="Loan release date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Remarks (optional)" full><Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any internal notes about this loan…" /></Field>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-glow"
              onClick={() => toast.success(`Loan created and collection schedule generated for ${days} days`)}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              Create loan & generate schedule
            </Button>
          </div>
        </div>

        {/* Auto-compute */}
        <div className="rounded-2xl border bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-md">
          <h3 className="font-display text-base font-semibold">Loan summary</h3>
          <p className="text-xs opacity-75">Live calculation based on inputs</p>

          <dl className="mt-5 space-y-3 text-sm">
            <SumRow label="Principal" value={formatPHP(principal)} />
            <SumRow label="Interest" value={formatPHP(interest)} />
            <SumRow label="Service charge" value={formatPHP(sc)} />
            <div className="my-3 border-t border-primary-foreground/20" />
            <SumRow label="Total receivable" value={formatPHP(totalReceivable)} bold />
            <SumRow label="Daily payment" value={formatPHP(daily)} />
            <SumRow label="Estimated days" value={`${days} days`} />
            <SumRow label="Expected completion" value={expectedEnd ? formatDate(expectedEnd) : "—"} />
            <SumRow label="Starting balance" value={formatPHP(totalReceivable)} bold />
          </dl>
          <p className="mt-5 text-[11px] opacity-70">Total Receivable = Principal + Interest + Service Charge. Days = Receivable ÷ Daily Payment.</p>
        </div>
      </div>

      {/* Loan list */}
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-display text-base font-semibold">Active loan ledger</h3>
          <span className="text-xs text-muted-foreground">{loans.length} loans</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead className="text-right">S.C.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Daily</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expected end</TableHead>
                <TableHead>Collector</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((l) => {
                const c = clientById(l.clientId);
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{l.number}</TableCell>
                    <TableCell><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.storeName}</div></TableCell>
                    <TableCell className="text-right num">{formatPHP(l.principal)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(l.interest)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(l.serviceCharge)}</TableCell>
                    <TableCell className="text-right num font-medium">{formatPHP(l.totalReceivable)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(l.dailyPayment)}</TableCell>
                    <TableCell className="text-right num font-semibold">{formatPHP(l.currentBalance)}</TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                    <TableCell className="text-xs">{formatDate(l.expectedEndDate)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{collectorById(l.collectorId).name}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
function SumRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="opacity-80">{label}</span>
      <span className={`num ${bold ? "font-display text-lg font-semibold" : "text-sm"}`}>{value}</span>
    </div>
  );
}
