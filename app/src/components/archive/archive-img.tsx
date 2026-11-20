import { useState, type CSSProperties } from "react";

/**
 * <img> with a fallback chain: if a source fails, the next one is tried, so a
 * single unavailable server never leaves a broken picture. The fallback index
 * is tied to the source list, so a new photo always starts from its first source.
 */
export function ArchiveImg({
  sources,
  alt,
  className,
  style,
  eager,
  onLoad,
}: {
  sources: string[];
  alt: string;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
  onLoad?: () => void;
}) {
  const key = sources.join("|");
  const [fail, setFail] = useState<{ key: string; index: number }>({ key, index: 0 });
  const index = fail.key === key ? fail.index : 0;
  const src = sources[Math.min(index, sources.length - 1)];

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      onError={() => {
        if (index < sources.length - 1) setFail({ key, index: index + 1 });
      }}
      onLoad={onLoad}
      referrerPolicy="no-referrer"
      src={src}
      style={style}
    />
  );
}
