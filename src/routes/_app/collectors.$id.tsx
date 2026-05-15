import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatCard } from "@/components/finance/StatCard";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";
import { collectorById, clients, loans, expectedVsActual } from "@/lib/mock-data";
import { formatPHP } from "@/lib/format";
import { Target, Wallet, AlertTriangle, AlertOctagon } from "lucide-react";

export const Route = createFileRoute("/_app/collectors/$id")({
  component: CollectorDetail,
});

const weekly = [
  { week: "W1", rate: 88 }, { week: "W2", rate: 92 }, { week: "W3", rate: 90 }, { week: "W4", rate: 94 },
];

function CollectorDetail() {
  const { id } = useParams({ from: "/_app/collectors/$id" });
  const c = collectorById(id);
  const myClients = clients.filter((x) => x.collectorId === id);
  const myLoans = loans.filter((l) => l.collectorId === id);
  const rate = Math.round((c.actual / c.expected) * 100);
  const initials = c.name.split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2"><Link to="/collectors"><ArrowLeft className="mr-1 h-4 w-4" />Back to collectors</Link></Button>
      <PageHeader title={c.name} subtitle={`${c.code} · ${c.area}`} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary text-primary-foreground font-semibold">{initials}</AvatarFallback></Avatar>
            <div>
              <p className="font-display text-lg font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.code}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="Assigned clients" value={c.assigned} />
            <Row label="Area" value={<span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.area}</span>} />
            <Row label="Expected (mo.)" value={formatPHP(c.expected * 22)} />
            <Row label="Actual (mo.)" value={formatPHP(c.actual * 22)} />
            <Row label="Collection rate" value={<span className="font-semibold text-success">{rate}%</span>} />
            <Row label="Missed" value={c.missed} />
            <Row label="Overdue" value={c.overdue} />
            <Row label="Past due" value={c.pastDue} />
          </dl>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Assigned" value={String(c.assigned)} icon={Users} />
          <StatCard label="Expected (mo.)" value={formatPHP(c.expected * 22, { compact: true })} icon={Target} tone="info" />
          <StatCard label="Actual (mo.)" value={formatPHP(c.actual * 22, { compact: true })} icon={Wallet} tone="success" />
          <StatCard label="Rate" value={`${rate}%`} icon={Target} tone="success" />
          <StatCard label="Overdue" value={String(c.overdue)} icon={AlertTriangle} tone="warning" />
          <StatCard label="Past due" value={String(c.pastDue)} icon={AlertOctagon} tone="destructive" />
          <StatCard label="Missed today" value={String(c.missed)} icon={AlertTriangle} tone="warning" />
          <StatCard label="Expected today" value={formatPHP(c.expected, { compact: true })} icon={Target} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Chart title="Daily collection performance">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={expectedVsActual}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₱${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatPHP(v)} />
              <Bar dataKey="expected" fill="var(--muted-foreground)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual" fill="var(--primary-glow)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
        <Chart title="Weekly collection rate trend">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weekly}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[80, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => `${v}%`} />
              <Line type="monotone" dataKey="rate" stroke="var(--primary-glow)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--primary-glow)" }} />
            </LineChart>
          </ResponsiveContainer>
        </Chart>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
        <div className="border-b px-5 py-4"><h3 className="font-display text-base font-semibold">Assigned borrower accounts</h3></div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Store</TableHead>
              <TableHead className="text-right">Daily</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myClients.map((cl) => {
              const l = myLoans.find((x) => x.clientId === cl.id)!;
              return (
                <TableRow key={cl.id}>
                  <TableCell className="font-medium">{cl.name}</TableCell>
                  <TableCell className="text-muted-foreground">{cl.storeName}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.dailyPayment)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.currentBalance)}</TableCell>
                  <TableCell><StatusBadge status={l.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="num font-medium">{value}</span></div>;
}
function Chart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="mb-3 font-display text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}
