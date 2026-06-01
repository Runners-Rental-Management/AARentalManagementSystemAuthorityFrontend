import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Check,
  Loader2,
} from "lucide-react";
import {
  apiListNotifications,
  apiMarkNotificationRead,
  apiMarkAllNotificationsRead,
  getAccessToken,
  type BackendNotification,
} from "@/lib/api";
import { useNavigate } from "react-router-dom";

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

function NotifIcon({ type }: { type: BackendNotification["type"] }) {
  switch (type) {
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case "success":
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case "error":
      return <XCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await apiListNotifications(token, "page=1&pageSize=100");
      setItems(res.items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = filter === "unread" ? items.filter((n) => !n.isRead) : items;
  const unreadCount = items.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    const token = getAccessToken();
    if (!token) return;
    await apiMarkAllNotificationsRead(token).catch(() => undefined);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    const token = getAccessToken();
    if (!token) return;
    await apiMarkNotificationRead(token, id).catch(() => undefined);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleClick = (n: BackendNotification) => {
    if (!n.isRead) void markRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary-600" />
        Notifications
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? "bg-primary-100 text-primary-700"
                      : "text-stone-500 hover:bg-stone-100"
                  }`}
                >
                  {f === "all" ? `All (${items.length})` : `Unread (${unreadCount})`}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="space-y-2">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition-colors cursor-pointer hover:border-primary-200 ${
                  n.isRead ? "border-stone-200" : "border-primary-200 bg-primary-50/30"
                }`}
                onClick={() => handleClick(n)}
              >
                <div className="shrink-0 mt-0.5">
                  <NotifIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm ${n.isRead ? "text-stone-700" : "text-stone-900 font-semibold"}`}>
                      {n.title}
                    </h3>
                    <span className="text-xs text-stone-400 shrink-0">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 mt-0.5">{n.message}</p>
                  {!n.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); void markRead(n.id); }}
                      className="mt-2 text-xs text-stone-400 hover:text-stone-600"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                {!n.isRead && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2" />
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Bell className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-stone-500 text-sm">No notifications</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
