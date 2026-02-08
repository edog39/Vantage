/**
 * Hero.jsx
 *
 * Hero section at the top of the landing page.
 * Features a large headline with gradient accent text,
 * a supporting paragraph, dual CTA buttons, and a subtle
 * gradient/grid background effect.
 */

import styles from "../styles/Hero.module.css";

/**
 * Hero — Full-viewport introductory section with headline and CTAs.
 * @returns {JSX.Element} The hero section
 */
export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>

        {/* ── Badge ── */}
        <div className={styles.badge}>
          <span className={styles.badgeDot}></span>
          Now in public beta
        </div>

        {/* ── Headline ── */}
        <h1 className={styles.headline}>
          Run Your Business{" "}
          <span className={styles.headlineAccent}>on Autopilot</span>
        </h1>

        {/* ── Subtext ── */}
        <p className={styles.subtext}>
          Vantage generates an endless stream of actionable tasks across every
          department — marketing, sales, operations, and beyond. Complete one,
          and smarter follow-ups appear instantly.
        </p>

        {/* ── CTA Buttons ── */}
        <div className={styles.buttons}>
          <a href="#cta" className="btn-primary">
            Get Started Free
          </a>
          <a href="#services" className="btn-secondary">
            Explore Services
          </a>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div className={styles.scrollIndicator}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}
