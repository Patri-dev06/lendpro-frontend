import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CircleDollarSign, ShieldCheck, TrendingUp, LineChart, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS, type Role } from "@/lib/role-context";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — LendPro" }] }),
  component: LoginPage,
});

const STATS = [
  { label: "Collected today", value: "₱182,450", icon: TrendingUp },
  { label: "Outstanding", value: "₱1.74M", icon: LineChart },
  { label: "Overdue", value: "23 accts", icon: ShieldCheck },
  { label: "Active loans", value: "276", icon: CircleDollarSign },
];

function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Left visual panel */}
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.50_0.18_260/0.5),transparent_55%),radial-gradient(circle_at_bottom_right,oklch(0.55_0.20_295/0.35),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "linear-gradient(var(--primary-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--primary-foreground) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur ring-1 ring-primary-foreground/20">
            <CircleDollarSign className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-semibold">LendPro</p>
            <p className="text-[11px] uppercase tracking-widest opacity-70">Loan & Collection Suite</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
              Loan Management & Collection Monitoring System
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">
              Run a tighter book.<br />Collect with confidence.
            </h1>
            <p className="mt-3 text-sm text-primary-foreground/75">
              Encode loans, generate daily collection schedules, and monitor every peso your collectors bring in — all from one operations console.
            </p>
          </div>
          <div className="grid w-full max-w-md gap-3 sm:grid-cols-2">
            {STATS.map((m) => (
              <div key={m.label} className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-3 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-primary-foreground/60">{m.label}</span>
                  <m.icon className="h-3.5 w-3.5 opacity-70" />
                </div>
                <p className="mt-1 font-display text-lg font-semibold num">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} LendPro Finance Systems · Secure ISO-aligned operations
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-between bg-background p-6 sm:p-10">
        <div className="flex justify-end lg:hidden">
          <div className="flex items-center gap-2 text-primary">
            <CircleDollarSign className="h-5 w-5" />
            <span className="font-display font-semibold">LendPro</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm">
          {mode === "login" ? (
            <LoginForm onSwitch={() => setMode("register")} />
          ) : (
            <RegisterForm onSwitch={() => setMode("login")} />
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to LendPro's <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

/* ---------- LOGIN FORM ---------- */
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("alex@lendpro.ph");
  const [password, setPassword] = useState("demo1234");
  const [showPw, setShowPw] = useState(false);

  return (
    <>
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Sign in to your account</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Enter your credentials to access the operations console.</p>
      </div>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => { e.preventDefault(); navigate({ to: "/" }); }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email or Username</Label>
          <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lendpro.ph" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-glow">
          Sign in
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Demo build — any credentials work. Switch roles inside the app from the top-right menu.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button onClick={onSwitch} className="font-medium text-primary hover:underline">
          Create account
        </button>
      </p>
    </>
  );
}

/* ---------- REGISTER FORM ---------- */
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("collector");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <>
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Create an account</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Fill in the details to register a new user.</p>
      </div>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => { e.preventDefault(); if (!mismatch) navigate({ to: "/" }); }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="full-name">Full name</Label>
          <Input id="full-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan dela Cruz" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@lendpro.ph" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger id="role"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([r, label]) => (
                <SelectItem key={r} value={r}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Password</Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="pr-10"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className={`pr-10 ${mismatch ? "border-destructive focus-visible:ring-destructive" : ""}`}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mismatch && <p className="text-xs text-destructive">Passwords do not match.</p>}
        </div>
        <Button
          type="submit"
          disabled={mismatch}
          className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-glow disabled:opacity-50"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button onClick={onSwitch} className="font-medium text-primary hover:underline">
          Sign in
        </button>
      </p>
    </>
  );
}
