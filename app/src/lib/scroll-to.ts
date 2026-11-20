/**
 * Reliable in-page navigation for a very long page.
 *
 * Native anchor jumps land in the wrong place here: smooth scrolling over tens
 * of thousands of pixels is slow on Safari, and the layout above the target
 * keeps changing while the archive data and photos arrive. So we jump
 * instantly, then keep the target pinned at its offset until the layout has
 * been stable for a moment (or the visitor scrolls themselves).
 */
const OFFSET = 12;
let cancelActive: (() => void) | null = null;

function targetTop(el: HTMLElement) {
  return el.getBoundingClientRect().top + window.scrollY - OFFSET;
}

export function scrollToId(id: string, opts: { updateHash?: boolean } = {}) {
  if (typeof window === "undefined") return false;
  const el = document.getElementById(id);
  if (!el) return false;

  cancelActive?.();
  const instant = "instant" as ScrollBehavior;
  window.scrollTo({ top: targetTop(el), behavior: instant });
  if (opts.updateHash !== false) {
    history.replaceState(history.state, "", `#${id}`);
  }

  let stableSince = performance.now();
  const started = stableSince;
  let raf = 0;
  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
    if (cancelActive === stop) cancelActive = null;
  };

  const tick = () => {
    if (stopped) return;
    const now = performance.now();
    const node = document.getElementById(id);
    if (!node) return stop();
    const want = targetTop(node);
    if (Math.abs(want - window.scrollY) > 2) {
      window.scrollTo({ top: want, behavior: instant });
      stableSince = now;
    }
    if (now - stableSince > 700 || now - started > 6000) return stop();
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);
  cancelActive = stop;
  raf = requestAnimationFrame(tick);
  return true;
}

/** Intercepts every same-page "#id" link click and routes it through scrollToId. */
export function installAnchorScroll() {
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a[href^='#']");
    if (!a) return;
    const id = decodeURIComponent((a.getAttribute("href") ?? "").slice(1));
    if (!id) return;
    if (id === "top") {
      e.preventDefault();
      cancelActive?.();
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      history.replaceState(history.state, "", location.pathname + location.search);
      return;
    }
    if (document.getElementById(id)) {
      e.preventDefault();
      scrollToId(id);
    }
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
