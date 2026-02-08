/**
 * Services.jsx
 *
 * Services section displaying a grid of rich service cards.
 * Each card features a unique SVG visual illustration, gradient
 * accent bar, icon, title, description, and a feature tag.
 * Cards animate in with staggered scroll-reveal effects.
 */

import useScrollReveal from "../hooks/useScrollReveal";
import styles from "../styles/Services.module.css";

/* ══════════════════════════════════════
   SVG Visual Illustrations
   Abstract decorative graphics rendered in the top-right
   corner of each card to give each service a unique identity.
   ══════════════════════════════════════ */

/**
 * Visual for Task Automation — animated infinity/cycle loop
 * representing the never-ending task generation cycle.
 */
function VisualAutomation() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={styles.visual}>
      <circle cx="40" cy="40" r="18" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 3" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="12s" repeatCount="indefinite" />
      </circle>
      <circle cx="80" cy="40" r="18" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 3" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="360 80 40" to="0 80 40" dur="12s" repeatCount="indefinite" />
      </circle>
      <path d="M58 40 L62 40" stroke="#6366f1" strokeWidth="2" opacity="0.6" />
      <circle cx="40" cy="40" r="4" fill="#6366f1" opacity="0.6" />
      <circle cx="80" cy="40" r="4" fill="#a78bfa" opacity="0.6" />
    </svg>
  );
}

/**
 * Visual for Marketing — animated ascending bar chart
 * representing campaign performance and growth metrics.
 */
function VisualMarketing() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={styles.visual}>
      <rect x="15" y="50" width="12" height="20" rx="2" fill="#6366f1" opacity="0.25">
        <animate attributeName="height" values="20;28;20" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y" values="50;42;50" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="33" y="35" width="12" height="35" rx="2" fill="#6366f1" opacity="0.35">
        <animate attributeName="height" values="35;42;35" dur="3.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="35;28;35" dur="3.5s" repeatCount="indefinite" />
      </rect>
      <rect x="51" y="25" width="12" height="45" rx="2" fill="#818cf8" opacity="0.4">
        <animate attributeName="height" values="45;52;45" dur="2.8s" repeatCount="indefinite" />
        <animate attributeName="y" values="25;18;25" dur="2.8s" repeatCount="indefinite" />
      </rect>
      <rect x="69" y="15" width="12" height="55" rx="2" fill="#a78bfa" opacity="0.5">
        <animate attributeName="height" values="55;62;55" dur="3.2s" repeatCount="indefinite" />
        <animate attributeName="y" values="15;8;15" dur="3.2s" repeatCount="indefinite" />
      </rect>
      <rect x="87" y="8" width="12" height="62" rx="2" fill="#a78bfa" opacity="0.6">
        <animate attributeName="height" values="62;68;62" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="y" values="8;2;8" dur="2.5s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

/**
 * Visual for Sales — animated upward trending line chart
 * representing pipeline growth and deal progression.
 */
function VisualSales() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={styles.visual}>
      <polyline points="10,65 30,55 50,45 70,30 90,20 110,8" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
        <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2s" fill="freeze" />
      </polyline>
      <path d="M10,65 L30,55 L50,45 L70,30 L90,20 L110,8 L110,75 L10,75 Z" fill="url(#salesGrad)" opacity="0.15" />
      <defs>
        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <circle cx="90" cy="20" r="4" fill="#a78bfa" opacity="0.8">
        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/**
 * Visual for Operations — rotating connected gears
 * representing systematic process management.
 */
function VisualOperations() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={styles.visual}>
      <circle cx="45" cy="38" r="16" stroke="#6366f1" strokeWidth="2" strokeDasharray="6 4" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="0 45 38" to="360 45 38" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="75" cy="48" r="12" stroke="#a78bfa" strokeWidth="2" strokeDasharray="5 3" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="360 75 48" to="0 75 48" dur="6s" repeatCount="indefinite" />
      </circle>
      <circle cx="45" cy="38" r="5" fill="#6366f1" opacity="0.3" />
      <circle cx="75" cy="48" r="4" fill="#a78bfa" opacity="0.3" />
      <circle cx="95" cy="28" r="8" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3">
        <animateTransform attributeName="transform" type="rotate" from="0 95 28" to="360 95 28" dur="10s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/**
 * Visual for HR — connected people nodes representing
 * team structure and recruiting pipelines.
 */
