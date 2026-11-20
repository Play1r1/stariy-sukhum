/**
 * Scene data for the scroll-scrub journey. Single-shot: one continuous film
 * (sunlit album table that turns into the living embankment).
 * Keep this array a module constant.
 */
import { createElement } from "react";

import type {
  ScrollScrubScene,
  ScrollScrubTheme,
} from "@/components/scroll-scrub/scroll-scrub";
import { HeroCta } from "@/components/archive/hero-cta";
import { archiveTotal } from "@/archive-summary";

/** Brand tokens for the journey layer (design brief palette). */
export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#C4553B",
  background: "#FFF6EE",
  ink: "#2E3338",
  muted: "#5F5853",
};

export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    actions: createElement(HeroCta),
    body: `${archiveTotal} фотографий города у моря, от 1870-х до 1992 года. У каждого снимка подписаны место и автор.`,
    clip: "/assets/world/scene-01.mp4",
    id: "scene-01",
    kicker: "Фотоархив города",
    label: "Альбом",
    linger: 0.2,
    mobileClip: "/assets/world/scene-01-mobile.mp4",
    mobileObjectPosition: "55% 50%",
    mobilePoster: "/assets/world/scene-01-mobile-poster.png",
    poster: "/assets/world/scene-01-poster.png",
    scroll: 4,
    title: "Старый Сухум",
  },
];
