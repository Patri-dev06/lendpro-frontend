import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Eye, Mail, MailCheck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/api";
import { useRole } from "@/lib/role-context";
import { formatPHP } from "@/lib/format";
import { toast } from "sonner";

/* ---------- Types ---------- */
interface Collector { id: number; name: string; code: string; area: string; }
interface Client {
  id: number; number: string; name: string; store_name: string;
  address: string; phone: string; email: string | null;
  type: string; status: string; collector_id: number;
  collector?: Collector;
}

/* ---------- Email templates ---------- */
const EMAIL_TEMPLATES = {
  reminder: {
    label: "Payment Reminder",
    subject: () => "Payment Reminder — BuenaMano",
    body: (name: string) =>
      `Dear ${name},\n\nThis is a friendly reminder that your loan account with BuenaMano has an outstanding balance.\n\nYour daily payment is due today. Please coordinate with your assigned collector.\n\nThank you for your continued trust in BuenaMano.\n\nBuenaMano Loan & Collection`,
  },
  statement: {
    label: "Loan Statement",
    subject: () => "Your Loan Statement — BuenaMano",
    body: (name: string) =>
      `Dear ${name},\n\nPlease find below a summary of your current loan account with BuenaMano.\n\nFor a detailed breakdown, please coordinate with our office or your assigned collector.\n\nBuenaMano Loan & Collection`,
  },
  overdue: {
    label: "Overdue Notice",
    subject: () => "Important: Overdue Account Notice — BuenaMano",
    body: (name: string) =>
      `Dear ${name},\n\nOur records show that your loan account is currently overdue.\n\nWe urge you to settle your outstanding balance at your earliest convenience to avoid additional charges.\n\nPlease contact your assigned collector or our office immediately.\n\nBuenaMano Loan & Collection`,
  },
  custom: { label: "Custom Message", subject: () => "", body: () => "" },
};

/* ---------- Route ---------- */
export const Route = createFileRoute("/_app/clients")({
  head: () => ({ meta: [{ title: "Clients — BuenaMano" }] }),
  component: ClientsPage,
});

