/**
 * Pricing.jsx
 *
 * Three-tier pricing section for the Vantage website.
 * Displays Starter (free), Pro (monthly), and Enterprise (custom)
 * plans in a responsive card grid. The Pro card is visually
 * elevated as the recommended option. Each card features a price,
 * description, feature checklist with icons, and a CTA button.
 * Cards animate in with staggered scroll-reveal effects.
 */

import { Link } from "react-router-dom";
import useScrollReveal from "../hooks/useScrollReveal";
import styles from "../styles/Pricing.module.css";

/* ══════════════════════════════════════
   Plan Data
   ══════════════════════════════════════ */

/**
 * Pricing plan definitions.
 * @type {Array<Object>}
 *
 * @property {string}   name        - Plan display name
 * @property {string}   price       - Price text ("Free", "$12", etc.)
 * @property {string}   period      - Billing period or qualifier
 * @property {string}   description - One-line plan summary
 * @property {boolean}  popular     - Whether this is the highlighted plan
 * @property {string}   cta         - Button label text
 * @property {string}   ctaLink     - Route for the CTA button
 * @property {string[]} features    - Checklist of included features
 */
const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Everything you need to get organized and start building momentum.",
    popular: false,
    cta: "Get Started",
    ctaLink: "/login",
    features: [
      "Up to 25 active tasks",
      "3 business categories",
      "Basic task automation",
      "Chrome extension access",
      "Daily streak tracking",
      "Community support"
    ]
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    description: "Unlimited workflows and advanced tools for growing businesses.",
    popular: true,
    cta: "Start Free Trial",
    ctaLink: "/login",
    features: [
      "Unlimited active tasks",
      "All business categories",
      "Advanced task chaining",
      "Priority-based scheduling",
      "Analytics dashboard",
      "Custom task templates",
      "Email & chat support",
      "Team collaboration (3 seats)"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "tailored to you",
    description: "Dedicated infrastructure and premium support for scaling teams.",
    popular: false,
    cta: "Contact Sales",
    ctaLink: "/contact",
    features: [
      "Everything in Pro",
      "Unlimited team seats",
      "SSO & SAML authentication",
      "Custom integrations & API",
      "Dedicated account manager",
      "SLA & uptime guarantee",
      "Advanced audit logging",
      "On-prem deployment option"
    ]
  }
];

/* ══════════════════════════════════════
   CheckIcon — Small inline SVG checkmark
   ══════════════════════════════════════ */

/**
 * CheckIcon — Renders a small checkmark SVG used beside each
 * feature line item.
 *
 * @param {Object} props
 * @param {string} [props.color] - Stroke color override
 * @returns {JSX.Element} An SVG checkmark icon
 */
function CheckIcon({ color = "currentColor" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.checkIcon}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ══════════════════════════════════════
   PricingCard Component
   ══════════════════════════════════════ */

/**
 * PricingCard — A single pricing tier card with scroll-reveal animation.
 *
 * @param {Object}   props
 * @param {string}   props.name        - Plan name
 * @param {string}   props.price       - Price display text
 * @param {string}   props.period      - Billing period label
 * @param {string}   props.description - Plan one-liner
 * @param {boolean}  props.popular     - Whether to highlight as recommended
 * @param {string}   props.cta         - CTA button label
 * @param {string}   props.ctaLink     - Route for the CTA button
 * @param {string[]} props.features    - Feature checklist items
 * @param {number}   props.index       - Card index for stagger delay
 * @returns {JSX.Element} A pricing card element
 */
function PricingCard({ name, price, period, description, popular, cta, ctaLink, features, index }) {
  const [ref, isRevealed] = useScrollReveal({ threshold: 0.15 });

  return (
    <div
      ref={ref}
      className={`
        ${styles.card}
        ${popular ? styles.cardPopular : ""}
        reveal ${isRevealed ? "revealed" : ""}
        reveal-delay-${index + 1}
      `}
    >
      {/* Popular badge */}
      {popular && <span className={styles.badge}>Most Popular</span>}

      {/* Plan name */}
      <h3 className={styles.planName}>{name}</h3>

      {/* Price block */}
      <div className={styles.priceWrap}>
        <span className={styles.price}>{price}</span>
        <span className={styles.period}>{period}</span>
      </div>

      {/* Plan description */}
      <p className={styles.planDesc}>{description}</p>

      {/* Divider line */}
      <div className={styles.divider} />

      {/* Feature checklist */}
      <ul className={styles.featureList}>
        {features.map((feature) => (
          <li key={feature} className={styles.featureItem}>
            <CheckIcon color={popular ? "#6366f1" : "#5c5f73"} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <Link
        to={ctaLink}
        className={`${styles.ctaBtn} ${popular ? styles.ctaPrimary : styles.ctaSecondary}`}
      >
        {cta}
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════
   Pricing Section
   ══════════════════════════════════════ */

/**
 * Pricing — Full pricing section with heading and three-tier card grid.
 * @returns {JSX.Element} The pricing section
 */
export default function Pricing() {
  return (
    <section id="pricing" className={styles.section}>
      <div className={`${styles.header} container`}>
        <p className="section-label">Pricing</p>
        <h2 className="section-title">Simple, transparent pricing</h2>
        <p className={`section-subtitle ${styles.subtitle}`}>
          Start free and upgrade as you grow. No hidden fees, no surprises.
          Cancel anytime.
        </p>
      </div>

      {/* Toggle placeholder — billing period switch can go here later */}

      <div className={styles.grid}>
        {PLANS.map((plan, i) => (
          <PricingCard key={plan.name} {...plan} index={i} />
        ))}
      </div>
    </section>
  );
}
