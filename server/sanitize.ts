/**
 * Server-side input sanitization helpers.
 * Drizzle ORM uses parameterized queries — SQL injection is blocked at the
 * DB layer. These helpers add a second line of defence: stripping dangerous
 * control characters, enforcing length limits, and normalising values before
 * they ever reach business logic or the database.
 */

/** Strip null bytes and ASCII control characters (except tab/newline/CR). */
function stripControl(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

/** Trim + strip control chars + enforce a max byte length. */
export function sanitizeString(value: unknown, maxLen = 1000): string {
  if (typeof value !== "string") return "";
  return stripControl(value.trim()).slice(0, maxLen);
}

/** Lowercase, strip spaces and any character that isn't a-z 0-9 or _. */
export function sanitizeUsername(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

/** Lowercase + trim email, max 254 chars (RFC 5321). */
export function sanitizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return stripControl(value.trim().toLowerCase()).slice(0, 254);
}

/** Strip whitespace from phone numbers, keep + and digits. */
export function sanitizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, "").replace(/[^\d+\-().]/g, "").slice(0, 20);
}

/** Sanitize an object's string fields in-place using a field → maxLen map. */
export function sanitizeBody(
  body: Record<string, unknown>,
  fields: Record<string, number>,
): void {
  for (const [field, maxLen] of Object.entries(fields)) {
    if (field in body) {
      body[field] = sanitizeString(body[field], maxLen);
    }
  }
}
