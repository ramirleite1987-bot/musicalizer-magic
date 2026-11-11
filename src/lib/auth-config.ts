export const SESSION_COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Host-musicalizer-session"
  : "musicalizer-session";
export const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
