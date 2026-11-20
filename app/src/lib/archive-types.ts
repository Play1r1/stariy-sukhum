/** One archival photograph, compact keys to keep the data file small. */
export interface ArchivePhoto {
  /** PastVu record id (pastvu.com/p/<id>) */
  id: number;
  /** PastVu file path */
  f: string;
  /** Title: place / subject */
  t: string;
  /** Date label as written in the archive (e.g. "1958" or "1900-1910") */
  y: string;
  /** Photographer, empty when unknown */
  a: string;
  /** Source of the scan */
  s: string;
  /** Description */
  d: string;
  /** Address */
  ad: string;
  /** Archive contributor who uploaded the scan */
  u: string;
  /** Aspect ratio w/h */
  r: number;
}

export interface ArchiveDecadeSummary {
  decade: number;
  count: number;
  cover: ArchivePhoto;
  strip: ArchivePhoto[];
}

/** decade (as string) -> photos, chronological */
export type ArchiveData = Record<string, ArchivePhoto[]>;

/** Self-hosted 560px thumbnail, same origin. */
export function photoThumb(photo: Pick<ArchivePhoto, "id">) {
  return `/p/${photo.id}.webp`;
}

/** Full-size image through our own storage. */
export function photoFull(photo: Pick<ArchivePhoto, "f">) {
  return `/img/${photo.f}`;
}

/** Direct archive URL, last-resort fallback. */
export function photoDirect(photo: Pick<ArchivePhoto, "f">) {
  return `https://pastvu.com/_p/d/${photo.f}`;
}

export function photoRecord(photo: Pick<ArchivePhoto, "id">) {
  return `https://pastvu.com/p/${photo.id}`;
}

export function decadeLabel(decade: number) {
  return `${decade}-е`;
}

export function authorLabel(photo: Pick<ArchivePhoto, "a">) {
  return photo.a ? photo.a : "Автор неизвестен";
}

export const decadeNotes: Record<number, string> = {
  1870: "Сухум-Кале после Кавказской войны: крепость, рейд и первые снимки Дмитрия Ермакова.",
  1880: "Портовый городок у рейда: маяк на мысу, пристань и первые улицы у крепости.",
  1890: "Город растёт вдоль бухты, у берега появляется железная пристань.",
  1900: "Курортная эпоха: дачи, гостиницы, набережная и открытки с видами Сухума.",
  1910: "Бухта, ботанический сад и цветные снимки Прокудина-Горского 1912 года.",
  1920: "Сухум советской Абхазии: санатории и новые здравницы на берегу.",
  1930: "Новые гостиницы, «Рица» и набережная в довоенном облике.",
  1940: "Военные и первые послевоенные годы, гостиница «Абхазия» у моря.",
  1950: "Золотое десятилетие курорта: колоннады, пальмы, пляжи и тысячи отдыхающих.",
  1960: "Кафе «Амра», прогулки по набережной и новый облик центра.",
  1970: "Пляжи, семейные альбомы и курортная жизнь, снятая уже в цвете.",
  1980: "Ресторан «Диоскурия», морской вокзал и последние спокойные годы.",
  1990: "Снимки 1990-1992 годов, последние кадры старого города.",
};
