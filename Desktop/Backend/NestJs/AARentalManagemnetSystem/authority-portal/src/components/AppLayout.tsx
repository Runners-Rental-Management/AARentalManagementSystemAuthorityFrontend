import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Building2,
  FileCheck,
  Gavel,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  TrendingUp,
  Users,
  ScrollText,
  Home,
  ChevronLeft,
  Menu,
  UserCircle,
  Bell,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiGetUnreadCount, getAccessToken } from "@/lib/api";
import { cn } from "@/lib/utils";
type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allLocationsOnly?: boolean;
};

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    to: "/agreements",
    label: "Agreement verification",
    icon: FileCheck,
  },
  {
    to: "/properties",
    label: "Property listings",
    icon: Home,
  },
  {
    to: "/rent-adjustments",
    label: "Rent adjustments",
    icon: TrendingUp,
  },
  {
    to: "/users",
    label: "Users",
    icon: Users,
  },
  {
    to: "/parameters",
    label: "System parameters",
    icon: Settings,
    allLocationsOnly: true,
  },
  {
    to: "/audit-logs",
    label: "Audit logs",
    icon: ScrollText,
  },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

function scopeLabel(user: ReturnType<typeof useAuth>["user"]) {
  if (!user) return "";
  if (user.adminAllLocations) return "All Locations Admin";
  return `${user.adminSubCities.join(", ") || "No Location"} Admin`;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unread, setUnread] = useState(0);

  const links = NAV.filter((item) => !item.allLocationsOnly || user?.adminAllLocations);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const count = await apiGetUnreadCount(token);
        if (active) setUnread(count);
      } catch {
        // ignore
      }
    };
    void poll();
    const id = window.setInterval(poll, 30_000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "shrink-0 bg-slate-950 text-white flex flex-col transition-all duration-200 h-full",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Brand */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
          <div
            className={cn(
              "flex items-center gap-3 min-w-0",
              collapsed && "justify-center",
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">
                  A.A Rental Control
                </p>
                <p className="text-[11px] text-slate-400">Authority Portal</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <Menu className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <NavLink
            to="/profile"
            title={collapsed ? "My profile" : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors",
                collapsed && "justify-center",
                isActive
                  ? "bg-white/10 text-white"
                  : "hover:bg-white/10 text-slate-300 hover:text-white",
              )
            }
          >
            <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {scopeLabel(user)}
                </p>
              </div>
            )}
            {!collapsed && <UserCircle className="w-4 h-4 text-slate-500 shrink-0" />}
          </NavLink>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "w-full flex items-center gap-2 text-sm text-slate-300 hover:text-white py-2 px-2 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors",
              collapsed && "justify-center",
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && (loggingOut ? "Signing out…" : "Sign out")}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
          <p className="text-sm text-slate-500">
            Addis Ababa residential rental — government administration
          </p>
          <div className="flex items-center gap-4">
            <NavLink
              to="/notifications"
              className="relative text-slate-400 hover:text-slate-700 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </NavLink>
            <p className="text-xs text-slate-400 hidden sm:block">{user?.email}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
