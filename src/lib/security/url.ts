import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF guard: only allow outbound fetches to public http(s) hosts.
 * Blocks loopback, private, link-local, and cloud-metadata address ranges,
 * both for IP-literal URLs and for hostnames (via DNS resolution).
 */

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  return (
    a === 0 || // 0.0.0.0/8
    a === 10 || // 10.0.0.0/8
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 (CGNAT)
    (a === 169 && b === 254) || // link-local + AWS metadata
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 0) || // 192.0.0.0/24 + 192.0.2.0/24
    (a === 192 && b === 168) || // 192.168.0.0/16
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15
    a >= 224 // multicast + reserved
  );
}

function isPrivateIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version !== 6) return true;
  const lower = ip.toLowerCase();
  // IPv4-mapped IPv6 (::ffff:a.b.c.d)
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return (
    lower === "::" ||
    lower === "::1" || // loopback
    lower.startsWith("fc") || // fc00::/7 unique local
    lower.startsWith("fd") ||
    lower.startsWith("fe8") || // fe80::/10 link-local
    lower.startsWith("fe9") ||
    lower.startsWith("fea") ||
    lower.startsWith("feb")
  );
}

export class UnsafeUrlError extends Error {}

/** Parses `raw` and rejects non-http(s) schemes and private/internal hosts. */
export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Invalid URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new UnsafeUrlError("Only http(s) URLs are allowed");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new UnsafeUrlError("URL resolves to a private address");
    }
    return url;
  }
  let addresses;
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new UnsafeUrlError("Could not resolve host");
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new UnsafeUrlError("URL resolves to a private address");
  }
  return url;
}

const MAX_REDIRECTS = 3;

/**
 * Fetches a user- or third-party-supplied URL with SSRF protection:
 * validates every hop of the redirect chain, enforces a timeout and a
 * response-size cap.
 */
export async function safeFetch(
  raw: string,
  { timeoutMs = 15_000, maxBytes = 5 * 1024 * 1024 }: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<{ response: Response; body: ArrayBuffer }> {
  let current = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicHttpUrl(current);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new UnsafeUrlError("Redirect without location");
      current = new URL(location, url).toString();
      continue;
    }
    if (!response.ok) {
      throw new UnsafeUrlError(`Upstream responded with ${response.status}`);
    }
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > maxBytes) {
      throw new UnsafeUrlError("Response too large");
    }
    const body = await readBodyWithLimit(response, maxBytes);
    return { response, body };
  }
  throw new UnsafeUrlError("Too many redirects");
}

async function readBodyWithLimit(response: Response, maxBytes: number): Promise<ArrayBuffer> {
  if (!response.body) return new ArrayBuffer(0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      reader.cancel().catch(() => {});
      throw new UnsafeUrlError("Response too large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out.buffer;
}
