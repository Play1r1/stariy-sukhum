import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  ArrowsIn,
  MagnifyingGlass,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from "@phosphor-icons/react/dist/ssr";

/** Largest zoom; the scans are about 1000px wide, more than this only shows blur. */
const MAX_ZOOM = 4;
/** Zoom reached by a single click or tap on the photo. */
const TAP_ZOOM = 2.5;
/** Step of the + and - buttons and keys. */
const BUTTON_STEP = 1.5;
/** Magnification and radius (px) of the hover loupe. */
const LENS_ZOOM = 2.5;
const LENS_RADIUS = 90;
/** A press that moves less than this (px) counts as a click, not a drag. */
const TAP_SLOP = 6;

interface View {
  s: number;
  x: number;
  y: number;
}

interface Lens {
  left: number;
  top: number;
  bgX: number;
  bgY: number;
  bgW: number;
  bgH: number;
  src: string;
}

const REST: View = { s: 1, x: 0, y: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * The photo frame of the lightbox with zoom: click or tap to zoom in and out,
 * mouse wheel or pinch to zoom freely, drag to move around, plus an optional
 * hover loupe. The frame keeps the photograph's own proportions and clips
 * everything outside it at any zoom level.
 *
 * Mount it with `key={photo.id}` so every photo starts unzoomed.
 */
export function PhotoZoom({
  ratio,
  zoomedRef,
  children,
}: {
  /** Photograph width / height. */
  ratio: number;
  /** Kept true while the photo is zoomed, so the parent can pause swipe navigation. */
  zoomedRef: MutableRefObject<boolean>;
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>(REST);
  const [view, setView] = useState<View>(REST);
  const [smooth, setSmooth] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loupe, setLoupe] = useState(false);
  const [lens, setLens] = useState<Lens | null>(null);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ downX: 0, downY: 0, moved: false, pinched: false, dist: 0 });

  /** Set the view, keeping the photo covering the whole frame. */
  const apply = useCallback(
    (next: View, animate: boolean) => {
      const el = frameRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = clamp(next.s, 1, MAX_ZOOM);
      const v = s <= 1.001 ? REST : { s, x: clamp(next.x, w - w * s, 0), y: clamp(next.y, h - h * s, 0) };
      viewRef.current = v;
      zoomedRef.current = v.s > 1;
      setSmooth(animate);
      setView(v);
      if (v.s > 1) setLens(null);
    },
    [zoomedRef],
  );

  /** Zoom to `target`, keeping the frame point (cx, cy) under the cursor or finger. */
  const zoomAt = useCallback(
    (target: number, cx: number, cy: number, animate: boolean) => {
      const v = viewRef.current;
      const s = clamp(target, 1, MAX_ZOOM);
      const k = s / v.s;
      apply({ s, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }, animate);
    },
    [apply],
  );

  const zoomCenter = useCallback(
    (target: number) => {
      const el = frameRef.current;
      if (!el) return;
      zoomAt(target, el.clientWidth / 2, el.clientHeight / 2, true);
    },
    [zoomAt],
  );

  useEffect(() => {
    zoomedRef.current = false;
    return () => {
      zoomedRef.current = false;
    };
  }, [zoomedRef]);

  // Wheel zoom needs a non-passive listener so the page behind does not scroll.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
      zoomAt(viewRef.current.s * factor, e.clientX - rect.left, e.clientY - rect.top, false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "+" || e.key === "=") zoomCenter(viewRef.current.s * BUTTON_STEP);
      else if (e.key === "-" || e.key === "_") zoomCenter(viewRef.current.s / BUTTON_STEP);
      else if (e.key === "0") apply(REST, true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apply, zoomCenter]);

  const local = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const updateLens = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const img =
      el.querySelector<HTMLImageElement>(".lightbox__img") ?? el.querySelector<HTMLImageElement>(".lightbox__under");
    const src = img?.currentSrc;
    if (!img || !src) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const p = local(e);
    // The lens stays inside the frame, and it never samples outside the photograph.
    const reach = LENS_RADIUS / LENS_ZOOM;
    const sx = clamp(p.x, Math.min(reach, w / 2), Math.max(w - reach, w / 2));
    const sy = clamp(p.y, Math.min(reach, h / 2), Math.max(h - reach, h / 2));
    setLens({
      left: clamp(p.x, Math.min(LENS_RADIUS, w / 2), Math.max(w - LENS_RADIUS, w / 2)),
      top: clamp(p.y, Math.min(LENS_RADIUS, h / 2), Math.max(h - LENS_RADIUS, h / 2)),
      bgX: LENS_RADIUS - sx * LENS_ZOOM,
      bgY: LENS_RADIUS - sy * LENS_ZOOM,
      bgW: w * LENS_ZOOM,
      bgH: img.getBoundingClientRect().height * LENS_ZOOM,
      src,
    });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (pointers.current.size === 1) {
      g.downX = p.x;
      g.downY = p.y;
      g.moved = false;
      g.pinched = false;
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      g.pinched = true;
      g.dist = Math.hypot(a.x - b.x, a.y - b.y);
      setLens(null);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) {
      if (loupe && e.pointerType === "mouse" && viewRef.current.s === 1) updateLens(e);
      return;
    }
    const p = local(e);
    const g = gesture.current;
    const v = viewRef.current;

    if (pointers.current.size >= 2) {
      const before = [...pointers.current.values()];
      pointers.current.set(e.pointerId, p);
      const after = [...pointers.current.values()];
      const mid = (pts: { x: number; y: number }[]) => ({ x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 });
      const m0 = mid(before);
      const m1 = mid(after);
      const dist = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y);
      if (g.dist > 0) {
        const s = clamp((v.s * dist) / g.dist, 1, MAX_ZOOM);
        const k = s / v.s;
        apply({ s, x: m1.x - (m0.x - v.x) * k, y: m1.y - (m0.y - v.y) * k }, false);
      }
      g.dist = dist;
      return;
    }

    pointers.current.set(e.pointerId, p);
    if (!g.moved && Math.hypot(p.x - g.downX, p.y - g.downY) > TAP_SLOP) {
      g.moved = true;
      if (v.s > 1) setDragging(true);
    }
    if (g.moved && v.s > 1) apply({ s: v.s, x: v.x + p.x - prev.x, y: v.y + p.y - prev.y }, false);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const g = gesture.current;
    if (pointers.current.size > 0) return;
    setDragging(false);
    if (e.type === "pointercancel" || g.moved || g.pinched) return;
    // A plain click or tap: zoom in to that spot, or back out.
    if (viewRef.current.s > 1) apply(REST, true);
    else {
      const p = local(e);
      zoomAt(TAP_ZOOM, p.x, p.y, true);
    }
  };

  const zoomed = view.s > 1;
  const frameClass = [
    "lightbox__crop",
    zoomed ? "is-zoomed" : "",
    dragging ? "is-dragging" : "",
    loupe && !zoomed ? "is-loupe" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className={frameClass}
        onPointerCancel={onPointerUp}
        onPointerDown={onPointerDown}
        onPointerLeave={() => setLens(null)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        ref={frameRef}
        style={{ ["--r" as string]: ratio }}
      >
        <div
          className="lightbox__zoom"
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`,
            transition: smooth ? undefined : "none",
          }}
        >
          {children}
        </div>
        {lens && loupe && !zoomed ? (
          <span
            aria-hidden="true"
            className="lightbox__lens"
            style={{
              left: lens.left,
              top: lens.top,
              width: LENS_RADIUS * 2,
              height: LENS_RADIUS * 2,
              backgroundImage: `url("${lens.src}")`,
              backgroundPosition: `${lens.bgX}px ${lens.bgY}px`,
              backgroundSize: `${lens.bgW}px ${lens.bgH}px`,
            }}
          />
        ) : null}
      </div>
      <div className="lightbox__tools">
        <button
          aria-label="Уменьшить"
          className="lightbox__tool"
          disabled={!zoomed}
          onClick={() => zoomCenter(view.s / BUTTON_STEP)}
          type="button"
        >
          <MagnifyingGlassMinus size={20} weight="bold" />
        </button>
        <button
          aria-label="Увеличить"
          className="lightbox__tool"
          disabled={view.s >= MAX_ZOOM}
          onClick={() => zoomCenter(view.s * BUTTON_STEP)}
          type="button"
        >
          <MagnifyingGlassPlus size={20} weight="bold" />
        </button>
        {zoomed ? (
          <button
            aria-label="Показать фото целиком"
            className="lightbox__tool"
            onClick={() => apply(REST, true)}
            type="button"
          >
            <ArrowsIn size={20} weight="bold" />
          </button>
        ) : (
          <button
            aria-label="Лупа"
            aria-pressed={loupe}
            className="lightbox__tool lightbox__tool--loupe"
            onClick={() => {
              setLoupe((on) => !on);
              setLens(null);
            }}
            type="button"
          >
            <MagnifyingGlass size={20} weight="bold" />
          </button>
        )}
      </div>
    </>
  );
}
