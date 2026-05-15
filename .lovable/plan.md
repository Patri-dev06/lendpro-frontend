# Loan Management & Collection Monitoring System — Build Plan

A polished, front-end-only prototype (no backend) using TanStack Start + Tailwind + shadcn/ui + Recharts. Navy/royal-blue corporate theme with green/orange/red status accents. Realistic Philippine peso demo data hard-coded in `src/lib/mock-data.ts`.

## Design system

Update `src/styles.css` with finance-oriented tokens (oklch):
- `--primary` deep navy `#0B1E3F`, `--primary-glow` royal blue `#1E40AF`
- `--background` light gray `#F5F7FB`, `--card` white, `--foreground` near-black
- Status tokens: `--success` (green paid), `--warning` (orange overdue), `--destructive` (red past due), `--info` (blue partial), `--accent-purple` (renew/catch-up)
- Status badge variants: `new`, `renew`, `overdue`, `past-due`, `paid`, `partial`, `missed`, `pending`, `catch-up`
- Typography: Inter (body) + Manrope (display/numbers) via Google Fonts in `__root.tsx`
- Rounded `--radius: 0.75rem`, soft shadow utility `--shadow-card`

## Layout shell

`src/routes/_app.tsx` — pathless layout providing the authenticated shell (sidebar + topbar + `<Outlet />`). All app routes nest under it. `/login` lives outside the shell.

- `src/components/layout/AppSidebar.tsx` — collapsible shadcn Sidebar with Lucide icons: Dashboard, Clients, Loans, Collection Schedule, Payments, Reports, Collectors, User Management, Audit Logs, Settings. Active route highlighting via `useRouterState`.
- `src/components/layout/TopBar.tsx` — page title (from route handle), search, notifications popover, current date, user dropdown, role badge.
- `src/lib/role-context.tsx` — simple React context with a role switcher (top-right) so reviewers can toggle between Admin/Encoder, Collector, Manager, System Admin. Dashboard route renders the appropriate dashboard based on selected role.

## Routes

```
src/routes/
  __root.tsx              (existing shell — adds fonts + role provider)
  login.tsx               (split-screen login)
  _app.tsx                (sidebar + topbar layout)
  _app/index.tsx          (role-aware Dashboard)
  _app/clients.tsx        (list + add/edit dialog + drawer profile)
  _app/clients.$clientId.tsx  (full profile view)
  _app/loans.tsx          (loan list + create-loan form with live computation)
  _app/schedule.tsx       (collection schedule per loan)
  _app/payments.tsx       (payment recording + history)
  _app/reports.tsx        (report center with filters + export buttons)
  _app/collectors.tsx     (collector list)
  _app/collectors.$id.tsx (collector performance detail)
  _app/users.tsx          (user management)
  _app/audit.tsx          (audit logs)
  _app/settings.tsx       (basic settings stub)
```

Index dashboard branches:
- `AdminDashboard` — 7 summary cards, donut + monthly releases + outstanding-balance line, borrower monitoring table with filters.
- `CollectorDashboard` — 6 ops cards, daily worklist with quick "Record Payment" action, route/visit panel, quick filters.
- `ManagerDashboard` — KPI strip, expected-vs-actual bars, monthly line, status donut, collector horizontal bar comparison, collector performance table, risk monitoring cards.
- System Administrator → defaults to Manager view + extra access to Users/Audit (already in sidebar).

## Shared components

- `src/components/ui/StatCard.tsx` — icon, label, value, trend, status color
- `src/components/ui/StatusBadge.tsx` — typed status → colored pill
- `src/components/ui/PageHeader.tsx` — title, subtitle, actions slot
- `src/components/ui/DataTable.tsx` — wrapper over shadcn Table with search/filter slot, pagination, empty state
- `src/components/charts/` — Recharts wrappers (DonutChart, BarChart, LineChart, HBarChart) themed to design tokens
- `src/lib/format.ts` — `formatPHP()` (`₱10,000.00`), `formatDate()`
- `src/lib/mock-data.ts` — borrowers, loans, schedules, payments, collectors, users, audit logs (Juan Dela Cruz, Maria Santos, Roberto Reyes, Ana Villanueva; Mark Rivera, Sheila Cruz, John Ramos; realistic PHP amounts)

## Loan creation logic (client-side only)

Form recomputes on every change:
- `totalReceivable = principal + interest + serviceCharge`
- `days = ceil(totalReceivable / dailyPayment)`
- `expectedEndDate = releaseDate + days`
Live summary panel + "Create Loan and Generate Collection Schedule" button (generates rows in local state, shown via toast — no persistence needed for prototype).

## Payment recording

Live "previous → payment → new balance" preview cards. Form is non-persistent; submit shows toast and prepends to in-memory recent-payments list.

## Reports

Category cards → on click, render mock report table preview + Generate / Export Excel / Export PDF / Print buttons (visual only).

## Login page

Split-screen: left = abstract financial dashboard SVG/gradient illustration with system name + tagline; right = email + password + sign-in button. "Sign in" navigates to `/`.

## Out of scope (prototype)

- No Lovable Cloud / DB / auth — purely visual with mock data and in-memory state.
- No real exports — buttons trigger toasts.
- Charts use Recharts with sample series.

## Deliverable

A clickable, demo-ready multi-page UI suitable to present to a client, with role switcher to walk through Admin/Encoder, Collector, and Manager experiences.