function VisualHR() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={styles.visual}>
      <line x1="60" y1="30" x2="35" y2="55" stroke="#6366f1" strokeWidth="1.5" opacity="0.3" />
      <line x1="60" y1="30" x2="85" y2="55" stroke="#6366f1" strokeWidth="1.5" opacity="0.3" />
      <line x1="35" y1="55" x2="85" y2="55" stroke="#a78bfa" strokeWidth="1" opacity="0.2" />
      <circle cx="60" cy="26" r="8" fill="#6366f1" opacity="0.35">
        <animate attributeName="opacity" values="0.35;0.55;0.35" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="35" cy="55" r="6" fill="#818cf8" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="85" cy="55" r="6" fill="#a78bfa" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="15" cy="40" r="4" fill="#6366f1" opacity="0.2" />
      <circle cx="105" cy="40" r="4" fill="#a78bfa" opacity="0.2" />
      <line x1="35" y1="55" x2="15" y2="40" stroke="#6366f1" strokeWidth="1" opacity="0.15" />
      <line x1="85" y1="55" x2="105" y2="40" stroke="#a78bfa" strokeWidth="1" opacity="0.15" />
    </svg>
  );
}

/**
 * Visual for Finance — animated stacked layers with a trending
 * line representing financial data and reporting.
 */
function VisualFinance() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={styles.visual}>
      <rect x="15" y="55" width="90" height="12" rx="3" fill="#6366f1" opacity="0.15" />
      <rect x="20" y="40" width="80" height="12" rx="3" fill="#818cf8" opacity="0.2" />
      <rect x="25" y="25" width="70" height="12" rx="3" fill="#a78bfa" opacity="0.25">
        <animate attributeName="opacity" values="0.25;0.4;0.25" dur="3s" repeatCount="indefinite" />
      </rect>
      <polyline points="25,22 45,16 65,18 85,10 95,12" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" fill="freeze" />
      </polyline>
      <circle cx="85" cy="10" r="3" fill="#a78bfa" opacity="0.6">
        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/**
 * Visual for Product — horizontal roadmap/timeline with nodes
 * representing planning phases and milestones.
 */
function VisualProduct() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={styles.visual}>
      <line x1="15" y1="40" x2="105" y2="40" stroke="#6366f1" strokeWidth="2" opacity="0.2" />
      <circle cx="25" cy="40" r="5" fill="#6366f1" opacity="0.5" />
      <circle cx="50" cy="40" r="5" fill="#818cf8" opacity="0.5" />
      <circle cx="75" cy="40" r="5" fill="#a78bfa" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="40" r="5" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="3 2">
        <animateTransform attributeName="transform" type="rotate" from="0 100 40" to="360 100 40" dur="4s" repeatCount="indefinite" />
      </circle>
      <rect x="17" y="20" width="16" height="8" rx="2" fill="#6366f1" opacity="0.15" />
      <rect x="42" y="52" width="16" height="8" rx="2" fill="#818cf8" opacity="0.15" />
      <rect x="67" y="20" width="16" height="8" rx="2" fill="#a78bfa" opacity="0.2" />
    </svg>
  );
}

/**
 * Visual for Engineering — terminal/code representation
 * with animated cursor showing active development.
 */
