// @vitest-environment node
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, hashSessionToken, newSessionToken } from "@/lib/auth-password";

describe("native password credentials", () => {
  it("uses different salts and verifies only the original password", async () => {
    const password = "a long password for this test";
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toBe(second);
    expect(first).not.toContain(password);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword("a wrong password for this test", first)).toBe(false);
  });

  it("rejects missing and malformed stored credentials", async () => {
    for (const stored of [null, "", "scrypt$wrong", "scrypt$999999999$8$3$aa$bb"]) {
      expect(await verifyPassword("a long password for this test", stored)).toBe(false);
    }
  });

  it("generates opaque tokens and stores a separate fixed-length digest", () => {
    const token = newSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(newSessionToken()).not.toBe(token);
    expect(hashSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(token)).not.toBe(token);
  });
});
