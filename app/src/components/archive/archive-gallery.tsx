import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ListBullets,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react/dist/ssr";

import { archiveDecades } from "@/archive-summary";
import {
  type ArchiveData,
  type ArchiveDecadeSummary,
  type ArchivePhoto,
  authorLabel,
  decadeLabel,
  decadeNotes,
  photoDirect,
  photoFull,
  photoRecord,
  photoThumb,
} from "@/lib/archive-types";

import { scrollToId } from "@/lib/scroll-to";

import { ArchiveImg } from "./archive-img";
import "./archive.css";

interface LightboxState {
  items: ArchivePhoto[];
  index: number;
}

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready"; data: ArchiveData };

/** Loads the whole archive (one same-origin JSON file) with retries. */
function useArchive() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setState({ status: "loading" });
      for (let i = 0; i < 4; i++) {
        try {
          const res = await fetch("/data/archive.json", { cache: i === 0 ? "default" : "reload" });
          if (!res.ok) throw new Error(String(res.status));
          const data = (await res.json()) as ArchiveData;
          if (!cancelled) setState({ status: "ready", data });
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 800 * (i + 1)));
        }
      }
      if (!cancelled) setState({ status: "error" });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { state, retry: () => setAttempt((a) => a + 1) };
}

/** Column count by viewport width (SSR default 3). */
function useColumns() {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const queries: [MediaQueryList, number][] = [
      [window.matchMedia("(min-width: 1400px)"), 4],
      [window.matchMedia("(min-width: 900px)"), 3],
      [window.matchMedia("(min-width: 480px)"), 2],
    ];
    const update = () => setCols(queries.find(([q]) => q.matches)?.[1] ?? 1);
    update();
    queries.forEach(([q]) => q.addEventListener("change", update));
    return () => queries.forEach(([q]) => q.removeEventListener("change", update));
  }, []);
  return cols;
}

