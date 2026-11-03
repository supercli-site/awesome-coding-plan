/** 站头：品牌标记复用 SuperCLI 官方资产，链回主站。 */
import { h } from "./dom";
import brandMark from "../assets/supercli-mint.svg";

const THEME_KEY = "supercli-theme";

function currentTheme(): "light" | "dark" {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* 隐私模式下 localStorage 不可写，忽略 */
  }
}

const SUN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/></svg>`;
const MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z"/></svg>`;

const SECTIONS = [
  ["route", "官方推荐"],
  ["featured", "官方入口"],
  ["plans", "套餐"],
  ["api", "API 单价"],
  ["value", "性价比"],
  ["platforms", "售卖平台"],
  ["method", "口径"],
];

export function renderHeader(): HTMLElement {
  const toggle = h("button", {
    class: "theme-toggle",
    type: "button",
    "aria-label": "切换深色模式",
    title: "切换深色模式",
    html: currentTheme() === "dark" ? SUN : MOON,
  });
  toggle.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    toggle.innerHTML = next === "dark" ? SUN : MOON;
  });

  const nav = h(
    "nav",
    { class: "site-nav", "aria-label": "页面导航" },
    SECTIONS.map(([id, label]) =>
      h("a", { href: `#${id}`, "data-section": id } as never, label),
    ),
  );

  const header = h("header", { class: "site-header" }, [
    h("div", { class: "shell site-header__inner" }, [
      h("a", { class: "brand", href: "https://supercli.site", "aria-label": "SuperCLI 主站" }, [
        h("img", { class: "brand__mark", src: brandMark, alt: "", width: 26, height: 26 }),
        h("span", null, "SuperCLI"),
      ]),
      h("span", { class: "brand__divider", "aria-hidden": "true" }),
      h("span", { class: "brand__product" }, "TokenPlan"),
      nav,
      toggle,
    ]),
  ] as never);

  // 滚动高亮当前章节
  const links = new Map<string, HTMLAnchorElement>();
  nav.querySelectorAll<HTMLAnchorElement>("a[data-section]").forEach((a) => links.set(a.dataset.section!, a));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        for (const [id, a] of links) a.setAttribute("aria-current", String(id === e.target.id));
      }
    },
    { rootMargin: "-88px 0px -70% 0px" },
  );
  requestAnimationFrame(() => {
    for (const id of links.keys()) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
  });

  return header;
}