function VisualEngineering() {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={styles.visual}>
      <rect x="10" y="10" width="100" height="60" rx="6" stroke="#6366f1" strokeWidth="1.5" opacity="0.2" />
      <rect x="10" y="10" width="100" height="14" rx="6" fill="#6366f1" opacity="0.1" />
      <circle cx="22" cy="17" r="2.5" fill="#ef4444" opacity="0.4" />
      <circle cx="30" cy="17" r="2.5" fill="#f59e0b" opacity="0.4" />
      <circle cx="38" cy="17" r="2.5" fill="#10b981" opacity="0.4" />
      <text x="20" y="38" fill="#6366f1" fontSize="8" fontFamily="monospace" opacity="0.4">$ deploy</text>
      <text x="20" y="50" fill="#a78bfa" fontSize="8" fontFamily="monospace" opacity="0.3">running...</text>
      <rect x="20" y="56" width="6" height="10" fill="#a78bfa" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0;0.5" dur="1s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

/* ══════════════════════════════════════
   Service Data
   ══════════════════════════════════════ */

/**
 * Service definitions with unique accent color, SVG icon,
 * visual component, title, description, and feature tag.
 * @type {Array<Object>}
 */
const SERVICES = [
  {
    title: "Task Automation",
    desc: "Automatically generate follow-up tasks when you complete one. The work never stops, and neither does your momentum.",
    tag: "Infinite workflows",
    color: "#6366f1",
    Visual: VisualAutomation,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
      </svg>
    )
  },
  {
    title: "Marketing Workflows",
    desc: "Campaign planning, content calendars, SEO audits, and A/B testing — all broken into clear, actionable steps.",
    tag: "10+ templates",
    color: "#f59e0b",
    Visual: VisualMarketing,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    )
  },
  {
    title: "Sales Pipeline",
    desc: "From cold outreach to contract negotiation, track every deal through a structured workflow that spawns next steps.",
    tag: "Full-cycle CRM",
    color: "#10b981",
    Visual: VisualSales,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  {
    title: "Operations Management",
    desc: "Vendor audits, SOP updates, compliance reviews, and process optimization — keep the machine running smoothly.",
    tag: "Process engine",
    color: "#3b82f6",
    Visual: VisualOperations,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    )
  },
  {
    title: "HR & Recruiting",
    desc: "Candidate screening, interview scheduling, onboarding coordination, and performance review cycles.",
    tag: "End-to-end hiring",
    color: "#ec4899",
    Visual: VisualHR,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    title: "Financial Tracking",
    desc: "Account reconciliation, P&L statements, expense reviews, budget audits, and investor reporting.",
    tag: "Real-time ledger",
    color: "#14b8a6",
    Visual: VisualFinance,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    )
  },
  {
    title: "Product Planning",
    desc: "PRDs, backlog prioritization, user research, roadmap updates, and feature launch checklists.",
    tag: "Roadmap builder",
    color: "#8b5cf6",
    Visual: VisualProduct,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
      </svg>
    )
  },
  {
    title: "Engineering Ops",
    desc: "Bug tracking, code reviews, deployments, security audits, and performance monitoring — all structured.",
    tag: "CI/CD ready",
    color: "#f97316",
    Visual: VisualEngineering,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    )
  }
];

/* ══════════════════════════════════════
   ServiceCard Component
   ══════════════════════════════════════ */

/**
 * ServiceCard — A rich service card with unique SVG visual,
 * gradient accent bar, icon, description, and feature tag.
 * Uses scroll-reveal for entry animation.
 *
 * @param {Object} props
 * @param {string} props.title - Service name
 * @param {string} props.desc  - Service description
 * @param {string} props.tag   - Feature callout tag
 * @param {string} props.color - Accent color hex
 * @param {Function} props.Visual - SVG visual component
 * @param {JSX.Element} props.icon - SVG icon element
 * @param {number} props.index - Card index for stagger delay
 * @returns {JSX.Element} An animated service card
 */
function ServiceCard({ title, desc, tag, color, Visual, icon, index }) {
  const [ref, isRevealed] = useScrollReveal({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`${styles.card} reveal ${isRevealed ? "revealed" : ""} reveal-delay-${(index % 4) + 1}`}
    >
      {/* Gradient accent bar at top */}
      <div className={styles.accentBar} style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

      {/* Decorative SVG visual in background */}
      <div className={styles.visualWrap}>
        <Visual />
      </div>

      {/* Card content */}
      <div className={styles.cardContent}>
        <div className={styles.iconWrap} style={{ background: `${color}18`, color }}>
          {icon}
        </div>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardDesc}>{desc}</p>
        <span className={styles.tag} style={{ color, borderColor: `${color}40` }}>{tag}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Services Section
   ══════════════════════════════════════ */

/**
 * Services — Full services section with heading and animated card grid.
 * @returns {JSX.Element} The services section
 */
export default function Services() {
  return (
    <section id="services" className={styles.section}>
      <div className={`${styles.header} container`}>
        <p className="section-label">Services</p>
        <h2 className="section-title">Everything you need to scale</h2>
        <p className={`section-subtitle ${styles.subtitle}`}>
          Explore the tools that keep your business moving forward.
          Each service generates intelligent, context-aware tasks
          that chain together into complete workflows.
        </p>
      </div>

      <div className={styles.grid}>
        {SERVICES.map((svc, i) => (
          <ServiceCard key={svc.title} {...svc} index={i} />
        ))}
      </div>
    </section>
  );
}
