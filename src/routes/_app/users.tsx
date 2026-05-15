import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { systemUsers } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/users")({
  head: () => ({ meta: [{ title: "User Management — LendPro" }] }),
  component: UsersPage,
});

function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="User management" subtitle="Manage system users, roles, and access status." actions={
        <Dialog>
          <DialogTrigger asChild><Button className="bg-primary text-primary-foreground hover:bg-primary-glow"><Plus className="mr-1.5 h-4 w-4" />Add user</Button></DialogTrigger>
          <AddUserDialog />
        </Dialog>
      } />
      <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell><span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{u.role}</span></TableCell>
                <TableCell><StatusBadge status={u.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.lastLogin}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AddUserDialog() {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>Add new user</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <Field label="Full name"><Input placeholder="Juan Dela Cruz" /></Field>
        <Field label="Email / Username"><Input placeholder="user@lendpro.ph" /></Field>
        <Field label="Password"><Input type="password" placeholder="••••••••" /></Field>
        <Field label="Role">
          <Select defaultValue="Collector">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Administrator / Encoder">Administrator / Encoder</SelectItem>
              <SelectItem value="Collector">Collector</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="System Administrator">System Administrator</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select defaultValue="Active"><SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
          </Select>
        </Field>
      </div>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button className="bg-primary text-primary-foreground hover:bg-primary-glow" onClick={() => toast.success("User created")}>Create user</Button>
      </DialogFooter>
    </DialogContent>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
