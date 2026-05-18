import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/finance/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — BuenaMano" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Configure your BuenaMano workspace." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="font-display text-base font-semibold">Organization</h3>
          <p className="text-xs text-muted-foreground">Basic company information.</p>
          <div className="mt-5 space-y-3">
            <Field label="Company name"><Input defaultValue="LendPro Finance Inc." /></Field>
            <Field label="Default currency"><Input defaultValue="PHP — Philippine Peso" readOnly /></Field>
            <Field label="Time zone"><Input defaultValue="Asia/Manila (GMT+8)" readOnly /></Field>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="font-display text-base font-semibold">Operational rules</h3>
          <p className="text-xs text-muted-foreground">How collection thresholds are computed.</p>
          <div className="mt-5 space-y-4">
            <Toggle label="Auto-flag overdue at +3 days" defaultChecked />
            <Toggle label="Auto-flag past due at +30 days" defaultChecked />
            <Toggle label="Allow partial payments" defaultChecked />
            <Toggle label="Require remarks on missed collections" />
          </div>
        </div>
      </div>
      <div className="flex justify-end"><Button className="bg-primary text-primary-foreground hover:bg-primary-glow">Save changes</Button></div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
      <span className="text-sm">{label}</span>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
