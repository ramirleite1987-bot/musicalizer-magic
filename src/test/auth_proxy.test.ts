// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";

describe("authentication routing", () => {
  it("redirects private pages and returns 401 for unauthenticated APIs", () => {
    const page = proxy(new NextRequest("https://music.test/dashboard"));
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toBe("https://music.test/sign-in");
    expect(proxy(new NextRequest("https://music.test/api/generation/test/status")).status).toBe(401);
  });

  it("allows authentication forms and routes plausible cookies to database checks", () => {
    expect(proxy(new NextRequest("https://music.test/sign-in")).status).toBe(200);
    const request = new NextRequest("https://music.test/dashboard", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${"a".repeat(43)}` },
    });
    expect(proxy(request).headers.get("x-middleware-next")).toBe("1");
  });

  it("rejects unsafe cross-origin requests including when a session cookie is present", () => {
    const request = new NextRequest("https://music.test/api/upload", {
      method: "POST", headers: { origin: "https://attacker.test", cookie: `${SESSION_COOKIE_NAME}=${"a".repeat(43)}` },
    });
    expect(proxy(request).status).toBe(403);
    expect(proxy(new NextRequest("https://music.test/api/upload", { method: "POST" })).status).toBe(403);
    expect(proxy(new NextRequest("https://music.test/api/upload", {
      method: "POST", headers: { origin: "https://music.test" },
    })).status).toBe(401);
  });
});
