import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const lookupMock = vi.hoisted(() => vi.fn());

vi.mock("node:dns/promises", () => ({
  lookup: lookupMock,
  default: { lookup: lookupMock },
}));

import {
  assertPublicHttpUrl,
  safeFetch,
  UnsafeUrlError,
} from "@/lib/security/url";

const PUBLIC_IP = "93.184.216.34";

describe("assertPublicHttpUrl", () => {
  beforeEach(() => {
    lookupMock.mockReset();
  });

  it("rejects malformed URLs", async () => {
    await expect(assertPublicHttpUrl("not a url")).rejects.toThrow(
      UnsafeUrlError
    );
  });

  it("rejects non-http(s) schemes", async () => {
    for (const url of [
      "file:///etc/passwd",
      "ftp://example.com/x",
      "gopher://example.com",
      "javascript:alert(1)",
    ]) {
      await expect(assertPublicHttpUrl(url)).rejects.toThrow(
        "Only http(s) URLs are allowed"
      );
    }
  });

  it("rejects private and internal IPv4 literals", async () => {
    for (const host of [
      "127.0.0.1",
      "10.0.0.5",
      "192.168.1.1",
      "172.16.0.1",
      "169.254.169.254", // AWS/GCP metadata endpoint
      "100.64.0.1", // CGNAT
      "0.0.0.0",
      "224.0.0.1", // multicast
    ]) {
      await expect(assertPublicHttpUrl(`http://${host}/`)).rejects.toThrow(
        "private address"
      );
    }
  });

  it("rejects private and internal IPv6 literals", async () => {
    for (const host of ["[::1]", "[fc00::1]", "[fd12::1]", "[fe80::1]"]) {
      await expect(assertPublicHttpUrl(`http://${host}/`)).rejects.toThrow(
        "private address"
      );
    }
  });

  it("rejects IPv4-mapped IPv6 pointing at loopback", async () => {
    // The URL parser canonicalizes the dotted form to hex (::ffff:7f00:1),
    // so both spellings must be blocked
    for (const host of ["[::ffff:127.0.0.1]", "[::ffff:7f00:1]", "[::ffff:a9fe:a9fe]"]) {
      await expect(assertPublicHttpUrl(`http://${host}/`)).rejects.toThrow(
        "private address"
      );
    }
  });

  it("allows IPv4-mapped IPv6 pointing at a public address", async () => {
    // ::ffff:5db8:d822 is 93.184.216.34
    const url = await assertPublicHttpUrl("http://[::ffff:5db8:d822]/");
    expect(url.hostname).toBe("[::ffff:5db8:d822]");
  });

  it("allows public IP literals without a DNS lookup", async () => {
    const url = await assertPublicHttpUrl(`https://${PUBLIC_IP}/audio.mp3`);
    expect(url.hostname).toBe(PUBLIC_IP);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it("rejects hostnames that resolve to a private address", async () => {
    lookupMock.mockResolvedValue([{ address: "10.0.0.7", family: 4 }]);
    await expect(
      assertPublicHttpUrl("https://internal.example.com/")
    ).rejects.toThrow("private address");
  });

  it("rejects hostnames where any resolved address is private (rebinding)", async () => {
    lookupMock.mockResolvedValue([
      { address: PUBLIC_IP, family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]);
    await expect(assertPublicHttpUrl("https://evil.example.com/")).rejects.toThrow(
      "private address"
    );
  });

  it("rejects hostnames that fail to resolve", async () => {
    lookupMock.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(assertPublicHttpUrl("https://nope.invalid/")).rejects.toThrow(
      "Could not resolve host"
    );
  });

  it("allows hostnames that resolve only to public addresses", async () => {
    lookupMock.mockResolvedValue([{ address: PUBLIC_IP, family: 4 }]);
    const url = await assertPublicHttpUrl("https://example.com/page");
    expect(url.hostname).toBe("example.com");
  });
});

describe("safeFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    lookupMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the body for an OK public response", async () => {
    fetchMock.mockResolvedValue(new Response("hello", { status: 200 }));
    const { body } = await safeFetch(`http://${PUBLIC_IP}/file`);
    expect(new TextDecoder().decode(body)).toBe("hello");
  });

  it("validates every redirect hop and blocks redirects to private hosts", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/latest/meta-data/" },
      })
    );
    await expect(safeFetch(`http://${PUBLIC_IP}/start`)).rejects.toThrow(
      "private address"
    );
    // The private hop must be rejected before any request is made to it
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("follows redirects between public hosts", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(null, {
          status: 301,
          headers: { location: `http://${PUBLIC_IP}/moved` },
        })
      )
      .mockResolvedValueOnce(new Response("moved", { status: 200 }));
    const { body } = await safeFetch(`http://${PUBLIC_IP}/start`);
    expect(new TextDecoder().decode(body)).toBe("moved");
  });

  it("gives up after too many redirects", async () => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: `http://${PUBLIC_IP}/loop` },
      })
    );
    await expect(safeFetch(`http://${PUBLIC_IP}/loop`)).rejects.toThrow(
      "Too many redirects"
    );
  });

  it("rejects responses whose declared content-length exceeds the cap", async () => {
    fetchMock.mockResolvedValue(
      new Response("x", {
        status: 200,
        headers: { "content-length": String(10 * 1024 * 1024) },
      })
    );
    await expect(
      safeFetch(`http://${PUBLIC_IP}/big`, { maxBytes: 1024 })
    ).rejects.toThrow("Response too large");
  });

  it("rejects streamed bodies that exceed the cap without a content-length", async () => {
    const chunk = new Uint8Array(512);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < 10; i++) controller.enqueue(chunk);
        controller.close();
      },
    });
    fetchMock.mockResolvedValue(new Response(stream, { status: 200 }));
    await expect(
      safeFetch(`http://${PUBLIC_IP}/stream`, { maxBytes: 1024 })
    ).rejects.toThrow("Response too large");
  });

  it("rejects non-OK upstream responses", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(safeFetch(`http://${PUBLIC_IP}/err`)).rejects.toThrow(
      "Upstream responded with 500"
    );
  });
});
