import "@testing-library/jest-dom/vitest";

// Some components call window.location.reload().
Object.defineProperty(window, "location", {
  value: { reload: () => {} },
  writable: true,
});

