import { createFileRoute } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auditLogs } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/audit")({
  head: () => ({ meta: [{ title: "Audit Logs — BuenaMano" }] }),
  component: AuditPage,
});

function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit logs" subtitle="Trace every meaningful change made inside the system." />
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <Input type="date" className="h-9 w-44" />
          <Input placeholder="User" className="h-9 w-40" />
          <Select defaultValue="all"><SelectTrigger className="h-9 w-44"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="CREATE_LOAN">Create loan</SelectItem>
              <SelectItem value="RECORD_PAYMENT">Record payment</SelectItem>
              <SelectItem value="UPDATE_CLIENT">Update client</SelectItem>
              <SelectItem value="EXPORT_REPORT">Export report</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all"><SelectTrigger className="h-9 w-40"><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              <SelectItem value="loans">Loans</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
              <SelectItem value="clients">Clients</SelectItem>
              <SelectItem value="reports">Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Affected record</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs text-muted-foreground">{a.ts}</TableCell>
                  <TableCell className="font-medium">{a.user}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.role}</TableCell>
                  <TableCell><span className="font-mono text-xs">{a.action}</span></TableCell>
                  <TableCell className="font-mono text-xs">{a.record}</TableCell>
                  <TableCell className="text-sm">{a.description}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost"><Eye className="mr-1 h-3.5 w-3.5" />View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
