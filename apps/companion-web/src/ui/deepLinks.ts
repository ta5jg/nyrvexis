export type NvDeepView = "battle" | "shop" | "collection" | "monetization" | "leaderboard" | "share" | "push";

const VIEWS: NvDeepView[] = ["battle", "shop", "collection", "monetization", "leaderboard", "share", "push"];

export function parseRunFlag(url: URL): boolean {
  const v = (url.searchParams.get("run") ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function parseView(url: URL): NvDeepView | null {
  const raw = (url.searchParams.get("view") ?? "").toLowerCase();
  if (!raw) return null;
  return VIEWS.includes(raw as NvDeepView) ? (raw as NvDeepView) : null;
}

export function stripDeepLinkParams(url: URL, keys: string[]) {
  for (const k of keys) url.searchParams.delete(k);
  window.history.replaceState({}, "", url.toString());
}

export function scrollToSection(view: NvDeepView) {
  const el = document.getElementById(`kr-section-${view}`);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
