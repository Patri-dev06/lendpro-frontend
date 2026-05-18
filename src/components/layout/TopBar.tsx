import { Bell, Search, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, useRole, type Role } from "@/lib/role-context";
import { formatDate } from "@/lib/format";

export function TopBar() {
  const navigate = useNavigate();
  const { role, setRole, user, logout } = useRole();
  const displayName = user?.name ?? "User";
  const initials = displayName.split(" ").map((s) => s[0]).slice(0, 2).join("");

  async function handleLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="relative hidden md:block md:w-80">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search clients, loans, payments…" className="h-9 rounded-lg pl-8" />
      </div>
      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <span className="hidden text-xs text-muted-foreground sm:inline">{formatDate(new Date(), { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-left transition hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden leading-tight md:block">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-[11px] text-muted-foreground">{ROLE_LABELS[role]}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Switch role (demo)</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={role} onValueChange={(v) => setRole(v as Role)}>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <DropdownMenuRadioItem key={r} value={r}>{ROLE_LABELS[r]}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
