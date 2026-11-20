import { archiveAuthors, archiveDecades, archiveTotal } from "@/archive-summary";
import { photoDirect, photoThumb } from "@/lib/archive-types";

import { ArchiveImg } from "./archive-img";

import "./archive.css";

const collageDecades = [1910, 1950, 1970];

/** Split section: where the photographs come from, with a small print collage. */
export function AboutArchive() {
  const prints = collageDecades
    .map((dec) => archiveDecades.find((d) => d.decade === dec)?.cover)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section aria-labelledby="about-title" className="about" id="about">
      <div className="about__copy">
        <h2 className="about__title" id="about-title">
          Откуда эти снимки
        </h2>
        <p className="about__text">
          Все {archiveTotal} фотографий собраны из открытого архива ретро-фотографий PastVu, где каждый кадр
          привязан к месту на карте и году съёмки. Подписи взяты из карточек архива: название места, год, автор
          снимка и источник скана.
        </p>
        <p className="about__text">
          Среди авторов Дмитрий Ермаков, Сергей Прокудин-Горский, Семён Фридлянд, фотографы открыточных
          издательств и десятки семейных архивов. Если автор не установлен, мы так и пишем.
        </p>
        <dl className="about__stats">
          <div>
            <dt>Снимков</dt>
            <dd>{archiveTotal}</dd>
          </div>
          <div>
            <dt>Десятилетий</dt>
            <dd>{archiveDecades.length}</dd>
          </div>
          <div>
            <dt>Известных авторов</dt>
            <dd>{archiveAuthors}</dd>
          </div>
        </dl>
        <a className="source-link" href="https://pastvu.com" rel="noopener noreferrer" target="_blank">
          pastvu.com
        </a>
      </div>
      <div aria-hidden="true" className="about__collage">
        {prints.map((p, i) => (
          <figure className={`about__print about__print--${i + 1}`} key={p.id}>
            <ArchiveImg alt="" sources={[photoThumb(p), photoDirect(p)]} />
            <figcaption>{p.y}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer__name">Старый Сухум</p>
      <p className="site-footer__note">
        Фотографии принадлежат их авторам и правообладателям, данные и сканы из архива PastVu.
      </p>
      <a className="site-footer__top" href="#top">
        Наверх
      </a>
    </footer>
  );
}
