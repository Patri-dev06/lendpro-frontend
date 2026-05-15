import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CircleDollarSign, ShieldCheck, TrendingUp, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — LendPro" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("alex@lendpro.ph");
  const [password, setPassword] = useState("demo1234");

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Left visual panel */}
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.50_0.18_260/0.5),transparent_55%),radial-gradient(circle_at_bottom_right,oklch(0.55_0.20_295/0.35),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(var(--primary-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--primary-foreground) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">Loan Management & Collection Monitoring System</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">
              Run a tighter book.<br />Collect with confidence.
            </h1>
            <p className="mt-3 text-sm text-primary-foreground/75">
              Encode loans, generate daily collection schedules, and monitor every peso your collectors bring in — all from one operations console.
            </p>
          </div>

          {/* Decorative dashboard preview */}
          <div className="grid w-full max-w-md gap-3 sm:grid-cols-2">
            {[
              { label: "Collected today", value: "₱182,450", icon: TrendingUp },
              { label: "Outstanding", value: "₱1.74M", icon: LineChart },
              { label: "Overdue", value: "23 accts", icon: ShieldCheck },
              { label: "Active loans", value: "276", icon: CircleDollarSign },
            ].map((m) => (
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

        <p className="relative text-xs text-primary-foreground/60">© {new Date().getFullYear()} LendPro Finance Systems · Secure ISO-aligned operations</p>
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
          <h2 className="font-display text-2xl font-semibold tracking-tight">Sign in to your account</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Enter your credentials to access the operations console.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/" });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email or Username</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lendpro.ph" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-primary-glow hover:underline">Forgot?</a>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-glow">Sign in</Button>
            <p className="text-center text-xs text-muted-foreground">
              Demo build — any credentials work. Switch roles inside the app from the top-right menu.
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing in you agree to LendPro's <a className="underline">Terms</a> and <a className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
