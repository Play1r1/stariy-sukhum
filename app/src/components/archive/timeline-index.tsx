import { archiveDecades, archiveTotal } from "@/archive-summary";
import { decadeLabel, decadeNotes, photoDirect, photoThumb } from "@/lib/archive-types";

import { ArchiveImg } from "./archive-img";
import "./archive.css";

/** Vertical table of contents: one row per decade along a single time line. */
export function TimelineIndex() {
  const first = archiveDecades[0]?.decade ?? 1870;
  return (
    <section aria-labelledby="timeline-title" className="vindex" id="timeline">
      <div className="vindex__head">
        <h2 className="vindex__title" id="timeline-title">
          Сто двадцать лет в одном альбоме
        </h2>
        <p className="vindex__lede">
          {archiveTotal} снимков с {first}-х по 1992 год. Выберите десятилетие, чтобы перейти к его странице альбома.
        </p>
      </div>
      <ol className="vindex__list">
        {archiveDecades.map((d) => (
          <li className="vindex__row" key={d.decade}>
            <a className="vindex__link" href={`#d${d.decade}`}>
              <span aria-hidden="true" className="vindex__dot" />
              <span className="vindex__year">{decadeLabel(d.decade)}</span>
              <span className="vindex__text">
                <span className="vindex__note">{decadeNotes[d.decade]}</span>
                <span className="vindex__count">{d.count} фото</span>
              </span>
              <span aria-hidden="true" className="vindex__prints">
                {[d.cover, ...d.strip].slice(0, 4).map((p, i) => (
                  <span className="vindex__print" key={p.id} style={{ ["--i" as string]: i }}>
                    <ArchiveImg alt="" className="vindex__img" sources={[photoThumb(p), photoDirect(p)]} />
                  </span>
                ))}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
