import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users, UserPlus, Repeat, AlertTriangle, AlertOctagon, CheckCircle2,
  Wallet, TrendingUp, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { StatCard } from "@/components/finance/StatCard";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { PageHeader } from "@/components/finance/PageHeader";
import { SelectTriggerSm } from "@/components/shared/SelectTriggerSm";
import { CollectionEfficiencyBanner } from "@/components/dashboard/CollectionEfficiencyBanner";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { FinStat } from "@/components/dashboard/FinStat";
import { BankBalanceCard } from "@/components/dashboard/BankBalanceCard";
import { clients, loans, collectors, collectorById, clientById, monthlyReleases, outstandingTrend, monthlyCollection } from "@/lib/mock-data";
import { formatPHP } from "@/lib/format";
import { tokenColors, tooltipStyle } from "@/components/dashboard/dashboardConstants";

export function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collectorFilter, setCollectorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const totalOutstanding = loans.reduce((s, l) => s + l.currentBalance, 0);
  const totalReceivable = loans.reduce((s, l) => s + l.totalReceivable, 0);
  const totalCollected = totalReceivable - totalOutstanding;
  const collectionEfficiency = Math.round((totalCollected / totalReceivable) * 100);

  const currentMonth = monthlyReleases[monthlyReleases.length - 1];
  const releasesThisMonth = currentMonth?.releases ?? 0;
  const releasesThisYear = monthlyReleases.reduce((s, m) => s + m.releases, 0);
  const collectionThisMonth = monthlyCollection[monthlyCollection.length - 1]?.collected ?? 0;
  const collectionThisYear = monthlyCollection.reduce((s, m) => s + m.collected, 0);

  const counts = useMemo(() => ({
    active: loans.filter((l) => l.status !== "paid").length,
    newL: clients.filter((c) => c.type === "new").length,
    renew: clients.filter((c) => c.type === "renew").length,
    overdue: loans.filter((l) => l.status === "overdue").length,
    pastDue: loans.filter((l) => l.status === "past-due").length,
    paid: loans.filter((l) => l.status === "paid").length,
  }), []);

  const donut = [
    { name: "Active", value: loans.filter((l) => l.status === "new" || l.status === "renew").length, color: tokenColors.primary },
    { name: "Overdue", value: counts.overdue, color: tokenColors.warning },
    { name: "Past Due", value: counts.pastDue, color: tokenColors.destructive },
    { name: "Fully Paid", value: counts.paid, color: tokenColors.success },
  ];

  const filtered = loans.filter((l) => {
    const c = clientById(l.clientId);
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (collectorFilter !== "all" && l.collectorId !== collectorFilter) return false;
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (search && !(`${c.name} ${c.storeName}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        subtitle="Daily snapshot of the loan portfolio and active borrower accounts."
        actions={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary-glow">
            <Link to="/loans">Create new loan</Link>
          </Button>
        }
      />

      <CollectionEfficiencyBanner rate={collectionEfficiency} collected={totalCollected} receivable={totalReceivable} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Active Borrowers" value={String(counts.active)} icon={Users} hint="across all collectors" trend={4} />
        <StatCard label="New Loaners" value={String(counts.newL)} icon={UserPlus} tone="info" hint="this cycle" trend={12} />
        <StatCard label="Renew Loaners" value={String(counts.renew)} icon={Repeat} tone="purple" hint="returning clients" trend={6} />
        <StatCard label="Overdue +3 Days" value={String(counts.overdue)} icon={AlertTriangle} tone="warning" hint="needs follow-up" trend={-2} />
        <StatCard label="Past Due +30 Days" value={String(counts.pastDue)} icon={AlertOctagon} tone="destructive" hint="critical accounts" trend={1} />
        <StatCard label="Fully Paid" value={String(counts.paid)} icon={CheckCircle2} tone="success" hint="this month" trend={9} />
        <StatCard label="Outstanding" value={formatPHP(totalOutstanding, { compact: true })} icon={Wallet} hint="portfolio balance" trend={3} />
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Financial Summary</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <FinStat label="Releases This Month" value={formatPHP(releasesThisMonth, { compact: true })} icon={ArrowUpRight} tone="info" />
          <FinStat label="Releases This Year" value={formatPHP(releasesThisYear, { compact: true })} icon={ArrowUpRight} tone="info" sub="running total" />
          <FinStat label="Collection This Month" value={formatPHP(collectionThisMonth, { compact: true })} icon={TrendingUp} tone="success" />
          <FinStat label="Collection This Year" value={formatPHP(collectionThisYear, { compact: true })} icon={TrendingUp} tone="success" sub="running total" />
          <BankBalanceCard />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Loan account status" subtitle="Distribution across portfolio">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={donut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={2}>
                {donut.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip {...tooltipStyle()} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
            {donut.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-medium num">{d.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Monthly loan releases" subtitle="Total disbursed per month">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyReleases}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₱${v / 1000}k`} />
              <Tooltip {...tooltipStyle()} formatter={(v: number) => formatPHP(v)} />
              <Bar dataKey="releases" fill={tokenColors.primary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Outstanding balance trend" subtitle="Portfolio receivables">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={outstandingTrend}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₱${v / 1000000}M`} />
              <Tooltip {...tooltipStyle()} formatter={(v: number) => formatPHP(v)} />
              <Line type="monotone" dataKey="outstanding" stroke={tokenColors.primary} strokeWidth={2.5} dot={{ r: 3, fill: tokenColors.primary }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h3 className="font-display text-base font-semibold">Borrower monitoring</h3>
            <p className="text-xs text-muted-foreground">All active borrower accounts and loan health</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search client…" className="h-9 w-48" value={search} onChange={(e) => setSearch(e.target.value)} />
            <SelectTriggerSm value={statusFilter} onChange={setStatusFilter} placeholder="Status" options={[
              { v: "all", l: "All status" }, { v: "new", l: "New Loaner" }, { v: "renew", l: "Renew Loaner" },
              { v: "overdue", l: "Overdue" }, { v: "past-due", l: "Past Due" }, { v: "paid", l: "Fully Paid" },
            ]} />
            <SelectTriggerSm value={collectorFilter} onChange={setCollectorFilter} placeholder="Collector" options={[
              { v: "all", l: "All collectors" }, ...collectors.map((c) => ({ v: c.id, l: c.name })),
            ]} />
            <SelectTriggerSm value={typeFilter} onChange={setTypeFilter} placeholder="Client type" options={[
              { v: "all", l: "All types" }, { v: "new", l: "New" }, { v: "renew", l: "Renew" },
            ]} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-225">
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Principal</TableHead>
                <TableHead className="text-right">Receivable</TableHead>
                <TableHead className="text-right">Daily</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Collector</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => {
                const c = clientById(l.clientId);
                return (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.storeName}</TableCell>
                    <TableCell className="text-right num">{formatPHP(l.principal)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(l.totalReceivable)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(l.dailyPayment)}</TableCell>
                    <TableCell className="text-right num font-semibold">{formatPHP(l.currentBalance)}</TableCell>
                    <TableCell><StatusBadge status={c.type} /></TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{collectorById(l.collectorId).name}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No accounts match your filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
