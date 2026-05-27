import { useEffect, useState } from "react";
import { Save, Shield, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { apiUpdateMe, getAccessToken } from "@/lib/api";

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  tenant: "Tenant",
  landlord: "Landlord",
  admin: "Admin",
  dara_agent: "DARA Agent",
  system_admin: "System Admin",
};

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState<ProfileForm>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: "",
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toastError("First and last name are required");
      return;
    }
    setSaving(true);
    try {
      await apiUpdateMe(token, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      await refreshUser();
      success("Profile updated successfully");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">My Profile</h1>
        <p className="text-slate-500 text-sm">
          Manage your personal information and account details.
        </p>
      </div>

      {/* Avatar & role card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl flex-shrink-0 select-none">
          {user.firstName[0]?.toUpperCase()}
          {user.lastName[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-slate-900 text-lg">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            {user.isVerified ? (
              <span className="flex items-center gap-1 text-xs text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" /> Account verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5" /> Not verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit profile form */}
      <form
        onSubmit={(e) => void handleSave(e)}
        className="bg-white border border-slate-200 rounded-xl p-5"
      >
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Personal Information
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <LabeledField label="First Name *">
            <input
              required
              aria-label="First name"
              placeholder="First name"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
            />
          </LabeledField>
          <LabeledField label="Last Name *">
            <input
              required
              aria-label="Last name"
              placeholder="Last name"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
            />
          </LabeledField>
          <LabeledField label="Email (read-only)">
            <input
              disabled
              aria-label="Email address"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              value={user.email}
            />
          </LabeledField>
          <LabeledField label="Phone">
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.phone}
              placeholder="e.g. +251 911 000 000"
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </LabeledField>
          <LabeledField label="Address">
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:col-span-2"
              value={form.address}
              placeholder="Optional home/office address"
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </LabeledField>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
          <p className="text-xs text-slate-400">
            To change your password, contact a system administrator.
          </p>
        </div>
      </form>
    </div>
  );
}