/** Vertical timeline of decades with every photo, rail navigation and lightbox. */
export function ArchiveGallery() {
  const { state, retry } = useArchive();
  const cols = useColumns();
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [active, setActive] = useState<number>(archiveDecades[0]?.decade ?? 0);
  const [inView, setInView] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const rootRef = useRef<HTMLDivElement>(null);

  // Search across place, author, address, description and year.
  const filtered = useMemo(() => {
    if (state.status !== "ready") return null;
    const q = deferredQuery.trim().toLowerCase().replace(/ё/g, "е");
    if (!q) return state.data;
    const words = q.split(/\s+/).filter(Boolean);
    const out: ArchiveData = {};
    for (const [dec, list] of Object.entries(state.data)) {
      out[dec] = list.filter((p) => {
        const hay = `${p.t} ${p.a} ${p.ad} ${p.d} ${p.y} ${p.s}`.toLowerCase().replace(/ё/g, "е");
        return words.every((w) => hay.includes(w));
      });
    }
    return out;
  }, [state, deferredQuery]);

  const searching = deferredQuery.trim().length > 0;
  const visibleDecades = archiveDecades.filter((d) => !filtered || !searching || (filtered[String(d.decade)]?.length ?? 0) > 0);
  const visibleKey = visibleDecades.map((d) => d.decade).join(",");
  const found = filtered && searching ? Object.values(filtered).reduce((n, l) => n + l.length, 0) : null;

  useEffect(() => {
    const nodes = archiveDecades
      .map((d) => document.getElementById(`d${d.decade}`))
      .filter((n): n is HTMLElement => Boolean(n));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const dec = Number(e.target.getAttribute("data-decade"));
            if (dec) setActive(dec);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    const root = rootRef.current;
    const io2 = new IntersectionObserver(([e]) => setInView(Boolean(e?.isIntersecting)), {
      rootMargin: "-30% 0px -30% 0px",
    });
    if (root) io2.observe(root);
    return () => {
      io.disconnect();
      io2.disconnect();
    };
  }, [visibleKey]);

  // A shared link like /#d1950 must land on its decade once the photos exist.
  const ready = state.status === "ready";
  useEffect(() => {
    if (!ready) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (/^d\d{4}$/.test(id) || id === "timeline" || id === "about") {
      scrollToId(id, { updateHash: false });
    }
  }, [ready]);

  // Close the decade sheet with Escape.
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const open = useCallback((items: ArchivePhoto[], index: number) => {
    setLightbox({ items, index });
  }, []);

  return (
    <div className="vt" data-rail={inView ? "on" : "off"} id="gallery" ref={rootRef}>
      <nav aria-label="Десятилетия" className="vt-rail">
        <ol className="vt-rail__list">
          {visibleDecades.map((d) => (
            <li key={d.decade}>
              <a aria-current={active === d.decade ? "true" : undefined} className="vt-rail__link" href={`#d${d.decade}`}>
                <span aria-hidden="true" className="vt-rail__tick" />
                <span>{d.decade}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <button
        aria-expanded={sheet}
        className="vt-fab"
        onClick={() => setSheet((s) => !s)}
        type="button"
      >
        <ListBullets aria-hidden="true" size={18} weight="bold" />
        <span>{active}</span>
      </button>
      {sheet ? (
        <div className="vt-sheet" role="dialog" aria-label="Десятилетия">
          <button aria-label="Закрыть" className="vt-sheet__backdrop" onClick={() => setSheet(false)} type="button" />
          <ol className="vt-sheet__list">
            <li>
              <a className="vt-sheet__link vt-sheet__link--top" href="#timeline" onClick={() => setSheet(false)}>
                <span className="vt-sheet__count">К оглавлению</span>
              </a>
            </li>
            {visibleDecades.map((d) => (
              <li key={d.decade}>
                <a
                  aria-current={active === d.decade ? "true" : undefined}
                  className="vt-sheet__link"
                  href={`#d${d.decade}`}
                  onClick={() => setSheet(false)}
                >
                  <span className="vt-sheet__year">{decadeLabel(d.decade)}</span>
                  <span className="vt-sheet__count">{filtered && searching ? (filtered[String(d.decade)]?.length ?? 0) : d.count}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="vt-search" role="search">
        <label className="vt-search__label" htmlFor="archive-search">
          Поиск по месту, автору или году
        </label>
        <div className="vt-search__field">
          <span aria-hidden="true" className="vt-search__icon">
            <MagnifyingGlass size={18} weight="bold" />
          </span>
          <input
            autoComplete="off"
            className="vt-search__input"
            enterKeyHint="search"
            id="archive-search"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: набережная, Ермаков, 1912"
            type="search"
            value={query}
          />
          {query ? (
            <button aria-label="Очистить поиск" className="vt-search__clear" onClick={() => setQuery("")} type="button">
              <X size={16} weight="bold" />
            </button>
          ) : null}
        </div>
        <p aria-live="polite" className="vt-search__status">
          {state.status === "loading"
            ? "Загружаем архив"
            : found === null
              ? `${archiveDecades.reduce((n, d) => n + d.count, 0)} фотографий`
              : found === 0
                ? "Ничего не найдено"
                : `Найдено: ${found}`}
        </p>
      </div>

      {state.status === "error" ? (
        <div className="vt-error" role="alert">
          <p>Не удалось загрузить список фотографий. Проверьте соединение.</p>
          <button className="vt-error__retry" onClick={retry} type="button">
            Повторить
          </button>
        </div>
      ) : null}

      {visibleDecades.map((d) => (
        <DecadeSection
          cols={cols}
          decade={d}
          items={filtered ? (filtered[String(d.decade)] ?? []) : null}
          key={d.decade}
          onOpen={open}
        />
      ))}

      {lightbox ? (
        <Lightbox
          onClose={() => setLightbox(null)}
          onIndex={(index) => setLightbox((s) => (s ? { ...s, index } : s))}
          state={lightbox}
        />
      ) : null}
    </div>
  );
}

function DecadeSection({
  decade,
  items,
  cols,
  onOpen,
}: {
  decade: ArchiveDecadeSummary;
  items: ArchivePhoto[] | null;
  cols: number;
  onOpen: (items: ArchivePhoto[], index: number) => void;
}) {
  // Shortest-column masonry: keeps chronological order reading left to right.
  const columns = useMemo(() => {
    if (!items) return null;
    const out: { photo: ArchivePhoto; index: number }[][] = Array.from({ length: cols }, () => []);
    const heights = new Array<number>(cols).fill(0);
    items.forEach((photo, index) => {
      let c = 0;
      for (let i = 1; i < cols; i++) if (heights[i] < heights[c] - 0.05) c = i;
      out[c].push({ photo, index });
      heights[c] += 1 / Math.min(3, Math.max(0.35, photo.r)) + 0.34;
    });
    return out;
  }, [items, cols]);

  return (
    <section aria-labelledby={`t${decade.decade}`} className="vt-decade" data-decade={decade.decade} id={`d${decade.decade}`}>
      <span aria-hidden="true" className="vt-decade__dot" />
      <header className="vt-decade__aside">
        <p aria-hidden="true" className="vt-decade__numeral">
          {decade.decade}
        </p>
        <h2 className="vt-decade__title" id={`t${decade.decade}`}>
          {decadeLabel(decade.decade)}
        </h2>
        <p className="vt-decade__note">{decadeNotes[decade.decade]}</p>
        <p className="vt-decade__count">
          {items && items.length !== decade.count ? `${items.length} из ${decade.count} фотографий` : `${decade.count} фотографий`}
        </p>
      </header>

      <div className="vt-decade__photos">
        {columns ? (
          <div className="vt-grid" style={{ ["--cols" as string]: cols }}>
            {columns.map((col, ci) => (
              <ul className="vt-grid__col" key={ci}>
                {col.map(({ photo, index }) => (
                  <li key={photo.id}>
                    <PhotoCard onOpen={() => items && onOpen(items, index)} photo={photo} />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ) : (
          <div aria-hidden="true" className="vt-grid" style={{ ["--cols" as string]: cols }}>
            {Array.from({ length: cols }).map((_, ci) => (
              <div className="vt-grid__col" key={ci}>
                {Array.from({ length: Math.min(2, Math.ceil(decade.count / cols)) }).map((__, i) => (
                  <div className="photo-skeleton" key={i} style={{ aspectRatio: (ci + i) % 2 ? "4 / 3" : "3 / 4" }} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PhotoCard({ photo, onOpen }: { photo: ArchivePhoto; onOpen: () => void }) {
  return (
    <figure className="photo">
      <button
        aria-label={`Открыть: ${photo.t}, ${photo.y}`}
        className="photo__frame"
        onClick={onOpen}
        style={{ aspectRatio: String(Math.min(3, Math.max(0.35, photo.r))) }}
        type="button"
      >
        <ArchiveImg alt={photo.t} className="photo__img" sources={[photoThumb(photo), photoFull(photo), photoDirect(photo)]} />
      </button>
      <figcaption className="photo__caption">
        <span className="photo__place">{photo.t}</span>
        <span className="photo__line">
          <span className="photo__year">{photo.y}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function Lightbox({
  state,
  onClose,
  onIndex,
}: {
  state: LightboxState;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const { items, index } = state;
  const photo = items[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const loaded = loadedId === photo?.id;
  const touch = useRef<number | null>(null);

  const prev = useCallback(() => onIndex((index - 1 + items.length) % items.length), [index, items.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    // Warm the neighbours so arrows feel instant.
    for (const n of [items[(index + 1) % items.length], items[(index - 1 + items.length) % items.length]]) {
      if (n) {
        const img = new Image();
        img.src = photoFull(n);
      }
    }
  }, [index, items]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, onClose, prev]);

  if (!photo) return null;

  return (
    <div aria-label={photo.t} aria-modal="true" className="lightbox" role="dialog">
      <button aria-label="Закрыть" className="lightbox__backdrop" onClick={onClose} tabIndex={-1} type="button" />
      <div className="lightbox__sheet">
        <div
          className="lightbox__stage"
          onTouchEnd={(e) => {
            const start = touch.current;
            const end = e.changedTouches[0]?.clientX;
            touch.current = null;
            if (start == null || end == null) return;
            if (end - start > 50) prev();
            else if (start - end > 50) next();
          }}
          onTouchStart={(e) => {
            touch.current = e.touches[0]?.clientX ?? null;
          }}
        >
          {!loaded ? <span aria-hidden="true" className="lightbox__loading" /> : null}
          {/* The frame has the photograph's own proportions and clips anything
              below it, so the archive's caption strip under the scan is never shown. */}
          <div className="lightbox__crop" style={{ ["--r" as string]: photo.r }}>
            <ArchiveImg
              alt=""
              className="lightbox__under"
              eager
              sources={[photoThumb(photo), photoDirect(photo)]}
            />
            <ArchiveImg
              alt={photo.t}
              className="lightbox__img"
              eager
              onLoad={() => setLoadedId(photo.id)}
              sources={[photoFull(photo), photoDirect(photo), photoThumb(photo)]}
              style={{ opacity: loaded ? 1 : 0 }}
            />
          </div>
          <button aria-label="Предыдущий снимок" className="lightbox__nav lightbox__nav--prev" onClick={prev} type="button">
            <ArrowLeft size={22} weight="bold" />
          </button>
          <button aria-label="Следующий снимок" className="lightbox__nav lightbox__nav--next" onClick={next} type="button">
            <ArrowRight size={22} weight="bold" />
          </button>
        </div>
        <aside className="lightbox__info">
          <button aria-label="Закрыть" className="lightbox__close" onClick={onClose} ref={closeRef} type="button">
            <X size={20} weight="bold" />
          </button>
          <p className="lightbox__year">{photo.y}</p>
          <h3 className="lightbox__title">{photo.t}</h3>
          <dl className="lightbox__facts">
            <div>
              <dt>Место</dt>
              <dd>{photo.ad ? `${photo.t}, ${photo.ad}` : photo.t}</dd>
            </div>
            <div>
              <dt>Автор снимка</dt>
              <dd>{authorLabel(photo)}</dd>
            </div>
          </dl>
          {photo.d ? <p className="lightbox__desc">{photo.d}</p> : null}
          <a className="record-link" href={photoRecord(photo)} rel="noopener noreferrer" target="_blank">
            <span>Открыть в архиве</span>
            <ArrowUpRight aria-hidden="true" size={16} weight="bold" />
          </a>
          <p className="lightbox__pos">
            {index + 1} / {items.length}
          </p>
        </aside>
      </div>
    </div>
  );
}
