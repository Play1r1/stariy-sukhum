import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { ScrollScrub } from "@/components/scroll-scrub/scroll-scrub";
import { SiteHeader } from "@/components/archive/site-header";
import { TimelineIndex } from "@/components/archive/timeline-index";
import { ArchiveGallery } from "@/components/archive/archive-gallery";
import { AboutArchive, SiteFooter } from "@/components/archive/about-archive";
import { scrollScrubScenes, scrollScrubTheme } from "@/scroll-scrub-scenes";
import { installAnchorScroll } from "@/lib/scroll-to";

export const Route = createFileRoute("/")({
  component: Index,
});

// The film opens the album; the decades follow in ordinary semantic flow.
function Index() {
  useEffect(() => installAnchorScroll(), []);

  return (
    <main className="sukhum" id="top">
      <SiteHeader />
      <ScrollScrub scenes={scrollScrubScenes} theme={scrollScrubTheme} />
      <TimelineIndex />
      <ArchiveGallery />
      <AboutArchive />
      <SiteFooter />
    </main>
  );
}
