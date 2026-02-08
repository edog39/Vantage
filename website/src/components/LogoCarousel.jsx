/**
 * LogoCarousel.jsx
 *
 * Infinite horizontal scrolling logo carousel showing real company
 * brand icons alongside their names. Two rows scroll in opposite
 * directions for a dynamic visual effect. Uses pure CSS keyframe
 * animation — each row's logo set is duplicated in the DOM so the
 * scroll loops seamlessly. The carousel never pauses.
 *
 * Brand icons are sourced from the react-icons Simple Icons set.
 */

import styles from "../styles/LogoCarousel.module.css";

/* ── Brand icon imports from react-icons/si (Simple Icons) ── */
import {
  SiOpenai,
  SiStripe,
  SiNotion,
  SiSlack,
  SiVercel,
  SiShopify,
  SiFigma,
  SiLinear,
  SiDiscord,
  SiSpotify,
  SiGithub,
  SiAirbnb,
  SiDropbox,
  SiAtlassian,
  SiTwilio,
  SiHubspot,
  SiDatadog,
  SiCloudflare,
  SiMongodb,
  SiCanva
} from "react-icons/si";

/* ══════════════════════════════════════
   Logo Data
   Each entry pairs a react-icons component with the company name.
   ══════════════════════════════════════ */

/**
 * First carousel row — scrolls left.
 * @type {Array<{Icon: React.ComponentType, name: string}>}
 */
const ROW_1 = [
  { Icon: SiOpenai,   name: "OpenAI" },
  { Icon: SiStripe,   name: "Stripe" },
  { Icon: SiNotion,   name: "Notion" },
  { Icon: SiSlack,    name: "Slack" },
  { Icon: SiVercel,   name: "Vercel" },
  { Icon: SiShopify,  name: "Shopify" },
  { Icon: SiFigma,    name: "Figma" },
  { Icon: SiLinear,   name: "Linear" },
  { Icon: SiDiscord,  name: "Discord" },
  { Icon: SiSpotify,  name: "Spotify" }
];

/**
 * Second carousel row — scrolls right.
 * @type {Array<{Icon: React.ComponentType, name: string}>}
 */
const ROW_2 = [
  { Icon: SiGithub,     name: "GitHub" },
  { Icon: SiAirbnb,     name: "Airbnb" },
  { Icon: SiDropbox,    name: "Dropbox" },
  { Icon: SiAtlassian,  name: "Atlassian" },
  { Icon: SiTwilio,     name: "Twilio" },
  { Icon: SiHubspot,    name: "HubSpot" },
  { Icon: SiDatadog,    name: "Datadog" },
  { Icon: SiCloudflare, name: "Cloudflare" },
  { Icon: SiMongodb,    name: "MongoDB" },
  { Icon: SiCanva,      name: "Canva" }
];

/* ══════════════════════════════════════
   LogoItem Component
   ══════════════════════════════════════ */

/**
 * LogoItem — Renders a company brand icon alongside its name.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.Icon - react-icons component for the brand
 * @param {string} props.name - Company name displayed next to the icon
 * @returns {JSX.Element} A single logo carousel item
 */
function LogoItem({ Icon, name }) {
  return (
    <div className={styles.logoItem}>
      <Icon className={styles.logoIcon} />
      <span className={styles.logoText}>{name}</span>
    </div>
  );
}

/* ══════════════════════════════════════
   LogoCarousel Component
   ══════════════════════════════════════ */

/**
 * LogoCarousel — Two-row infinite scrolling logo section.
 * Each row's logo list is duplicated so the CSS translateX
 * animation (-50%) creates a seamless infinite loop.
 * The carousel continues scrolling regardless of hover state.
 *
 * @returns {JSX.Element} The logo carousel section
 */
export default function LogoCarousel() {
  return (
    <section className={styles.section}>
      <p className={styles.label}>Trusted by teams at</p>

      {/* ── Row 1: scrolls left ── */}
      <div className={`${styles.track} ${styles.trackForward}`}>
        {ROW_1.map((logo, i) => (
          <LogoItem key={`r1a-${i}`} Icon={logo.Icon} name={logo.name} />
        ))}
        {/* Duplicate set for seamless infinite loop */}
        {ROW_1.map((logo, i) => (
          <LogoItem key={`r1b-${i}`} Icon={logo.Icon} name={logo.name} />
        ))}
      </div>

      {/* ── Row 2: scrolls right ── */}
      <div className={`${styles.track} ${styles.trackReverse}`}>
        {ROW_2.map((logo, i) => (
          <LogoItem key={`r2a-${i}`} Icon={logo.Icon} name={logo.name} />
        ))}
        {/* Duplicate set for seamless infinite loop */}
        {ROW_2.map((logo, i) => (
          <LogoItem key={`r2b-${i}`} Icon={logo.Icon} name={logo.name} />
        ))}
      </div>
    </section>
  );
}
