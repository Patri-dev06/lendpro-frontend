import { useState, useEffect, useCallback } from "react";
import { Sparkles, Printer, FileText, ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/Field";
import { SumRow } from "@/components/shared/SumRow";
import { SearchableCombobox } from "@/components/shared/SearchableCombobox";
import { DateInput } from "@/components/shared/DateInput";
import { formatPHP, formatDate, addNonSundayDays } from "@/lib/format";
import { LOAN_TYPE_LABELS, type LoanType } from "@/lib/loan-constants";
import { printTILA, printInvoice, printLoanForm } from "@/lib/loan-prints";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

interface ApiClient {
  id: number;
  name: string;
  store_name: string;
  address: string;
  phone: string;
  email: string | null;
  type: string;
  status: string;
}

interface ApiCollector {
  id: number;
  name: string;
  code: string;
  area: string;
}

export interface ApiLoan {
  id: number;
  number: string;
  client_id: number;
  collector_id: number;
  loan_type: string;
  principal: number;
  interest: number;
  service_charge: number;
  total_receivable: number;
  daily_payment: number;
  term_days: number;
  current_balance: number;
  release_date: string;
  due_date: string;
  expected_end_date: string;
  status: string;
  remarks: string | null;
  client: ApiClient;
  collector: ApiCollector;
}

interface Props {
  token: string | null;
  onLoanCreated: (loan: ApiLoan) => void;
}

interface ApiSetting { key: string; value: string | null; }

export function LoanCreateSection({ token, onLoanCreated }: Props) {
  const [clients, setClients]     = useState<ApiClient[]>([]);
  const [collectors, setCollectors] = useState<ApiCollector[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Settings-driven defaults
  const [defaultInterestRate, setDefaultInterestRate] = useState(0);
  const [termOptions, setTermOptions] = useState<number[]>([30, 45, 60]);

  const [loanType, setLoanType]   = useState<LoanType>("new-loan");
  const [clientId, setClientId]   = useState<number | null>(null);
  const [collectorId, setCollectorId] = useState<number | null>(null);
  const [principal, setPrincipal] = useState(10000);
  const [interest, setInterest]   = useState(0);
  const [sc, setSc]               = useState(0);
  const [termDays, setTermDays]   = useState<number>(45);
  const [daily, setDaily]         = useState(0);
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [clientSearchBy, setClientSearchBy] = useState<"name" | "number" | "store">("name");

  const fetchDropdowns = useCallback(async () => {
    if (!token) return;
    try {
      const [cls, cols, settingsRaw] = await Promise.all([
        apiRequest<ApiClient[]>("GET", "clients", { token }),
        apiRequest<ApiCollector[]>("GET", "collectors", { token }),
        apiRequest<ApiSetting[]>("GET", "settings", { token }),
      ]);

      // Parse settings
      const smap = Object.fromEntries(settingsRaw.map((s) => [s.key, s.value ?? ""]));
      const rate = parseFloat(smap.default_interest_rate ?? "0") || 0;
      const defSc = parseFloat(smap.default_service_charge ?? "0") || 0;
      let terms: number[] = [30, 45, 60];
      try {
        const parsed = JSON.parse(smap.loan_term_options ?? "[30,45,60]");
        if (Array.isArray(parsed) && parsed.length > 0) terms = parsed.map(Number).sort((a, b) => a - b);
      } catch { /* keep default */ }

      setDefaultInterestRate(rate);
      setTermOptions(terms);
      setSc(defSc);

      const defaultTerm = terms.includes(45) ? 45 : terms[0];
      setTermDays(defaultTerm);

      const termRate = defaultTerm === 30 ? 5 : defaultTerm === 45 ? 7.5 : defaultTerm === 60 ? 10 : Math.round((defaultTerm / 30) * 5 * 10) / 10;
      const defaultInterest = Math.round(10000 * termRate / 100);
      setInterest(defaultInterest);
      recalcDailyRaw(10000, defaultInterest, defSc, defaultTerm);

      setClients(cls);
      setCollectors(cols);
      if (cls.length > 0)  setClientId(cls[0].id);
      if (cols.length > 0) setCollectorId(cols[0].id);
    } catch {
      toast.error("Failed to load clients / collectors.");
    } finally {
      setLoadingData(false);
    }
  }, [token]);

  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  const totalLoanAmount = principal + interest;
  const totalReceivable = totalLoanAmount + sc;
  const dueDate = date ? addNonSundayDays(date, termDays) : null;

  function getTermInterestRate(t: number): number {
    if (t === 30) return 5;
    if (t === 45) return 7.5;
    if (t === 60) return 10;
    return Math.round((t / 30) * 5 * 10) / 10;
  }

  function recalcDailyRaw(p: number, i: number, s: number, t: number) {
    const tr = p + i + s;
    if (t > 0 && tr > 0) setDaily(Math.ceil(tr / t));
  }

  function recalcDaily(p: number, i: number, s: number, t: number) {
    recalcDailyRaw(p, i, s, t);
  }

  function handlePrincipalChange(p: number) {
    setPrincipal(p);
    const autoInterest = Math.round(p * getTermInterestRate(termDays) / 100);
    setInterest(autoInterest);
    recalcDaily(p, autoInterest, sc, termDays);
    setErrors((e) => ({ ...e, principal: "" }));
  }

  function handleTermChange(t: number) {
    setTermDays(t);
    const autoInterest = Math.round(principal * getTermInterestRate(t) / 100);
    setInterest(autoInterest);
    recalcDaily(principal, autoInterest, sc, t);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!clientId)         e.client    = "Select a client.";
    if (!collectorId)      e.collector = "Select a collector.";
    if (principal <= 0)    e.principal = "Principal must be greater than 0.";
    if (sc < 0)            e.sc        = "Processing fee cannot be negative.";
    if (daily <= 0)        e.daily     = "Daily payment must be greater than 0.";
    if (!date)             e.date      = "Release date is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validate() || !token) return;
    setSaving(true);
    try {
      const loan = await apiRequest<ApiLoan>("POST", "loans", {
        token,
        body: {
          client_id:      clientId,
          collector_id:   collectorId,
          loan_type:      loanType,
          principal,
          interest,
          service_charge: sc,
          daily_payment:  daily,
          term_days:      termDays,
          release_date:   date,
          remarks:        remarks || null,
        },
      });
      toast.success(`${LOAN_TYPE_LABELS[loanType]} created`, {
        description: `${loan.number} — ${termDays}-day schedule generated.`,
      });
      onLoanCreated(loan);
      // Reset form — restore setting-based defaults
      const resetPrincipal = 10000;
      const resetInterest  = defaultInterestRate > 0 ? Math.round(resetPrincipal * defaultInterestRate / 100) : 0;
      const resetSc        = parseFloat(String(sc)) || 0;
      const resetTerm      = termOptions.includes(45) ? 45 : termOptions[0];
      setPrincipal(resetPrincipal);
      setInterest(resetInterest);
      setTermDays(resetTerm);
      recalcDailyRaw(resetPrincipal, resetInterest, resetSc, resetTerm);
      setRemarks(""); setErrors({});
      setDate(new Date().toISOString().slice(0, 10));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create loan.");
    } finally {
      setSaving(false);
    }
  }

  const selectedClient    = clients.find((c) => c.id === clientId);
  const selectedCollector = collectors.find((c) => c.id === collectorId);
  const canPrint = !!selectedClient && !!selectedCollector && principal > 0 && !!date;

  const printParams = {
    client:         selectedClient ?? { name: "", store_name: "", address: "", phone: "" },
    collector:      selectedCollector ?? { name: "" },
    loanType, date, principal, interest, sc,
    totalLoanAmount, totalReceivable, daily, termDays, dueDate, remarks,
  };

  if (loadingData) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border bg-card">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">Select client</Label>
              <Select value={clientSearchBy} onValueChange={(v) => setClientSearchBy(v as typeof clientSearchBy)}>
                <SelectTrigger className="h-6 w-36 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Client name</SelectItem>
                  <SelectItem value="number">Client #</SelectItem>
                  <SelectItem value="store">Business name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.client && <p className="text-[11px] text-destructive">{errors.client}</p>}
            <SearchableCombobox
              options={clients.map((c) => ({
                value: c.id.toString(),
                label: c.name,
                sub: clientSearchBy === "number"
                  ? `#${c.number ?? c.id}`
                  : clientSearchBy === "store"
                    ? c.store_name
                    : c.store_name,
              }))}
              value={clientId?.toString() ?? ""}
              onChange={(v) => {
                const id = Number(v);
                setClientId(id);
                const client = clients.find((c) => c.id === id);
                if (client?.collector_id) setCollectorId(client.collector_id);
                setErrors((e) => ({ ...e, client: "" }));
              }}
              placeholder={
                clientSearchBy === "number" ? "Type client #…"
                : clientSearchBy === "store" ? "Type business name…"
                : "Type client name…"
              }
              error={!!errors.client}
            />
          </div>

          <Field label="Assigned collector" error={errors.collector}>
            <SearchableCombobox
              options={collectors.map((c) => ({
                value: c.id.toString(),
                label: c.name,
                sub: c.area,
              }))}
              value={collectorId?.toString() ?? ""}
              onChange={(v) => { setCollectorId(Number(v)); setErrors((e) => ({ ...e, collector: "" })); }}
              placeholder="Search by name or area…"
              error={!!errors.collector}
            />
          </Field>

          <Field label="Principal loan (₱)" error={errors.principal}>
            <Input
              type="number" min={0} value={principal}
              className={errors.principal ? "border-destructive" : ""}
              onChange={(e) => handlePrincipalChange(Number(e.target.value) || 0)}
            />
          </Field>

          <Field
            label={`Interest (₱) — ${getTermInterestRate(termDays)}% (${termDays}-day rate)`}
          >
            <Input
              value={formatPHP(interest)}
              readOnly
              className="bg-muted/40 text-muted-foreground"
            />
          </Field>

          <Field label="Term of loan">
            <Select value={String(termDays)} onValueChange={(v) => handleTermChange(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {termOptions.map((t) => <SelectItem key={t} value={String(t)}>{t} collection days (Mon–Sat)</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Processing fee (₱)" error={errors.sc}>
            <Input
              type="number" min={0} value={sc}
              className={errors.sc ? "border-destructive" : ""}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                setSc(v);
                recalcDaily(principal, interest, v, termDays);
                setErrors((err) => ({ ...err, sc: "" }));
              }}
            />
          </Field>

          <Field label="Loan release date" error={errors.date}>
            <DateInput
              value={date}
              error={!!errors.date}
              onChange={(e) => { setDate(e.target.value); setErrors((err) => ({ ...err, date: "" })); }}
            />
          </Field>

          <Field label="Due date (computed)">
            <Input value={dueDate ? formatDate(dueDate) : "—"} readOnly className="bg-muted/40 text-muted-foreground" />
          </Field>

          <Field label="Daily payment (₱)" error={errors.daily}>
            <Input
              type="number" min={0} value={daily || ""}
              className={errors.daily ? "border-destructive" : ""}
              onChange={(e) => { setDaily(Number(e.target.value) || 0); setErrors((err) => ({ ...err, daily: "" })); }}
            />
          </Field>

          <Field label="Remarks (optional)" full>
            <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any internal notes about this loan…" />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={() => printTILA(printParams)} disabled={!canPrint}>
            <FileText className="mr-1.5 h-4 w-4" />Print TILA
          </Button>
          <Button variant="outline" onClick={() => printInvoice(printParams)} disabled={!canPrint}>
            <ClipboardList className="mr-1.5 h-4 w-4" />Print Invoice
          </Button>
          <Button variant="outline" onClick={() => printLoanForm(printParams)} disabled={!canPrint}>
            <Printer className="mr-1.5 h-4 w-4" />Print Loan Form
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-glow"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            {saving ? "Creating…" : "Create loan & generate schedule"}
          </Button>
        </div>
      </div>

      {/* Summary panel */}
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
          <SumRow label="Term of loan" value={`${termDays} collection days`} />
          <SumRow label="Due date" value={dueDate ? formatDate(dueDate) : "—"} />
        </dl>
        <p className="mt-5 text-[11px] opacity-70">
          Total Loan Amount = Principal + Interest. Starting Balance = Total + Processing Fee. Sundays not counted in term.
        </p>
      </div>
    </div>
  );
}
