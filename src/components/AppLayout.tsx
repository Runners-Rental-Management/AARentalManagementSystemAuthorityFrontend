import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { AuthorityRole } from "@/lib/types";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: AuthorityRole[];
};

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    to: "/agreements",
    label: "Agreement verification",
    icon: FileCheck,
    roles: ["dara_agent", "admin", "system_admin"],
  },
  {
    to: "/properties",
    label: "Property listings",
    icon: Home,
    roles: ["dara_agent", "admin", "system_admin"],
  },
  {
    to: "/disputes",
    label: "Disputes",
    icon: Gavel,
    roles: ["dara_agent", "admin", "system_admin"],
  },
  {
    to: "/rent-adjustments",
    label: "Rent adjustments",
    icon: TrendingUp,
    roles: ["dara_agent", "admin", "system_admin"],
  },
  {
    to: "/users",
    label: "Users",
    icon: Users,
    roles: ["admin", "system_admin"],
  },
  {
    to: "/parameters",
    label: "System parameters",
    icon: Settings,
    roles: ["admin", "system_admin"],
  },
  {
    to: "/audit-logs",
    label: "Audit logs",
    icon: ScrollText,
    roles: ["admin", "system_admin"],
  },
];

function roleLabel(role: AuthorityRole) {
  if (role === "dara_agent") return "DARA Officer";
  if (role === "system_admin") return "System Administrator";
  return "Government Admin";
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const links = NAV.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

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
                  {user ? roleLabel(user.role) : ""}
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
          <p className="text-xs text-slate-400 hidden sm:block">{user?.email}</p>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
