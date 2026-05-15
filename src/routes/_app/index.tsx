import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users, UserPlus, Repeat, AlertTriangle, AlertOctagon, CheckCircle2, Wallet,
  TrendingUp, Banknote, Target, Activity, Phone, MapPin,
} from "lucide-react";
import { useRole } from "@/lib/role-context";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatCard } from "@/components/finance/StatCard";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line, Legend,
} from "recharts";
import {
  clients, loans, collectors, collectorById, clientById, monthlyReleases,
  outstandingTrend, expectedVsActual, monthlyCollection,
} from "@/lib/mock-data";
import { formatPHP } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Dashboard — LendPro" }] }),
  component: DashboardSwitch,
});

function DashboardSwitch() {
  const { role } = useRole();
  if (role === "collector") return <CollectorDashboard />;
  if (role === "manager" || role === "sysadmin") return <ManagerDashboard />;
  if (role === "accounting_clerk") return <AdminDashboard />;
  return <AdminDashboard />;
}

const tokenColors = {
  primary: "var(--primary-glow)",
  success: "var(--success)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
  purple: "var(--purple)",
  info: "var(--info)",
  muted: "var(--muted-foreground)",
};

function tooltipStyle() {
  return {
    contentStyle: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      fontSize: 12,
      boxShadow: "0 6px 20px -8px rgb(0 0 0 / 0.15)",
    },
    labelStyle: { color: "var(--foreground)", fontWeight: 600 },
  };
}

