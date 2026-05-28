import type { TranslationSection } from "./i18n";

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Translate = (section: TranslationSection, key: string) => string;

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

export function translateErrorMessage(error: unknown, t: Translate): string {
  const raw = getErrorMessage(error);
  const lower = raw.toLowerCase();

  if (lower.includes("invalid credentials")) {
    return t("auth", "invalidCredentials");
  }
  if (lower.includes("cannot reach") || lower.includes("failed to fetch")) {
    return t("common", "backendUnreachable");
  }
  if (lower.includes("session expired")) {
    return t("auth", "sessionExpired");
  }
  if (
    lower.includes("database is unavailable") ||
    lower.includes("database connection lost")
  ) {
    return t("common", "databaseUnavailable");
  }
  if (lower.includes("internal server error")) {
    return t("common", "internalServerError");
  }
  if (
    lower.includes("unexpected error") ||
    raw === "An unexpected error occurred."
  ) {
    return t("common", "unexpectedError");
  }

  return raw;
}
