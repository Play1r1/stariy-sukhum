import "./archive.css";

/** Small fixed brand mark; the journey route nav lives on the right. */
export function SiteHeader() {
  return (
    <header className="site-header">
      <a aria-label="Старый Сухум, в начало" className="site-header__brand" href="#top">
        <svg aria-hidden="true" className="site-header__mark" viewBox="0 0 40 40">
          <circle cx="20" cy="20" fill="none" r="18.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M27 14.2c-1.6-2.2-4.1-3.4-7-3.4-5.1 0-9 4-9 9.2s3.9 9.2 9 9.2c2.9 0 5.4-1.2 7-3.4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
          <path d="M7 31.5c4.3-2.4 8.7-2.4 13 0s8.7 2.4 13 0" fill="none" stroke="var(--sk-accent)" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
        <span className="site-header__name">Старый Сухум</span>
      </a>
    </header>
  );
}
