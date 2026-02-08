/**
 * Footer.jsx
 *
 * Website footer with brand info, multi-column link sections,
 * and a bottom bar with copyright and legal links.
 */

import { Link } from "react-router-dom";
import styles from "../styles/Footer.module.css";

/**
 * Footer — Site-wide footer rendered at the bottom of every page.
 * @returns {JSX.Element} The footer element
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        {/* ── Top: Brand + Link Columns ── */}
        <div className={styles.top}>

          {/* Brand column */}
          <div className={styles.brand}>
            <div className={styles.brandLogo}>
              <span className={styles.logoMark}>V</span>
              <span className={styles.brandName}>Vantage</span>
            </div>
            <p className={styles.brandDesc}>
              The smart task manager that keeps your business moving.
              Complete a task, and smarter follow-ups appear instantly.
            </p>
          </div>

          {/* Product column */}
          <div className={styles.column}>
            <h4>Product</h4>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#">Chrome Extension</a></li>
            </ul>
          </div>

          {/* Company column */}
          <div className={styles.column}>
            <h4>Company</h4>
            <ul>
              <li><Link to="/contact">About</Link></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Resources column */}
          <div className={styles.column}>
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">API</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className={styles.bottom}>
          <span className={styles.copyright}>
            &copy; {year} Vantage. All rights reserved.
          </span>
          <div className={styles.bottomLinks}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
