import { useState } from "react";
import { Sparkles, Printer, FileText, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/Field";
import { SumRow } from "@/components/shared/SumRow";
import { clients, collectors, clientById, collectorById } from "@/lib/mock-data";
import type { LoanType } from "@/lib/mock-data";
import { formatPHP, formatDate, addNonSundayDays } from "@/lib/format";
import { LOAN_TYPE_LABELS, TERM_OPTIONS } from "@/lib/loan-constants";
import { printTILA, printInvoice, printLoanForm } from "@/lib/loan-prints";
import { toast } from "sonner";

export function LoanCreateSection() {
  const [loanType, setLoanType] = useState<LoanType>("new-loan");
  const [client, setClient] = useState(clients[0].id);
  const [principal, setPrincipal] = useState(10000);
  const [interest, setInterest] = useState(1500);
  const [sc, setSc] = useState(500);
  const [termDays, setTermDays] = useState<number>(45);
  const [daily, setDaily] = useState(267);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [collector, setCollector] = useState(collectors[0].id);
  const [remarks, setRemarks] = useState("");

  const totalLoanAmount = principal + interest;
  const totalReceivable = totalLoanAmount + sc;
  const dueDate = date ? addNonSundayDays(date, termDays) : null;

  function handleTermChange(t: number) {
    setTermDays(t);
    if (totalReceivable > 0) setDaily(Math.ceil(totalReceivable / t));
  }

  function handleAmountChange(p: number, i: number, s: number) {
    const tr = p + i + s;
    if (termDays > 0 && tr > 0) setDaily(Math.ceil(tr / termDays));
  }

  const selectedClient = clientById(client);
  const selectedCollector = collectorById(collector);
  const canPrint = principal > 0 && interest > 0 && !!date;

  const printParams = {
    selectedClient, selectedCollector, loanType, date,
    principal, interest, sc, totalLoanAmount, totalReceivable,
    daily, termDays, dueDate, remarks,
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Label className="text-xs shrink-0">Loan type</Label>
            <Select value={loanType} onValueChange={(v) => setLoanType(v as LoanType)}>
              <SelectTrigger className="h-8 w-44 text-sm font-semibold"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(LOAN_TYPE_LABELS) as [LoanType, string][]).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">Auto-computed</span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Select client">
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.storeName}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Assigned collector">
            <Select value={collector} onValueChange={setCollector}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{collectors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Principal loan (₱)">
            <Input type="number" value={principal} onChange={(e) => {
              const v = Number(e.target.value) || 0;
              setPrincipal(v);
              handleAmountChange(v, interest, sc);
            }} />
          </Field>
          <Field label="Interest (₱)">
            <Input type="number" value={interest} onChange={(e) => {
              const v = Number(e.target.value) || 0;
              setInterest(v);
              handleAmountChange(principal, v, sc);
            }} />
          </Field>
          <Field label="Term of loan">
            <Select value={String(termDays)} onValueChange={(v) => handleTermChange(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TERM_OPTIONS.map((t) => <SelectItem key={t} value={String(t)}>{t} days</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Processing fee (₱)">
            <Input type="number" value={sc} onChange={(e) => {
              const v = Number(e.target.value) || 0;
              setSc(v);
              handleAmountChange(principal, interest, v);
            }} />
          </Field>
          <Field label="Loan release date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Due date (computed)">
            <Input value={dueDate ? formatDate(dueDate) : "—"} readOnly className="bg-muted/40 text-muted-foreground" />
          </Field>
          <Field label="Daily payment (₱)">
            <Input type="number" value={daily} onChange={(e) => setDaily(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Remarks (optional)" full>
            <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any internal notes about this loan…" />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button variant="outline" disabled={!canPrint} onClick={() => printTILA(printParams)}>
            <FileText className="mr-1.5 h-4 w-4" />Print TILA
          </Button>
          <Button variant="outline" disabled={!canPrint} onClick={() => printInvoice(printParams)}>
            <ClipboardList className="mr-1.5 h-4 w-4" />Print Invoice
          </Button>
          <Button variant="outline" disabled={!canPrint} onClick={() => printLoanForm(printParams)}>
            <Printer className="mr-1.5 h-4 w-4" />Print Loan Form
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-glow"
            onClick={() => toast.success(`${LOAN_TYPE_LABELS[loanType]} created — ${termDays}-day schedule generated`)}
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Create loan &amp; generate schedule
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-linear-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-md">
        <h3 className="font-display text-base font-semibold">Loan summary</h3>
        <p className="text-xs opacity-75">Live calculation based on inputs</p>
        <dl className="mt-5 space-y-3 text-sm">
          <SumRow label="Principal" value={formatPHP(principal)} />
          <SumRow label="Interest" value={formatPHP(interest)} />
          <div className="my-2 border-t border-primary-foreground/20" />
          <SumRow label="Total loan amount" value={formatPHP(totalLoanAmount)} bold />
          <SumRow label="Processing fee" value={formatPHP(sc)} />
          <div className="my-2 border-t border-primary-foreground/20" />
          <SumRow label="Starting balance" value={formatPHP(totalReceivable)} bold />
          <div className="my-2 border-t border-primary-foreground/20" />
          <SumRow label="Daily payment" value={formatPHP(daily)} />
          <SumRow label="Term of loan" value={`${termDays} days`} />
          <SumRow label="Due date" value={dueDate ? formatDate(dueDate) : "—"} />
        </dl>
        <p className="mt-5 text-[11px] opacity-70">Total Loan Amount = Principal + Interest. Starting Balance = Total Loan Amount + Processing Fee. Sundays not counted in term.</p>
      </div>
    </div>
  );
}
