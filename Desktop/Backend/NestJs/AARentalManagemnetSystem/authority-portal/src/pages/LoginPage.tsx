import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/api-error";
import type { AuthorityRole } from "@/lib/types";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<AuthorityRole>("system_admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || password.length < 8) {
      setError("Enter your official email and password (min 8 characters).");
      return;
    }
    setBusy(true);
    try {
      await login({ role, email: email.trim(), password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-semibold">Authority Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Government rental administration
          </h1>
          <p className="text-slate-300 leading-relaxed max-w-md">
            Verify tenancy agreements, resolve disputes, approve rent adjustments,
            and oversee the Addis Ababa regulated rental market.
          </p>
        </div>
        <p className="relative z-10 text-xs text-slate-500">
          Authorized personnel only. All actions are logged.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8"
        >
          <div className="flex items-center gap-2 text-indigo-700 mb-6">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-semibold">Official sign in</span>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AuthorityRole)}
            className="w-full mb-4 px-3 py-2.5 rounded-lg border border-slate-300 text-sm"
          >
            <option value="dara_agent">DARA Officer</option>
            <option value="admin">Government Admin</option>
            <option value="system_admin">System Administrator</option>
          </select>

          <label className="block text-sm font-medium text-slate-700 mb-1">
            Official email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 rounded-lg border border-slate-300 text-sm"
            placeholder="name@agency.gov.et"
            autoComplete="username"
          />

          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <div className="relative mb-4">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-300 text-sm"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Demo: admin@aarental.local / Passw0rd!234
          </p>

          {error && (
            <p className="text-sm text-rose-600 mb-4 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
