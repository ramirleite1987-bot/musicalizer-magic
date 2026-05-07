/**
 * fireConfetti — triggers a celebratory confetti burst from both sides of the screen.
 * Only runs client-side.
 */
export function fireConfetti(): void {
  if (typeof window === "undefined") return;

  // Dynamic import so the module is never evaluated on the server
  import("canvas-confetti").then(({ default: confetti }) => {
    const colors = ["#7c3aed", "#9333ea", "#ffffff", "#f59e0b"];
    const shared = {
      particleCount: 120,
      spread: 70,
      colors,
    };

    confetti({ ...shared, origin: { x: 0.3, y: 0.7 } });
    confetti({ ...shared, origin: { x: 0.7, y: 0.7 } });
  });
}
