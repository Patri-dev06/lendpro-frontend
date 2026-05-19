import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, LogIn, UserPlus, Users, Banknote, CircleDollarSign, Trash2, RefreshCw, Settings, FileText, UserCog } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { useRole } from "@/lib/role-context";

interface Notification {
  id: number;
  action: string;
  record: string | null;
  description: string | null;
  performed_by: string | null;
  performed_at: string;
  is_read: boolean;
}

function actionIcon(action: string) {
  if (action.startsWith("LOGIN") || action.startsWith("LOGOUT") || action.startsWith("REGISTER")) {
    return action === "REGISTER" ? <UserPlus className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />;
  }
  if (action.includes("CLIENT"))  return <Users className="h-3.5 w-3.5" />;
  if (action.includes("LOAN"))    return <Banknote className="h-3.5 w-3.5" />;
  if (action.includes("PAYMENT")) return <CircleDollarSign className="h-3.5 w-3.5" />;
  if (action.includes("USER"))    return <UserCog className="h-3.5 w-3.5" />;
  if (action.includes("DELETE"))  return <Trash2 className="h-3.5 w-3.5" />;
  if (action.includes("SCHEDULE")) return <RefreshCw className="h-3.5 w-3.5" />;
  if (action.includes("SETTING")) return <Settings className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

function actionColor(action: string): string {
  if (action.includes("DELETE"))  return "bg-destructive/10 text-destructive";
  if (action.includes("CREATE") || action === "REGISTER") return "bg-emerald-100 text-emerald-700";
  if (action.includes("UPDATE") || action.includes("PAYMENT")) return "bg-blue-100 text-blue-700";
  if (action.startsWith("LOGIN") || action.startsWith("LOGOUT")) return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export function NotificationBell() {
  const { token } = useRole();
  const [open, setOpen]  = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<{ notifications: Notification[]; unread_count: number }>(
        "GET",
        "notifications",
        { token }
      );
      setItems(data.notifications);
      setUnread(data.unread_count);
    } catch {
      // silently ignore — polling failure shouldn't surface to user
    }
  }, [token]);

  useEffect(() => {
    fetch();
    intervalRef.current = setInterval(fetch, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetch]);

  async function handleMarkRead() {
    if (!token || unread === 0) return;
    setLoading(true);
    try {
      await apiRequest("notifications/mark-read", { method: "POST", token });
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen(v: boolean) {
    setOpen(v);
    if (v) fetch();
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <p className="text-xs text-muted-foreground">{unread} unread</p>
            )}
          </div>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-primary"
              onClick={handleMarkRead}
              disabled={loading}
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="h-90">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition-colors ${n.is_read ? "" : "bg-primary/3"}`}
                >
                  {/* Icon badge */}
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${actionColor(n.action)}`}>
                    {actionIcon(n.action)}
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium leading-tight">
                      {n.description ?? n.action}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {n.performed_by && <span className="truncate max-w-25">{n.performed_by}</span>}
                      {n.performed_by && <span>·</span>}
                      <span className="shrink-0">{relativeTime(n.performed_at)}</span>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-4 py-2.5 text-center">
            <p className="text-xs text-muted-foreground">Showing last {items.length} activities</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
