import { cn } from "@/lib/utils";

interface StyleDef {
  bg: string;
  text: string;
  dot: string;
  ring: string;
}

const STYLES: Record<string, StyleDef> = {
  pending_verification: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-400", ring: "ring-amber-200" },
  pending_dara_verification: { bg: "bg-violet-50", text: "text-violet-800", dot: "bg-violet-400", ring: "ring-violet-200" },
  pending_payment: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-400", ring: "ring-amber-200" },
  extension_requested: { bg: "bg-indigo-50", text: "text-indigo-800", dot: "bg-indigo-400", ring: "ring-indigo-200" },
  termination_requested: { bg: "bg-rose-50", text: "text-rose-800", dot: "bg-rose-400", ring: "ring-rose-200" },
  pending_tenant_signature: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-400", ring: "ring-orange-200" },
  pending: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-400", ring: "ring-amber-200" },
  under_review: { bg: "bg-sky-50", text: "text-sky-800", dot: "bg-sky-400", ring: "ring-sky-200" },
  open: { bg: "bg-rose-50", text: "text-rose-800", dot: "bg-rose-400", ring: "ring-rose-200" },
  escalated: { bg: "bg-red-50", text: "text-red-900", dot: "bg-red-500", ring: "ring-red-200" },
  mediation: { bg: "bg-purple-50", text: "text-purple-800", dot: "bg-purple-400", ring: "ring-purple-200" },
  active: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-400", ring: "ring-emerald-200" },
  extended: { bg: "bg-teal-50", text: "text-teal-800", dot: "bg-teal-400", ring: "ring-teal-200" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-400", ring: "ring-emerald-200" },
  available: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-400", ring: "ring-emerald-200" },
  rejected: { bg: "bg-rose-50", text: "text-rose-800", dot: "bg-rose-400", ring: "ring-rose-200" },
  resolved: { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-400", ring: "ring-slate-200" },
  closed: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-300", ring: "ring-slate-200" },
  terminated: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-300", ring: "ring-slate-200" },
  expired: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-300", ring: "ring-slate-200" },
  draft: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-300", ring: "ring-slate-200" },
  rented: { bg: "bg-indigo-50", text: "text-indigo-800", dot: "bg-indigo-400", ring: "ring-indigo-200" },
  critical: { bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500", ring: "ring-red-200" },
  high: { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-400", ring: "ring-orange-200" },
  medium: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-400", ring: "ring-amber-200" },
  low: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-300", ring: "ring-emerald-200" },
};

const DEFAULT_STYLE: StyleDef = {
  bg: "bg-slate-50",
  text: "text-slate-600",
  dot: "bg-slate-300",
  ring: "ring-slate-200",
};

export function StatusBadge({
  value,
  className,
  showDot = true,
}: {
  value: string;
  className?: string;
  showDot?: boolean;
}) {
  const key = value.toLowerCase().replace(/\s+/g, "_");
  const s = STYLES[key] ?? DEFAULT_STYLE;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1",
        s.bg,
        s.text,
        s.ring,
        className,
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
      )}
      {value.replace(/_/g, " ")}
    </span>
  );
}
