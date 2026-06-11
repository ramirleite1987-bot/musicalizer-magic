// Stub for `@clerk/nextjs/server` in the jsdom test environment.
export async function auth() {
  return { userId: "user_test" };
}

export function clerkMiddleware() {
  return () => undefined;
}

export function createRouteMatcher() {
  return () => false;
}
