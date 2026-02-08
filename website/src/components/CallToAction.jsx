/**
 * CallToAction.jsx
 *
 * Full-width gradient CTA banner section near the bottom of
 * the landing page. Encourages visitors to sign up with a
 * prominent headline and action button.
 */

import { Link } from "react-router-dom";
import styles from "../styles/CallToAction.module.css";

/**
 * CallToAction — Bottom-of-page conversion banner.
 * @returns {JSX.Element} The CTA section
 */
export default function CallToAction() {
  return (
    <section id="cta" className={styles.section}>
      <div className={styles.content}>
        <h2 className={styles.headline}>
          Ready to never run out of tasks?
        </h2>
        <p className={styles.subtext}>
          Join thousands of businesses using Vantage to stay productive,
          organized, and always one step ahead.
        </p>
        <Link to="/login" className="btn-primary">
          Get Started Free
        </Link>
      </div>
    </section>
  );
}