/* ----------------- ADMIN DASHBOARD ----------------- */
function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [collectorFilter, setCollectorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const totalOutstanding = loans.reduce((s, l) => s + l.currentBalance, 0);
  const totalReceivable = loans.reduce((s, l) => s + l.totalReceivable, 0);
  const totalCollected = totalReceivable - totalOutstanding;
  const collectionEfficiency = Math.round((totalCollected / totalReceivable) * 100);

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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Active Borrowers" value={String(counts.active)} icon={Users} hint="across all collectors" trend={4} />
        <StatCard label="New Loaners" value={String(counts.newL)} icon={UserPlus} tone="info" hint="this cycle" trend={12} />
        <StatCard label="Renew Loaners" value={String(counts.renew)} icon={Repeat} tone="purple" hint="returning clients" trend={6} />
        <StatCard label="Overdue +3 Days" value={String(counts.overdue)} icon={AlertTriangle} tone="warning" hint="needs follow-up" trend={-2} />
        <StatCard label="Past Due +30 Days" value={String(counts.pastDue)} icon={AlertOctagon} tone="destructive" hint="critical accounts" trend={1} />
        <StatCard label="Fully Paid" value={String(counts.paid)} icon={CheckCircle2} tone="success" hint="this month" trend={9} />
        <StatCard label="Outstanding" value={formatPHP(totalOutstanding, { compact: true })} icon={Wallet} hint="portfolio balance" trend={3} />
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
          <Table>
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

/* ----------------- COLLECTOR DASHBOARD ----------------- */
function CollectorDashboard() {
  const me = collectors[0]; // Mark Rivera
  const myClients = clients.filter((c) => c.collectorId === me.id);
  const myLoans = loans.filter((l) => l.collectorId === me.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi ${me.name.split(" ")[0]} — Today's collection plan`}
        subtitle={`${me.area} route · ${myClients.length} assigned borrowers`}
        actions={<Button className="bg-primary text-primary-foreground hover:bg-primary-glow">Start route</Button>}
      />
      <CollectionEfficiencyBanner rate={Math.round((me.actual / me.expected) * 100)} collected={me.actual} receivable={me.expected} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Assigned Borrowers" value={String(me.assigned)} icon={Users} />
        <StatCard label="Expected Today" value={formatPHP(me.expected, { compact: true })} icon={Target} tone="info" />
        <StatCard label="Actual Today" value={formatPHP(me.actual, { compact: true })} icon={Wallet} tone="success" trend={-9} />
        <StatCard label="Shortfall" value={formatPHP(me.expected - me.actual, { compact: true })} icon={Activity} tone="warning" />
        <StatCard label="Missed Today" value={String(me.missed)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Overdue Accts" value={String(me.overdue)} icon={AlertOctagon} tone="destructive" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
            <div>
              <h3 className="font-display text-base font-semibold">Daily collection worklist</h3>
              <p className="text-xs text-muted-foreground">Tap a row to record today's payment</p>
            </div>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="due">Due Today</TabsTrigger>
                <TabsTrigger value="paid">Paid Today</TabsTrigger>
                <TabsTrigger value="missed">Missed</TabsTrigger>
                <TabsTrigger value="overdue">Overdue +3</TabsTrigger>
                <TabsTrigger value="pastdue">Past Due +30</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Daily Due</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myClients.map((c) => {
                  const l = myLoans.find((x) => x.clientId === c.id)!;
                  const rowTone = l.status === "past-due" ? "border-l-4 border-l-destructive"
                    : l.status === "overdue" ? "border-l-4 border-l-warning" : "";
                  return (
                    <TableRow key={c.id} className={rowTone}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.storeName}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{c.address}</TableCell>
                      <TableCell className="text-xs text-muted-foreground"><Phone className="mr-1 inline h-3 w-3" />{c.phone}</TableCell>
                      <TableCell className="text-right num">{formatPHP(l.dailyPayment)}</TableCell>
                      <TableCell className="text-right num font-semibold">{formatPHP(l.currentBalance)}</TableCell>
                      <TableCell><StatusBadge status={l.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => toast.success(`Recorded ${formatPHP(l.dailyPayment)} for ${c.name}`)}>Record</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-display text-sm font-semibold">Today's route</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Quezon City corridor</p>
            <div className="mt-4 space-y-3">
              <RouteStat label="Clients to visit" value={myClients.length} />
              <RouteStat label="Completed visits" value={3} accent="success" />
              <RouteStat label="Remaining" value={myClients.length - 3} accent="warning" />
            </div>
            <Button className="mt-5 w-full bg-primary text-primary-foreground hover:bg-primary-glow">Open route map</Button>
          </div>
          <div className="rounded-2xl border bg-linear-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-sm">
            <p className="text-xs uppercase tracking-wider opacity-80">Collection Efficiency</p>
            <p className="mt-1 font-display text-3xl font-semibold num">{Math.round((me.actual / me.expected) * 100)}%</p>
            <div className="mt-3 h-2 rounded-full bg-primary-foreground/20">
              <div className="h-2 rounded-full bg-primary-foreground" style={{ width: `${Math.round((me.actual / me.expected) * 100)}%` }} />
            </div>
            <p className="mt-3 text-xs opacity-80">{formatPHP(me.actual)} of {formatPHP(me.expected)} collected</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteStat({ label, value, accent }: { label: string; value: number; accent?: "success" | "warning" }) {
  const tone = accent === "success" ? "text-success" : accent === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-display text-lg font-semibold num ${tone}`}>{value}</span>
    </div>
  );
}

/* ----------------- MANAGER DASHBOARD ----------------- */
function ManagerDashboard() {
  const totalReceivable = loans.reduce((s, l) => s + l.totalReceivable, 0);
  const totalCollected = totalReceivable - loans.reduce((s, l) => s + l.currentBalance, 0);
  const totalOutstanding = loans.reduce((s, l) => s + l.currentBalance, 0);
  const collectionEfficiency = Math.round((totalCollected / totalReceivable) * 100);
  const overdue = loans.filter((l) => l.status === "overdue").length;
  const pastDue = loans.filter((l) => l.status === "past-due").length;

  const donut = [
    { name: "Active", value: loans.filter((l) => l.status === "new" || l.status === "renew").length, color: tokenColors.primary },
    { name: "Overdue", value: overdue, color: tokenColors.warning },
    { name: "Past Due", value: pastDue, color: tokenColors.destructive },
    { name: "Fully Paid", value: loans.filter((l) => l.status === "paid").length, color: tokenColors.success },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Executive Dashboard" subtitle="Portfolio performance and collection effectiveness" />

      <CollectionEfficiencyBanner rate={collectionEfficiency} collected={totalCollected} receivable={totalReceivable} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Active Loans" value={String(loans.filter((l) => l.status !== "paid").length)} icon={Banknote} />
        <StatCard label="Total Receivable" value={formatPHP(totalReceivable, { compact: true })} icon={TrendingUp} tone="info" />
        <StatCard label="Total Collected" value={formatPHP(totalCollected, { compact: true })} icon={Wallet} tone="success" trend={8} />
        <StatCard label="Outstanding" value={formatPHP(totalOutstanding, { compact: true })} icon={Activity} />
        <StatCard label="Collection Efficiency" value={`${collectionEfficiency}%`} icon={Target} tone="success" trend={3} />
        <StatCard label="Overdue Accts" value={String(overdue)} icon={AlertTriangle} tone="warning" />
        <StatCard label="Past Due Accts" value={String(pastDue)} icon={AlertOctagon} tone="destructive" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Expected vs Actual Collection" subtitle="Past 6 days">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={expectedVsActual}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₱${v / 1000}k`} />
              <Tooltip {...tooltipStyle()} formatter={(v: number) => formatPHP(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="expected" fill={tokenColors.primary} radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual" fill={tokenColors.success} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly collection performance" subtitle="Total collected per month">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyCollection}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₱${v / 1000000}M`} />
              <Tooltip {...tooltipStyle()} formatter={(v: number) => formatPHP(v)} />
              <Line type="monotone" dataKey="collected" stroke={tokenColors.primary} strokeWidth={2.5} dot={{ r: 3, fill: tokenColors.primary }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Loan status distribution" subtitle="Across the portfolio">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={donut} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {donut.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Collector performance" subtitle="Actual vs expected (₱)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart layout="vertical" data={collectors}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `₱${v / 1000}k`} />
              <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={90} />
              <Tooltip {...tooltipStyle()} formatter={(v: number) => formatPHP(v)} />
              <Bar dataKey="expected" fill={tokenColors.muted} radius={[0, 6, 6, 0]} />
              <Bar dataKey="actual" fill={tokenColors.primary} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="font-display text-base font-semibold">Collector performance</h3>
            <p className="text-xs text-muted-foreground">Top performers highlighted</p>
          </div>
          <Button variant="outline" size="sm" asChild><Link to="/collectors">View all</Link></Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collector</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Collection Efficiency</TableHead>
                <TableHead className="text-right">Missed</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
                <TableHead className="text-right">Past Due</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collectors.map((c) => {
                const r = Math.round((c.actual / c.expected) * 100);
                const top = r >= 95;
                const low = r < 88;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        {top && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">Top</span>}
                        {low && <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">Low</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{c.area}</div>
                    </TableCell>
                    <TableCell className="text-right num">{c.assigned}</TableCell>
                    <TableCell className="text-right num">{formatPHP(c.expected)}</TableCell>
                    <TableCell className="text-right num">{formatPHP(c.actual)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`num font-semibold ${top ? "text-success" : low ? "text-warning" : ""}`}>{r}%</span>
                    </TableCell>
                    <TableCell className="text-right num">{c.missed}</TableCell>
                    <TableCell className="text-right num">{c.overdue}</TableCell>
                    <TableCell className="text-right num">{c.pastDue}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" asChild><Link to="/collectors/$id" params={{ id: c.id }}>View</Link></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RiskCard title="Increasing unpaid days" tone="warning" items={["Roberto Reyes — 5 days", "Carlos Mercado — 4 days", "Pedro Gonzales — 32 days"]} />
        <RiskCard title="Highest outstanding" tone="info" items={["Miguel Tan — ₱18,900", "Roberto Reyes — ₱14,700", "Maria Santos — ₱12,500"]} />
        <RiskCard title="Past due loans" tone="destructive" items={["Pedro Gonzales — ₱9,000", "Loan LN-2025-0005", "32 days overdue"]} />
        <RiskCard title="Low collection rate" tone="warning" items={["John Ramos — 86%", "Pasig area", "8 overdue accts"]} />
      </div>
    </div>
  );
}

function RiskCard({ title, items, tone }: { title: string; items: string[]; tone: "warning" | "destructive" | "info" }) {
  const toneRing = tone === "destructive" ? "border-destructive/30 bg-destructive/5" : tone === "warning" ? "border-warning/30 bg-warning/5" : "border-info/30 bg-info/5";
  return (
    <div className={`rounded-2xl border ${toneRing} p-5`}>
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {items.map((i) => <li key={i} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />{i}</li>)}
      </ul>
    </div>
  );
}

/* ----------------- shared ----------------- */
function CollectionEfficiencyBanner({ rate, collected, receivable }: { rate: number; collected: number; receivable: number }) {
  const tone = rate >= 90 ? "var(--success)" : rate >= 75 ? "var(--warning)" : "var(--destructive)";
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Collection Efficiency</p>
          <p className="mt-1 font-display text-5xl font-bold num" style={{ color: tone }}>{rate}%</p>
          <p className="mt-1 text-sm text-muted-foreground">{formatPHP(collected)} collected out of {formatPHP(receivable)} total receivable</p>
        </div>
        <div className="w-full flex-1 md:max-w-sm">
          <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-4 rounded-full transition-all duration-500" style={{ width: `${Math.min(rate, 100)}%`, background: tone }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="font-semibold" style={{ color: tone }}>{rate}% efficiency</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function SelectTriggerSm({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { v: string; l: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-40"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
    </Select>
  );
}
