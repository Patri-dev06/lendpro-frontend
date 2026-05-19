import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users, UserPlus, Repeat, AlertTriangle, AlertOctagon, CheckCircle2,
  Wallet, TrendingUp, ArrowUpRight, Loader2,
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
import { apiRequest } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import { formatPHP } from "@/lib/format";
import { tokenColors, tooltipStyle } from "@/components/dashboard/dashboardConstants";

interface ApiLoan {
  id: number;
  number: string;
  status: string;
  loan_type: string;
  principal: number;
  total_receivable: number;
  daily_payment: number;
  current_balance: number;
  client: { id: number; name: string; store_name: string };
  collector: { id: number; name: string };
}

interface DashboardStats {
  counts: { active: number; new: number; renew: number; overdue: number; past_due: number; paid: number };
  financials: { total_receivable: number; total_outstanding: number; total_collected: number; collection_efficiency: number };
  monthly_releases: Array<{ month: string; releases: string }>;
  monthly_collection: Array<{ month: string; collected: string }>;
  collector_stats: Array<{ id: number; name: string }>;
  loans: ApiLoan[];
}

function shortMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-US", { month: "short" });
}

export function AdminDashboard() {
  const { token } = useRole();
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]  = useState("");
  const [statusFilter, setStatusFilter]    = useState("all");
  const [collectorFilter, setCollectorFilter] = useState("all");
  const [typeFilter, setTypeFilter]        = useState("all");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<DashboardStats>("GET", "dashboard/stats", { token });
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { counts, financials } = stats;

  const monthlyReleases = stats.monthly_releases.map((r) => ({
    month: shortMonth(r.month),
    releases: Number(r.releases),
  }));

  const monthlyCollection = stats.monthly_collection.map((r) => ({
    month: shortMonth(r.month),
    collected: Number(r.collected),
  }));

  const normalActive = counts.active - counts.overdue - counts.past_due;
  const donut = [
    { name: "Active", value: Math.max(0, normalActive), color: tokenColors.primary },
    { name: "Overdue", value: counts.overdue, color: tokenColors.warning },
    { name: "Past Due", value: counts.past_due, color: tokenColors.destructive },
    { name: "Fully Paid", value: counts.paid, color: tokenColors.success },
  ];

  const collectors = Array.from(
    new Map(stats.loans.map((l) => [l.collector.id, l.collector])).values()
  );

  const filtered = stats.loans.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (collectorFilter !== "all" && String(l.collector.id) !== collectorFilter) return false;
    if (typeFilter !== "all" && l.loan_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matches = `${l.client.name} ${l.client.store_name}`.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const releasesThisMonth  = monthlyReleases[monthlyReleases.length - 1]?.releases ?? 0;
  const releasesThisYear   = monthlyReleases.reduce((s, m) => s + m.releases, 0);
  const collectionThisMonth = monthlyCollection[monthlyCollection.length - 1]?.collected ?? 0;
  const collectionThisYear  = monthlyCollection.reduce((s, m) => s + m.collected, 0);

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

      <CollectionEfficiencyBanner
        rate={financials.collection_efficiency}
        collected={financials.total_collected}
        receivable={financials.total_receivable}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Active Borrowers"   value={String(counts.active)}   icon={Users}        hint="across all collectors" />
        <StatCard label="New Loaners"        value={String(counts.new)}      icon={UserPlus}     tone="info" hint="this cycle" />
        <StatCard label="Renew Loaners"      value={String(counts.renew)}    icon={Repeat}       tone="purple" hint="returning clients" />
        <StatCard label="Overdue +3 Days"    value={String(counts.overdue)}  icon={AlertTriangle} tone="warning" hint="needs follow-up" />
        <StatCard label="Past Due +30 Days"  value={String(counts.past_due)} icon={AlertOctagon}  tone="destructive" hint="critical accounts" />
        <StatCard label="Fully Paid"         value={String(counts.paid)}     icon={CheckCircle2} tone="success" hint="all time" />
        <StatCard label="Outstanding" value={formatPHP(financials.total_outstanding, { compact: true })} icon={Wallet} hint="portfolio balance" />
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Financial Summary</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <FinStat label="Releases This Month" value={formatPHP(releasesThisMonth, { compact: true })} icon={ArrowUpRight} tone="info" />
          <FinStat label="Releases This Year"  value={formatPHP(releasesThisYear, { compact: true })}  icon={ArrowUpRight} tone="info" sub="running total" />
          <FinStat label="Collection This Month" value={formatPHP(collectionThisMonth, { compact: true })} icon={TrendingUp} tone="success" />
          <FinStat label="Collection This Year"  value={formatPHP(collectionThisYear, { compact: true })}  icon={TrendingUp} tone="success" sub="running total" />
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
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle()} formatter={(v: number) => formatPHP(v)} />
              <Bar dataKey="releases" fill={tokenColors.primary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly collections" subtitle="Total collected per month">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyCollection}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle()} formatter={(v: number) => formatPHP(v)} />
              <Line type="monotone" dataKey="collected" stroke={tokenColors.success} strokeWidth={2.5} dot={{ r: 3, fill: tokenColors.success }} activeDot={{ r: 5 }} />
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
              { v: "all", l: "All collectors" }, ...collectors.map((c) => ({ v: String(c.id), l: c.name })),
            ]} />
            <SelectTriggerSm value={typeFilter} onChange={setTypeFilter} placeholder="Loan type" options={[
              { v: "all", l: "All types" }, { v: "new-loan", l: "New Loan" }, { v: "reloan", l: "Reloan" }, { v: "reconstruct", l: "Reconstruct" },
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
                <TableHead>Status</TableHead>
                <TableHead>Collector</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{l.client.store_name}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.principal)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.total_receivable)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(l.daily_payment)}</TableCell>
                  <TableCell className="text-right num font-semibold">{formatPHP(l.current_balance)}</TableCell>
                  <TableCell><StatusBadge status={l.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{l.collector.name}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No accounts match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
