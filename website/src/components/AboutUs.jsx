/**
 * AboutUs.jsx
 *
 * "Contact Us" section showcasing the founder / team behind Vantage.
 * Displays a profile card with name, role, short bio, and a
 * LinkedIn link so visitors can reach out directly.
 * Uses the scroll-reveal hook for a fade-in entrance animation
 * consistent with other landing-page sections.
 */

import { FaLinkedin } from "react-icons/fa";
import useScrollReveal from "../hooks/useScrollReveal";
import styles from "../styles/AboutUs.module.css";

/**
 * AboutUs — Contact / founder spotlight section rendered on the landing page.
 *
 * @returns {JSX.Element} The Contact Us section with a profile card
 */
export default function AboutUs() {
  /* Scroll-reveal ref — triggers fade-in when section enters viewport */
  const [sectionRef, isRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <section
      id="contact"
      ref={sectionRef}
      className={`${styles.section} reveal ${isRevealed ? "revealed" : ""}`}
    >
      {/* ── Section heading ── */}
      <div className={styles.header}>
        <span className="section-label">Contact Us</span>
        <h2 className="section-title">Get in Touch</h2>
        <p className="section-subtitle">
          Have questions or want to connect? Reach out to the person behind
          Vantage — always happy to chat.
        </p>
      </div>

      {/* ── Founder card — entire card links to LinkedIn ── */}
      <div className={styles.cardWrapper}>
        <a
          href="https://www.linkedin.com/in/ethan-peterson2"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.card}
          aria-label="Visit Ethan Peterson's LinkedIn profile"
        >
          {/* Avatar with initials fallback */}
          <div className={styles.avatar}>
            <span className={styles.initials}>EP</span>
          </div>

          {/* Info */}
          <h3 className={styles.name}>Ethan Peterson</h3>
          <p className={styles.role}>Founder &amp; Developer</p>
          <p className={styles.bio}>
            Building tools that help people stay productive and organized.
            Vantage was born from the idea that finishing a task should
            instantly surface the next smart step — so momentum never stops.
          </p>

          {/* LinkedIn button (visual only — the wrapping <a> handles navigation) */}
          <span className={styles.linkedin}>
            <FaLinkedin className={styles.linkedinIcon} />
            <span>Connect on LinkedIn</span>
          </span>
        </a>
      </div>
    </section>
  );
}
