import { Users, Target, Wallet, Activity, AlertTriangle, AlertOctagon, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/finance/StatCard";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { PageHeader } from "@/components/finance/PageHeader";
import { CollectionEfficiencyBanner } from "@/components/dashboard/CollectionEfficiencyBanner";
import { RouteStat } from "@/components/dashboard/RouteStat";
import { clients, loans, collectors } from "@/lib/mock-data";
import { formatPHP } from "@/lib/format";
import { toast } from "sonner";

export function CollectorDashboard() {
  const me = collectors[0];
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
