import "@testing-library/jest-dom/vitest";

// Some components call window.location.reload().
if (typeof window !== "undefined") {
  Object.defineProperty(window, "location", {
    value: { reload: () => {} },
    writable: true,
  });
}

