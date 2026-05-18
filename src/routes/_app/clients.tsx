import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Eye, Mail, MailCheck } from "lucide-react";
import { PageHeader } from "@/components/finance/PageHeader";
import { StatusBadge } from "@/components/finance/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { clients, collectors, collectorById, loans, clientById } from "@/lib/mock-data";
import { formatPHP, formatDate } from "@/lib/format";
import { toast } from "sonner";

const EMAIL_TEMPLATES = {
  reminder: {
    label: "Payment Reminder",
    subject: (name: string) => `Payment Reminder — BuenaMano`,
    body: (name: string, balance: string, daily: string) =>
      `Dear ${name},\n\nThis is a friendly reminder that your loan account with LendPro has a remaining balance of ${balance}.\n\nYour daily payment of ${daily} is due today. Please coordinate with your assigned collector for your payment.\n\nIf you have any concerns, feel free to reach out to our office.\n\nThank you for your continued trust in LendPro.\n\nLendPro Loan & Collection`,
  },
  statement: {
    label: "Loan Statement",
    subject: (name: string) => `Your Loan Statement — BuenaMano`,
    body: (name: string, balance: string, daily: string) =>
      `Dear ${name},\n\nPlease find below a summary of your current loan account with LendPro:\n\n  Remaining Balance: ${balance}\n  Daily Payment: ${daily}\n\nFor a detailed breakdown of your payment schedule, please coordinate with our office or your assigned collector.\n\nLendPro Loan & Collection`,
  },
  overdue: {
    label: "Overdue Notice",
    subject: (name: string) => `Important: Overdue Account Notice — BuenaMano`,
    body: (name: string, balance: string, daily: string) =>
      `Dear ${name},\n\nOur records show that your loan account is currently overdue with a remaining balance of ${balance}.\n\nWe urge you to settle your outstanding daily payment of ${daily} at your earliest convenience to avoid additional charges.\n\nPlease contact your assigned collector or our office immediately.\n\nLendPro Loan & Collection`,
  },
  custom: {
    label: "Custom Message",
    subject: (_: string) => "",
    body: (_: string, __: string, ___: string) => "",
  },
};

export const Route = createFileRoute("/_app/clients")({
  head: () => ({ meta: [{ title: "Clients — BuenaMano" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [emailClient, setEmailClient] = useState<typeof clients[0] | null>(null);

  const filtered = clients.filter((c) =>
    (type === "all" || c.type === type) &&
    (`${c.name} ${c.storeName} ${c.number}`.toLowerCase().includes(q.toLowerCase()))
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
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary-glow">
                  <Plus className="mr-1.5 h-4 w-4" />Add new client
                </Button>
              </DialogTrigger>
              <AddClientDialog />
            </Dialog>
          </div>
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
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    {c.email && <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</div>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{c.address}</TableCell>
                  <TableCell>{c.storeName}</TableCell>
                  <TableCell className="text-xs">{c.phone}</TableCell>
                  <TableCell><StatusBadge status={c.type} /></TableCell>
                  <TableCell className="text-muted-foreground">{collectorById(c.collectorId).name}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {c.email && (
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-info hover:text-info" onClick={() => setEmailClient(c)}>
                          <Mail className="mr-1 h-3.5 w-3.5" />Email
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/clients/$clientId" params={{ clientId: c.id }}><Eye className="mr-1 h-3.5 w-3.5" />View</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {emailClient && (
        <EmailDialog client={emailClient} onClose={() => setEmailClient(null)} />
      )}
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
        <Field label="Email address (optional)"><Input type="email" placeholder="client@email.com" /></Field>
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

function EmailDialog({ client, onClose }: { client: typeof clients[0]; onClose: () => void }) {
  const activeLoan = loans.find((l) => l.clientId === client.id && l.status !== "paid");
  const [templateKey, setTemplateKey] = useState<keyof typeof EMAIL_TEMPLATES>("reminder");
  const template = EMAIL_TEMPLATES[templateKey];
  const balance = activeLoan ? formatPHP(activeLoan.currentBalance) : "N/A";
  const daily = activeLoan ? formatPHP(activeLoan.dailyPayment) : "N/A";
  const [subject, setSubject] = useState(template.subject(client.name));
  const [body, setBody] = useState(template.body(client.name, balance, daily));

  function handleTemplateChange(key: keyof typeof EMAIL_TEMPLATES) {
    setTemplateKey(key);
    const t = EMAIL_TEMPLATES[key];
    setSubject(t.subject(client.name));
    setBody(t.body(client.name, balance, daily));
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
          <div className="space-y-1.5">
            <Label className="text-xs">Template</Label>
            <Select value={templateKey} onValueChange={(v) => handleTemplateChange(v as keyof typeof EMAIL_TEMPLATES)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EMAIL_TEMPLATES).map(([k, t]) => (
                  <SelectItem key={k} value={k}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} className="text-sm" />
          </div>

          {activeLoan && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Loan <span className="font-mono">{activeLoan.number}</span> — Balance: <span className="font-semibold text-foreground">{balance}</span> — Daily: <span className="font-semibold text-foreground">{daily}</span> — Due: <span className="font-semibold text-foreground">{formatDate(activeLoan.dueDate)}</span>
            </div>
          )}
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

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}><Label className="text-xs">{label}</Label>{children}</div>;
}
