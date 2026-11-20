import { ArrowDown } from "@phosphor-icons/react/dist/ssr";

import "./archive.css";

/** Hero CTA: terracotta underline that slides in, arrow nudges down. */
export function HeroCta() {
  return (
    <a className="hero-cta" href="#timeline">
      <span className="hero-cta__label">К таймлайну</span>
      <span aria-hidden="true" className="hero-cta__arrow">
        <ArrowDown size={18} weight="bold" />
      </span>
    </a>
  );
}
