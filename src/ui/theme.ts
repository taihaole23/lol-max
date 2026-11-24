// Dark or light theme. Dark is the default (Eric); the toggle in the top bar switches it, and
// the choice is remembered in this browser (localStorage).
//
// The CSS reads `data-theme` on <html>: no attribute = dark, "light" = light.
// index.html runs a tiny script before the page appears, so a light-mode visitor never sees a
// flash of dark first.
export type Theme = "dark" | "light";

const storageKey = "lol-max-theme";

// localStorage can be missing or blocked (private windows, strict settings), so every use is
// wrapped in try/catch; the site then simply starts dark each time.
export function savedTheme(): Theme {
  try {
    return localStorage.getItem(storageKey) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme): void {
  if (theme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // Not remembered; fine.
  }
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
