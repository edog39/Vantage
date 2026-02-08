/**
 * Navbar.jsx
 *
 * Sticky top navigation bar with glass-morphism background.
 * Contains the Vantage logo, navigation links, and a "Get Started"
 * CTA button.
 *
 * All links use React Router's Link component so that navigation
 * stays within the SPA. Hash-based links (e.g. "/#pricing") are
 * handled by the ScrollHandler in App.jsx, which smooth-scrolls
 * to the matching section on the home page.
 */

import { Link } from "react-router-dom";
import styles from "../styles/Navbar.module.css";

/**
 * Navbar — Fixed navigation bar rendered at the top of every page.
 * Every link uses React Router <Link> for consistent SPA navigation.
 * Hash links (/#services, /#pricing, /#cta) navigate to the home page
 * and scroll to the corresponding section via ScrollHandler in App.jsx.
 *
 * @returns {JSX.Element} The navbar element
 */
export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>

        {/* ── Logo — navigates to home page via React Router ── */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>V</span>
          <span className={styles.logoText}>Vantage</span>
        </Link>

        {/* ── Navigation Links ── */}
        <div className={styles.navLinks}>
          <Link to="/#services" className={styles.navLink}>Services</Link>
          {/* Features lives on its own page at /features */}
          <Link to="/features" className={styles.navLink}>Features</Link>
          <Link to="/#pricing" className={styles.navLink}>Pricing</Link>
          {/* Contact lives on its own page at /contact */}
          <Link to="/contact" className={styles.navLink}>Contact</Link>
        </div>

        {/* ── CTA Button ── */}
        <Link to="/login" className={styles.cta}>Get Started</Link>

      </div>
    </nav>
  );
}
