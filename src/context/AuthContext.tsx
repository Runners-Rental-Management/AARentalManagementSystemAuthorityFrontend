import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiGetMe,
  apiLogin,
  apiLogout,
  clearAuthTokens,
  getAccessToken,
  isAuthorityRole,
  setAuthTokens,
} from "@/lib/api";

import type { AuthorityRole, User } from "@/lib/types";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (input: {
    email: string;
    password: string;
    role: AuthorityRole;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await apiGetMe(token);
      if (!isAuthorityRole(me.role)) {
        clearAuthTokens();
        setUser(null);
      } else {
        setUser(me as User);
      }
    } catch {
      clearAuthTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (input: {
      email: string;
      password: string;
      role: AuthorityRole;
    }) => {
      const tokens = await apiLogin(input);
      setAuthTokens(tokens.accessToken, tokens.refreshToken);
      const me = await apiGetMe(tokens.accessToken);
      if (!isAuthorityRole(me.role)) {
        clearAuthTokens();
        throw new Error("This account is not an authority user.");
      }
      setUser(me as User);
    },
    [],
  );

  const logout = useCallback(async () => {
    const token = getAccessToken();
    if (token) {
      await apiLogout(token);
    } else {
      clearAuthTokens();
    }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const me = await apiGetMe(token);
      if (isAuthorityRole(me.role)) {
        setUser(me as User);
      }
    } catch {
      // silently ignore
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser }),
    [user, loading, login, logout, refreshUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
