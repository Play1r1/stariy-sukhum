# Design brief: Старый Сухум (фотоархив)

**Design read:** for people who love Sukhum, its diaspora and history lovers; register is warm, sunlit nostalgia, a family album of a whole city, never mournful.

**Concept spine:** "Городской альбом". The site is a living photo album: the film opens on scattered prints on a sunlit table and pushes into one of them, the city comes alive, then the visitor leafs through the album decade by decade along a timeline ribbon.

**Delivery tier:** cinema (Lenis-free, native scroll; scroll-scrub film as Tier-1).

**Locked palette (Terracotta + Slate, light):**
- paper `#FFF6EE` (sunlit apricot white, the album page)
- panel `#F9E5D3` (warm peach card ground)
- ink `#2E3338` (slate, from sea-stone and old ink)
- muted `#736A64`
- accent `#C4553B` (Sukhum roof-tile terracotta), the only accent
Defense: warm, light and Mediterranean as the user asked; terracotta roofs and sea-slate are the city's real materials; avoids beige+brass and dark+orange bans.

**Locked type:** Onest (display + body, modern Cyrillic grotesk, tight tracking) + JetBrains Mono (dates, captions metadata). Cormorant Garamond italic ONLY for the giant decade numerals. Justification: this is a genuine heritage archive (1870s to 1990s); the serif numerals echo handwritten album years.

Animation mode: animated-website

**Journey shape:** single-shot. One subject seen ever more closely: the album table turns into the living city.
**Journey (chapters over one film):**
1. "Старый Сухум" : prints on a sunlit table. Body: more than two thousand photographs, 1870s to 1990s.
2. "Город у моря" : camera glides over postcards of the embankment and palms.
3. "Каждый снимок подписан" : push toward one sepia print.
4. "Листайте по десятилетиям" : the print becomes a living golden-hour embankment view; CTA to the timeline.
**World grammar:** warm late-afternoon sun from the left, soft shadows, sepia and peach prints, slate-blue sea, terracotta accents, shallow depth of field, 35mm look, no text on prints.
**Mobile framing:** subject center-safe; copy sits on a soft paper scrim.
**Delivery budget:** <=32 MiB desktop, <=16 MiB mobile.

**Section plan:**
1. Journey (scroll-scrub, 4 chapters)
2. Decade index: vertical timeline (rows on a terracotta line: numeral, note, print stack) (user asked for vertical timelines)
3. Gallery: vertical timeline, every photo shown; sticky decade aside on the line + masonry; vertical decade rail (desktop) / floating decade sheet (tablet, phone). Thumbnails self-hosted, full size cached in R2.
4. Lightbox: full photo + place, author, source, year, link to the archive record
5. About the archive / credits: split text + collage (split family)
6. Footer

**Asset plan:** storyboard (1 image), film (1 Seedance clip, desktop+mobile encodes, posters), launch branding (cover, OG, favicon). Content imagery: real archival photos from PastVu (pastvu.com), credited per photo. Functional UI icons from Phosphor (dense functional UI: close, arrows).

**CTA inventory:**
- "К таймлайну" (hero): terracotta underline that slides, arrow nudges.
- Decade chips in the ribbon: photo-tab with tilt on hover.
- "Показать ещё" in each decade: wide paper strip with a counter.
- Lightbox "Открыть в архиве": mono text link with outward arrow.
