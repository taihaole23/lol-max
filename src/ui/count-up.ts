// Makes a number "count up" (or down) to its new value instead of jumping, like a damage counter.
// Skipped when the visitor's system asks for less motion.
import { formatDamage } from "./results-view.ts";

const duration = 350; // ms
const running = new WeakMap<HTMLElement, number>(); // element → its animation frame

export function countTo(element: HTMLElement, to: number): void {
  const from = Number(element.dataset.value);
  element.dataset.value = String(to);
  cancelAnimationFrame(running.get(element) ?? 0);

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!Number.isFinite(from) || from === to || reduceMotion) {
    element.textContent = formatDamage(to);
    return;
  }

  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3; // fast at first, then settles
    element.textContent = formatDamage(from + (to - from) * eased);
    if (t < 1) running.set(element, requestAnimationFrame(step));
  };
  running.set(element, requestAnimationFrame(step));
}

// When the box shows something that isn't a number ("—", "…"), forget the old value, so the next
// number appears straight away instead of counting from a stale one.
export function showText(element: HTMLElement, text: string): void {
  cancelAnimationFrame(running.get(element) ?? 0);
  delete element.dataset.value;
  element.textContent = text;
}
