import { useCallback, useEffect, useState } from "react";
import { Check, Edit2, RefreshCw, Settings, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import {
  apiListSystemParameters,
  apiUpdateSystemParameter,
  getAccessToken,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type {
  SystemParameter,
  SystemParameterCategory,
} from "@/lib/types";

const CATEGORY_LABELS: Record<SystemParameterCategory, string> = {
  rental: "Rental Policy",
  compliance: "Compliance",
  system: "System",
  notification: "Notifications",
};

const CATEGORY_COLORS: Record<SystemParameterCategory, string> = {
  rental: "bg-amber-50 text-amber-700 border-amber-200",
  compliance: "bg-primary-50 text-primary-700 border-primary-200",
  system: "bg-stone-50 text-stone-700 border-stone-200",
  notification: "bg-violet-50 text-violet-700 border-violet-200",
};

function ParameterCard({
  param,
  canEdit,
  onSave,
}: {
  param: SystemParameter;
  canEdit: boolean;
  onSave: (key: string, value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(param.value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === param.value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(param.key, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(param.value);
    setEditing(false);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-300 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-stone-900 text-sm">
              {param.label}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[param.category]}`}
            >
              {CATEGORY_LABELS[param.category]}
            </span>
          </div>
          <p className="text-xs text-stone-400 font-mono">{param.key}</p>
        </div>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => {
              setDraft(param.value);
              setEditing(true);
            }}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 transition-colors flex-shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      <p className="text-xs text-stone-500 mb-3">{param.description}</p>

      {editing ? (
        <div className="space-y-2">
          <input
            aria-label={`Value for ${param.label}`}
            placeholder={`Enter value for ${param.key}`}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 border border-stone-200 text-xs font-medium rounded-lg hover:bg-stone-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg text-stone-900">
            {param.value}
          </span>
          <span className="text-xs text-stone-400">
            Updated {new Date(param.updatedAt).toLocaleDateString()}
            {param.updatedBy &&
              ` by ${param.updatedBy.firstName} ${param.updatedBy.lastName}`}
          </span>
        </div>
      )}
    </div>
  );
}

export function SystemParametersPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [params, setParams] = useState<SystemParameter[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<SystemParameterCategory | "">("");

  const canEdit = !!user?.adminAllLocations;

  const load = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    apiListSystemParameters(token)
      .then(setParams)
      .catch((e) =>
        toastError(e instanceof Error ? e.message : "Failed to load parameters"),
      )
      .finally(() => setLoading(false));
  }, [toastError]);

  useEffect(load, [load]);

  const handleSave = async (key: string, value: string) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const updated = await apiUpdateSystemParameter(token, key, value);
      setParams((prev) =>
        prev ? prev.map((p) => (p.key === key ? updated : p)) : prev,
      );
      success("Parameter updated successfully");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update parameter");
      throw e;
    }
  };

  const grouped = params
    ? params
        .filter((p) => !filterCat || p.category === filterCat)
        .reduce<Partial<Record<SystemParameterCategory, SystemParameter[]>>>(
          (acc, p) => {
            acc[p.category] = [...(acc[p.category] ?? []), p];
            return acc;
          },
          {},
        )
    : null;

  const categories: SystemParameterCategory[] = [
    "rental",
    "compliance",
    "system",
    "notification",
  ];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">
            System Parameters
          </h1>
          <p className="text-stone-500 text-sm">
            {canEdit
              ? "Configure system-wide policy and operational parameters."
              : "View current system configuration parameters. Only all-location admins can edit values."}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-stone-200 hover:bg-stone-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <button
          type="button"
          onClick={() => setFilterCat("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!filterCat ? "bg-primary-600 text-white border-primary-600" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
        >
          All categories
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterCat === c ? "bg-primary-600 text-white border-primary-600" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-stone-200 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && params?.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <Settings className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No system parameters configured yet.</p>
        </div>
      )}

      {!loading && grouped && (
        <div className="space-y-6">
          {categories
            .filter((c) => grouped[c]?.length)
            .map((cat) => (
              <section key={cat}>
                <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(grouped[cat] ?? []).map((p) => (
                    <ParameterCard
                      key={p.key}
                      param={p}
                      canEdit={canEdit}
                      onSave={handleSave}
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
