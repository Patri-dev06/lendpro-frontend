import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Phone, Store } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientById, loanByClientId, payments, collectorById, generateSchedule } from "@/lib/mock-data";
import { formatPHP, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_app/clients/$clientId")({
  component: ClientDetail,
});

function ClientDetail() {
  const { clientId } = useParams({ from: "/_app/clients/$clientId" });
  const c = clientById(clientId);
  const loan = loanByClientId(clientId);
  const cPayments = payments.filter((p) => p.clientId === clientId);
  const schedule = loan ? generateSchedule(loan, 5).slice(0, 12) : [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2"><Link to="/clients"><ArrowLeft className="mr-1 h-4 w-4" />Back to clients</Link></Button>
      <PageHeader title={c.name} subtitle={`${c.number} · ${c.storeName}`} actions={<StatusBadge status={c.status} />} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="font-display text-sm font-semibold">Client information</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Info icon={Store} label="Store">{c.storeName}</Info>
            <Info icon={MapPin} label="Address">{c.address}</Info>
            <Info icon={Phone} label="Phone">{c.phone}</Info>
            <div className="flex justify-between"><dt className="text-muted-foreground">Type</dt><dd><StatusBadge status={c.type} /></dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Collector</dt><dd className="font-medium">{collectorById(c.collectorId).name}</dd></div>
          </dl>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="font-display text-sm font-semibold">Loan summary</h3>
          {loan ? (
            <div className="mt-4 space-y-2.5 text-sm">
              <Row label="Loan #" value={<span className="font-mono">{loan.number}</span>} />
              <Row label="Principal" value={formatPHP(loan.principal)} />
              <Row label="Interest" value={formatPHP(loan.interest)} />
              <Row label="Service charge" value={formatPHP(loan.serviceCharge)} />
              <Row label="Total receivable" value={<span className="font-semibold">{formatPHP(loan.totalReceivable)}</span>} />
              <Row label="Daily payment" value={formatPHP(loan.dailyPayment)} />
              <Row label="Released" value={formatDate(loan.releaseDate)} />
              <Row label="Expected end" value={formatDate(loan.expectedEndDate)} />
            </div>
          ) : <p className="mt-3 text-sm text-muted-foreground">No active loan.</p>}
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-sm">
          <p className="text-xs uppercase tracking-wider opacity-80">Current outstanding balance</p>
          <p className="mt-1 font-display text-3xl font-semibold num">{loan ? formatPHP(loan.currentBalance) : "—"}</p>
          {loan && (
            <>
              <div className="mt-4 h-2 rounded-full bg-primary-foreground/20">
                <div className="h-2 rounded-full bg-primary-foreground" style={{ width: `${100 - (loan.currentBalance / loan.totalReceivable) * 100}%` }} />
              </div>
              <p className="mt-3 text-xs opacity-80">{Math.round(100 - (loan.currentBalance / loan.totalReceivable) * 100)}% of receivable collected</p>
            </>
          )}
          <Button asChild variant="secondary" className="mt-5 w-full"><Link to="/payments">Record payment</Link></Button>
        </div>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payment history</TabsTrigger>
          <TabsTrigger value="schedule">Collection schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="payments">
          <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Previous</TableHead><TableHead className="text-right">New balance</TableHead><TableHead>Collector</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
              <TableBody>
                {cPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.date)}</TableCell>
                    <TableCell className="text-right num font-medium">{formatPHP(p.amount)}</TableCell>
                    <TableCell className="text-right num text-muted-foreground">{formatPHP(p.previousBalance)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(p.newBalance)}</TableCell>
                    <TableCell>{collectorById(p.collectorId).name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.remarks ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {cPayments.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No payments yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="schedule">
          <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Expected</TableHead><TableHead className="text-right">Actual</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {schedule.map((s) => (
                  <TableRow key={s.date}>
                    <TableCell>{formatDate(s.date)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(s.expected)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(s.actual)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(s.balanceAfter)}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{children}</p>
      </div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="num">{value}</span></div>;
}
