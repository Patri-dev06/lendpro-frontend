import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Download, Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import { formatPHP } from "@/lib/format";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/shared/AccessRestricted";

interface Collector {
  id: number;
  name: string;
  code: string;
  area: string;
  assigned: number;
  expected: number;
  actual: number;
  missed: number;
  overdue: number;
  past_due: number;
}

export const Route = createFileRoute("/_app/collectors/")({
  head: () => ({ meta: [{ title: "Collectors — BuenaMano" }] }),
  component: CollectorsPage,
});

function CollectorsPage() {
  const { token } = useRole();
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading]       = useState(true);
  const [q, setQ]                   = useState("");
  const [addOpen, setAddOpen]       = useState(false);
  const [editTarget, setEditTarget] = useState<Collector | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collector | null>(null);

  const fetchCollectors = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<Collector[]>("GET", "collectors", { token });
      setCollectors(data);
    } catch {
      toast.error("Failed to load collectors.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCollectors(); }, [fetchCollectors]);

  function downloadCSV() {
    const today = new Date().toISOString().slice(0, 10);
    const headers = ["Collector Name", "Code", "Area", "Assigned", "Expected (₱)", "Actual (₱)", "Rate (%)", "Missed"];
    const rows = collectors.map((c) => {
      const rate = c.expected > 0 ? Math.round((c.actual / c.expected) * 100) : 0;
      return [c.name, c.code, c.area, c.assigned, c.expected, c.actual, rate, c.missed].join(",");
    });
    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: `collector-summary-${today}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Collector summary downloaded.");
  }

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    try {
      await apiRequest("DELETE", `collectors/${deleteTarget.id}`, { token });
      setCollectors((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} removed.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete collector.");
    } finally {
      setDeleteTarget(null);
    }
  }

  const filtered = collectors.filter((c) =>
    !q || c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.code.toLowerCase().includes(q.toLowerCase()) ||
    c.area.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <PermissionGuard permission="collectors:read">
    <div className="space-y-6">
      <PageHeader
        title="Collectors"
        subtitle="Field collection team and performance overview."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadCSV} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />Download Summary
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary-glow" onClick={() => setAddOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />Add collector
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-8 h-9 text-sm" placeholder="Search collectors…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto">
        <Table className="min-w-200">
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <tr><td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">Loading collectors…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                {collectors.length === 0 ? "No collectors yet." : "No results match your search."}
              </td></tr>
            ) : filtered.map((c) => {
              const rate = c.expected > 0 ? Math.round((c.actual / c.expected) * 100) : 0;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/collectors/$id"
                      params={{ id: String(c.id) }}
                      className="hover:text-primary hover:underline underline-offset-4 transition-colors"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{c.code}</TableCell>
                  <TableCell>{c.area}</TableCell>
                  <TableCell className="text-right num">{c.assigned}</TableCell>
                  <TableCell className="text-right num">{formatPHP(c.expected)}</TableCell>
                  <TableCell className="text-right num">{formatPHP(c.actual)}</TableCell>
                  <TableCell className={`text-right num font-semibold ${rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-amber-600" : "text-destructive"}`}>
                    {rate}%
                  </TableCell>
                  <TableCell className="text-right num">{c.missed}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditTarget(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(c)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add dialog */}
      <CollectorFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        token={token}
        onSaved={(c) => { setCollectors((prev) => [...prev, c]); setAddOpen(false); }}
      />

      {/* Edit dialog */}
      <CollectorFormDialog
        open={!!editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
        token={token}
        collector={editTarget ?? undefined}
        onSaved={(c) => { setCollectors((prev) => prev.map((x) => x.id === c.id ? c : x)); setEditTarget(null); }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove collector?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong> from the system. Their assigned clients will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </PermissionGuard>
  );
}

/* ---------- Form dialog (add / edit) ---------- */
interface FormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  token: string | null;
  collector?: Collector;
  onSaved: (c: Collector) => void;
}

function CollectorFormDialog({ open, onOpenChange, token, collector, onSaved }: FormDialogProps) {
  const editing = !!collector;
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(collector?.name ?? "");
      setCode(collector?.code ?? "");
      setArea(collector?.area ?? "");
      setErrors({});
    }
  }, [open, collector]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!code.trim()) e.code = "Code is required.";
    if (!area.trim()) e.area = "Area is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate() || !token) return;
    setSaving(true);
    try {
      const body = { name: name.trim(), code: code.trim().toUpperCase(), area: area.trim() };
      const saved = editing
        ? await apiRequest<Collector>("PATCH", `collectors/${collector!.id}`, { token, body })
        : await apiRequest<Collector>("POST", "collectors", { token, body });
      toast.success(editing ? "Collector updated." : "Collector added.");
      onSaved(saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit collector" : "Add collector"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <FormField label="Full name" error={errors.name}>
            <Input value={name} onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: "" })); }} placeholder="Maria Santos" />
          </FormField>
          <FormField label="Collector code" error={errors.code}>
            <Input value={code} onChange={(e) => { setCode(e.target.value); setErrors((x) => ({ ...x, code: "" })); }} placeholder="COL-01" className="uppercase" />
          </FormField>
          <FormField label="Area / Route" error={errors.area}>
            <Input value={area} onChange={(e) => { setArea(e.target.value); setErrors((x) => ({ ...x, area: "" })); }} placeholder="Poblacion Zone 1" />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary-glow" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Add collector"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
