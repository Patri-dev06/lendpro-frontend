import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Download } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collectors, loans, clientById } from "@/lib/mock-data";
import { formatPHP } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/collectors")({
  head: () => ({ meta: [{ title: "Collectors — LendPro" }] }),
  component: CollectorsPage,
});

function downloadSummaryCSV() {
  const today = new Date().toISOString().slice(0, 10);
  const headers = [
    "Collector Name", "Code", "Area", "Assigned", "Expected (₱)", "Actual (₱)", "Rate (%)", "Missed",
    "Overdue", "Past Due",
  ];

  const collectorRows = collectors.flatMap((c) => {
    const rate = Math.round((c.actual / c.expected) * 100);
    const summaryRow = [
      c.name, c.code, c.area, c.assigned, c.expected, c.actual, rate, c.missed, c.overdue, c.pastDue,
    ].join(",");

    const clientHeader = ["", "", "  Client Name", "Loan #", "Daily Due", "Balance", "Due Date", "Status", "", ""].join(",");
    const myLoans = loans.filter((l) => l.collectorId === c.id);
    const clientRows = myLoans.map((l) => {
      const cl = clientById(l.clientId);
      return ["", "", `  ${cl.name}`, l.number, l.dailyPayment, l.currentBalance, l.dueDate, l.status, "", ""].join(",");
    });

    return [summaryRow, clientHeader, ...clientRows, ",,,,,,,,,,"];
  });

  const csv = [headers.join(","), ...collectorRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `collector-summary-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Collector summary downloaded.");
}

function CollectorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Collectors"
        subtitle="Field collection team and performance overview."
        actions={
          <Button variant="outline" onClick={downloadSummaryCSV}>
            <Download className="mr-2 h-4 w-4" />Download Summary
          </Button>
        }
      />
      <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Area</TableHead>
              <TableHead className="text-right">Assigned</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Missed</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collectors.map((c) => {
              const r = Math.round((c.actual / c.expected) * 100);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.code}</TableCell>
                  <TableCell>{c.area}</TableCell>
                  <TableCell className="text-right num">{c.assigned}</TableCell>
                  <TableCell className="text-right num">{formatPHP(c.expected)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(c.actual)}</TableCell>
                  <TableCell className="text-right num font-semibold">{r}%</TableCell>
                  <TableCell className="text-right num">{c.missed}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" asChild><Link to="/collectors/$id" params={{ id: c.id }}><Eye className="mr-1 h-3.5 w-3.5" />View</Link></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
