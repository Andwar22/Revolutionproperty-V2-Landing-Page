// DARK MODE / THEME TOGGLE (SELF-CONTAINED)
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
});

function initThemeToggle() {
  if (window.__themeToggleInit) return;
  window.__themeToggleInit = true;

  const html = document.documentElement;
  const THEME_KEY = "cr:theme";
  const VALID_THEMES = ["light", "dark", "system"];
  const ICONS = { light: "ci-sun-03", dark: "ci-moon-02", system: "ci-computer-settings" };

  function getStoredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    return VALID_THEMES.includes(stored) ? stored : "system";
  }

  // Apply a theme to the current page without touching localStorage.
  function applyTheme(theme) {
    if (!VALID_THEMES.includes(theme)) theme = "system";
    html.setAttribute("data-theme", theme);
    syncToggleIcon(theme);
    syncActiveButtons(theme);
  }

  // Persist a theme and apply it to the current page.
  function setTheme(theme) {
    if (!VALID_THEMES.includes(theme)) theme = "system";
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  }

  function syncToggleIcon(theme) {
    const toggle = document.querySelector(".cr-dropdown.theme .cr-drop-toggle");
    if (!toggle) return;
    const icon = toggle.querySelector("i");
    if (!icon) return;
    icon.className = ICONS[theme] || ICONS.system;
  }

  function syncActiveButtons(theme) {
    document.querySelectorAll("[data-theme-value]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.themeValue === theme);
    });
  }

  // 1) Apply the persisted theme (or fall back to "system") on page load.
  applyTheme(getStoredTheme());

  // 2) Handle clicks on the theme buttons in this page.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-value]");
    if (!btn) return;
    setTheme(btn.dataset.themeValue);
  });

  // 3) Live sync across tabs/windows: when another open page changes the
  //    theme, the "storage" event fires here so this page updates instantly.
  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY) applyTheme(getStoredTheme());
  });
}
