import { Link } from "@tanstack/react-router";
import { Banknote, TrendingUp, Wallet, Activity, Target, AlertTriangle, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { StatCard } from "@/components/finance/StatCard";
import { PageHeader } from "@/components/finance/PageHeader";
import { CollectionEfficiencyBanner } from "@/components/dashboard/CollectionEfficiencyBanner";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { RiskCard } from "@/components/dashboard/RiskCard";
import { loans, collectors, monthlyCollection, expectedVsActual } from "@/lib/mock-data";
import { formatPHP } from "@/lib/format";
import { tokenColors, tooltipStyle } from "@/components/dashboard/dashboardConstants";

export function ManagerDashboard() {
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
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
          <Table className="min-w-225">
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
