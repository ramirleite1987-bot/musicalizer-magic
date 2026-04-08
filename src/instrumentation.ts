export async function register() {
  if (process.env.NEON_LOCAL_PROXY) {
    const originalFetch = globalThis.fetch;
    const proxyTarget = process.env.NEON_LOCAL_PROXY;
    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (url.includes("/sql") && url.includes("localtest.me")) {
        return originalFetch(proxyTarget, init);
      }
      return originalFetch(input, init);
    }) as typeof fetch;
  }
}
