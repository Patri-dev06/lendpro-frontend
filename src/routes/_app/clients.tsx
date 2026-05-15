import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Eye } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { clients, collectors, collectorById } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/clients")({
  head: () => ({ meta: [{ title: "Clients — LendPro" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const filtered = clients.filter((c) =>
    (type === "all" || c.type === type) &&
    (`${c.name} ${c.storeName} ${c.number}`.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Manage borrower profiles, contact details, and collector assignments."
        actions={
          <Dialog>
            <DialogTrigger asChild><Button className="bg-primary text-primary-foreground hover:bg-primary-glow"><Plus className="mr-1.5 h-4 w-4" />Add new client</Button></DialogTrigger>
            <AddClientDialog />
          </Dialog>
        }
      />
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <div className="relative flex-1 min-w-60">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, store, or client number…" className="h-9 pl-8" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="new">New Loaner</SelectItem>
              <SelectItem value="renew">Renew Loaner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.number}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{c.address}</TableCell>
                  <TableCell>{c.storeName}</TableCell>
                  <TableCell className="text-xs">{c.phone}</TableCell>
                  <TableCell><StatusBadge status={c.type} /></TableCell>
                  <TableCell className="text-muted-foreground">{collectorById(c.collectorId).name}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/clients/$clientId" params={{ clientId: c.id }}><Eye className="mr-1 h-3.5 w-3.5" />View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function AddClientDialog() {
  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>Add new client</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Client name"><Input placeholder="Juan Dela Cruz" /></Field>
        <Field label="Cellphone number"><Input placeholder="+63 917 000 0000" /></Field>
        <Field label="Store name"><Input placeholder="Juan Sari-Sari Store" /></Field>
        <Field label="Address" full><Input placeholder="Street, Barangay, City" /></Field>
        <Field label="Client type">
          <Select defaultValue="new">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Loaner</SelectItem>
              <SelectItem value="renew">Renew Loaner</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Assigned collector">
          <Select defaultValue={collectors[0].id}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{collectors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button className="bg-primary text-primary-foreground hover:bg-primary-glow" onClick={() => toast.success("Client saved")}>Save client</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