/* ---------- Page ---------- */
function ClientsPage() {
  const { token } = useRole();
  const [clients, setClients] = useState<Client[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [emailClient, setEmailClient] = useState<Client | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [cls, cols] = await Promise.all([
        apiRequest<Client[]>("GET", "clients", { token: token ?? undefined }),
        apiRequest<Collector[]>("GET", "collectors", { token: token ?? undefined }),
      ]);
      setClients(cls);
      setCollectors(cols);
    } catch {
      toast.error("Failed to load clients.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = clients.filter((c) =>
    (type === "all" || c.type === type) &&
    (`${c.name} ${c.store_name} ${c.number}`.toLowerCase().includes(q.toLowerCase()))
  );

  const emailCount = clients.filter((c) => c.email).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Manage borrower profiles, contact details, and collector assignments."
        actions={
          <div className="flex items-center gap-2">
            {emailCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-info/30 bg-info/10 px-3 py-1 text-xs font-medium text-info">
                <MailCheck className="h-3.5 w-3.5" />{emailCount} with email
              </span>
            )}
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-glow"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />Add new client
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          <div className="relative flex-1 min-w-60">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, store, or client number…" className="h-9 pl-8" />
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
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />Loading clients…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {q || type !== "all" ? "No clients match your search." : "No clients yet. Add your first client."}
            </div>
          ) : (
            <Table className="min-w-225">
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
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      {c.email && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />{c.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-45 truncate">{c.address}</TableCell>
                    <TableCell>{c.store_name}</TableCell>
                    <TableCell className="text-xs">{c.phone}</TableCell>
                    <TableCell><StatusBadge status={c.type} /></TableCell>
                    <TableCell className="text-muted-foreground">{c.collector?.name ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.email && (
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-info hover:text-info"
                            onClick={() => setEmailClient(c)}>
                            <Mail className="mr-1 h-3.5 w-3.5" />Email
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/clients/$clientId" params={{ clientId: String(c.id) }}>
                            <Eye className="mr-1 h-3.5 w-3.5" />View
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add client dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <AddClientDialog
          collectors={collectors}
          token={token ?? undefined}
          onSaved={() => { setAddOpen(false); fetchData(); }}
          onCancel={() => setAddOpen(false)}
        />
      </Dialog>

      {/* Email dialog */}
      {emailClient && (
        <EmailDialog client={emailClient} onClose={() => setEmailClient(null)} />
      )}
    </div>
  );
}

/* ---------- Add Client Dialog ---------- */
interface AddClientDialogProps {
  collectors: Collector[];
  token?: string;
  onSaved: () => void;
  onCancel: () => void;
}

function AddClientDialog({ collectors, token, onSaved, onCancel }: AddClientDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("new");
  const [collectorId, setCollectorId] = useState(collectors[0]?.id?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim())       e.name        = "Client name is required.";
    if (!phone.trim())      e.phone       = "Cellphone number is required.";
    if (!storeName.trim())  e.storeName   = "Store name is required.";
    if (!address.trim())    e.address     = "Address is required.";
    if (!collectorId)       e.collectorId = "Please assign a collector.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                            e.email       = "Invalid email address.";
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);
    try {
      await apiRequest("POST", "clients", {
        token,
        body: {
          name:         name.trim(),
          phone:        phone.trim(),
          store_name:   storeName.trim(),
          email:        email.trim() || null,
          address:      address.trim(),
          type,
          collector_id: Number(collectorId),
        },
      });
      toast.success("Client saved!", { description: `${name.trim()} has been added successfully.` });
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save client.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>Add new client</DialogTitle></DialogHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Client name" error={errors.name}>
          <Input value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
            placeholder="Juan Dela Cruz" disabled={loading} className={errors.name ? "border-destructive" : ""} />
        </Field>
        <Field label="Cellphone number" error={errors.phone}>
          <Input value={phone} onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: "" })); }}
            placeholder="+63 917 000 0000" disabled={loading} className={errors.phone ? "border-destructive" : ""} />
        </Field>
        <Field label="Store name" error={errors.storeName}>
          <Input value={storeName} onChange={(e) => { setStoreName(e.target.value); setErrors((p) => ({ ...p, storeName: "" })); }}
            placeholder="Juan Sari-Sari Store" disabled={loading} className={errors.storeName ? "border-destructive" : ""} />
        </Field>
        <Field label="Email address (optional)" error={errors.email}>
          <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
            placeholder="client@email.com" disabled={loading} className={errors.email ? "border-destructive" : ""} />
        </Field>
        <Field label="Address" full error={errors.address}>
          <Input value={address} onChange={(e) => { setAddress(e.target.value); setErrors((p) => ({ ...p, address: "" })); }}
            placeholder="Street, Barangay, City" disabled={loading} className={errors.address ? "border-destructive" : ""} />
        </Field>
        <Field label="Client type">
          <Select value={type} onValueChange={setType} disabled={loading}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Loaner</SelectItem>
              <SelectItem value="renew">Renew Loaner</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Assigned collector" error={errors.collectorId}>
          <Select value={collectorId} onValueChange={(v) => { setCollectorId(v); setErrors((p) => ({ ...p, collectorId: "" })); }} disabled={loading}>
            <SelectTrigger className={errors.collectorId ? "border-destructive" : ""}><SelectValue placeholder="Select collector" /></SelectTrigger>
            <SelectContent>
              {collectors.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button className="bg-primary text-primary-foreground hover:bg-primary-glow" onClick={handleSave} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save client"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ---------- Email Dialog ---------- */
function EmailDialog({ client, onClose }: { client: Client; onClose: () => void }) {
  const [templateKey, setTemplateKey] = useState<keyof typeof EMAIL_TEMPLATES>("reminder");
  const template = EMAIL_TEMPLATES[templateKey];
  const [subject, setSubject] = useState(template.subject());
  const [body, setBody] = useState(template.body(client.name));

  function handleTemplateChange(key: keyof typeof EMAIL_TEMPLATES) {
    setTemplateKey(key);
    setSubject(EMAIL_TEMPLATES[key].subject());
    setBody(EMAIL_TEMPLATES[key].body(client.name));
  }

  function handleSend() {
    toast.success(`Email sent to ${client.email}`);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-info" />Email — {client.name}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">To: {client.email}</p>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Template">
            <Select value={templateKey} onValueChange={(v) => handleTemplateChange(v as keyof typeof EMAIL_TEMPLATES)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EMAIL_TEMPLATES).map(([k, t]) => (
                  <SelectItem key={k} value={k}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Message">
            <Textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} className="text-sm" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-info text-white hover:bg-info/90" onClick={handleSend}>
            <Mail className="mr-1.5 h-4 w-4" />Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Field ---------- */
function Field({ label, full, error, children }: { label: string; full?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
