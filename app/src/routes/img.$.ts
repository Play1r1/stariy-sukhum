import { createFileRoute } from "@tanstack/react-router";

import { bindings } from "@/lib/bindings.server";

// Full-size archive photos, served from our own storage. The first request
// copies the image from the PastVu archive into R2; every later request is
// served from R2 (and the browser/CDN cache), so the archive's availability
// no longer affects the site.
const FILE_RE = /^[a-z0-9]\/[a-z0-9]\/[a-z0-9]\/[a-z0-9]{6,40}\.(?:jpe?g|png|webp)$/i;
const CACHE = "public, max-age=31536000, immutable";

function typeFor(file: string) {
  if (/\.png$/i.test(file)) return "image/png";
  if (/\.webp$/i.test(file)) return "image/webp";
  return "image/jpeg";
}

export const Route = createFileRoute("/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const file = String((params as { _splat?: string })._splat ?? "");
        if (!FILE_RE.test(file)) {
          return new Response("Not found", { status: 404 });
        }
        const key = `full/${file}`;
        const bucket = bindings().STORAGE;

        if (bucket) {
          try {
            const hit = await bucket.get(key);
            if (hit) {
              return new Response(hit.body as unknown as ReadableStream, {
                headers: { "Content-Type": typeFor(file), "Cache-Control": CACHE },
              });
            }
          } catch {
            // fall through to the archive
          }
        }

        let upstream: Response | undefined;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            upstream = await fetch(`https://pastvu.com/_p/d/${file}`, {
              headers: { "User-Agent": "Mozilla/5.0 (compatible; StaryiSukhumArchive/1.0)" },
            });
            if (upstream.ok) break;
          } catch {
            upstream = undefined;
          }
        }
        if (!upstream || !upstream.ok) {
          return new Response("Upstream unavailable", { status: 502, headers: { "Cache-Control": "no-store" } });
        }

        const bytes = await upstream.arrayBuffer();
        if (bucket) {
          try {
            await bucket.put(key, bytes, { httpMetadata: { contentType: typeFor(file) } });
          } catch {
            // storing is best effort
          }
        }
        return new Response(bytes, {
          headers: { "Content-Type": typeFor(file), "Cache-Control": CACHE },
        });
      },
    },
  },
});
