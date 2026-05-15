import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { collectors } from "@/lib/mock-data";
import { formatPHP } from "@/lib/format";

export const Route = createFileRoute("/_app/collectors")({
  head: () => ({ meta: [{ title: "Collectors — LendPro" }] }),
  component: CollectorsPage,
});

function CollectorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Collectors" subtitle="Field collection team and performance overview." />
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
