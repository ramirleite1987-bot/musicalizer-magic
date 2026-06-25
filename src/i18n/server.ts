import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./index";

// Resolve the active locale from the request cookie (for Server Components).
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}

// Get the dictionary for the active request locale (for Server Components).
export async function getServerDictionary(): Promise<Dictionary> {
  return getDictionary(await getServerLocale());
}
