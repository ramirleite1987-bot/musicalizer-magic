import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n/provider";
import { LOCALE_COOKIE, htmlLang, resolveLocale } from "@/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Musicalizer Magic",
  description: "AI-powered music production workbench with iterative versioning",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html lang={htmlLang(locale)} className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <I18nProvider initialLocale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="musicalizer-theme"
          >
            {children}
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
