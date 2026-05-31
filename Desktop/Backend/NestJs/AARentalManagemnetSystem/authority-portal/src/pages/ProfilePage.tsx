import { useEffect, useState } from "react";
import { KeyRound, Save, Shield, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { apiChangePassword, apiUpdateMe, getAccessToken } from "@/lib/api";

interface ProfileForm {
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
};

function adminScopeLabel(user: { adminAllLocations?: boolean; adminSubCities?: string[] }) {
  if (user.adminAllLocations) return "All Locations Admin";
  return `${user.adminSubCities?.join(", ") || "No Location"} Admin`;
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState<ProfileForm>({
    address: user?.address ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [credentialEmail, setCredentialEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        address: user.address ?? "",
      });
      setCredentialEmail(user.email);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    try {
      await apiUpdateMe(token, {
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const token = getAccessToken();
    if (!token) return;
    if (credentialEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      toastError("Email credential must match your account email");
      return;
    }
    if (newPassword.length < 8) {
      toastError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("New password and confirmation do not match");
      return;
    }

    setChangingPassword(true);
    try {
      await apiChangePassword(token, {
        email: credentialEmail,
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      success("Password updated successfully");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">My Profile</h1>
        <p className="text-slate-500 text-sm">
          Manage your personal information and account details.
        </p>
      </div>

      {/* Avatar & role card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-5 shadow-sm">
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {adminScopeLabel(user)}
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
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Personal Information
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <LabeledField label="First Name (read-only)">
            <input
              disabled
              aria-label="First name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              value={user.firstName}
            />
          </LabeledField>
          <LabeledField label="Last Name (read-only)">
            <input
              disabled
              aria-label="Last name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              value={user.lastName}
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
          <LabeledField label="Phone (read-only)">
            <input
              disabled
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              value={user.phone}
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
            Only address can be updated here.
          </p>
        </div>
      </form>

      <form
        onSubmit={(e) => void handlePasswordChange(e)}
        className="mt-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Change Password
          </h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Confirm your account email and current password before setting a new
          password.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <LabeledField label="Account Email Credential">
            <input
              type="email"
              value={credentialEmail}
              onChange={(e) => setCredentialEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </LabeledField>
          <LabeledField label="Current Password">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="current-password"
            />
          </LabeledField>
          <LabeledField label="New Password">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="new-password"
            />
          </LabeledField>
          <LabeledField label="Confirm New Password">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="new-password"
            />
          </LabeledField>
        </div>
        <button
          type="submit"
          disabled={
            changingPassword ||
            !credentialEmail.trim() ||
            !currentPassword ||
            !newPassword ||
            !confirmPassword
          }
          className="inline-flex items-center gap-2 px-4 py-2 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          {changingPassword ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
