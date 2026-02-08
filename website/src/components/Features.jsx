/**
 * Features.jsx
 *
 * Immersive scroll-driven features showcase. Each feature occupies a
 * tall scroll zone (200vh) with sticky-positioned content that
 * progressively reveals as the user scrolls. The next feature stays
 * hidden until the user crosses a scroll threshold from the previous one.
 *
 * Interactive elements include:
 * - Floating side navigation with feature labels on hover
 * - Per-feature scroll progress bars at the top of each pinned frame
 * - Staggered content reveals tied to scroll position thresholds
 * - Subtle parallax offset on visual illustrations
 * - Ambient background glow unique to each feature's accent color
 * - Directional highlight animations that match text alignment
 */

import { useRef, useState, useEffect, useCallback } from "react";
import styles from "../styles/Features.module.css";

/* ══════════════════════════════════════
   usePinProgress — Per-section scroll tracker

   Tracks the "pinned" scroll phase of a tall scroll zone.
   Returns 0→1 during the pinned phase, negative values
   before the section pins, and values >1 after it un-pins.
   ══════════════════════════════════════ */

/**
 * usePinProgress — Computes normalized progress (0→1) for the
 * pinned phase of a sticky section within a scroll zone.
 *
 * The scroll zone is taller than the viewport, creating a
 * "scroll travel" distance where the sticky frame stays fixed.
 * Progress tracks how far through that travel the user has scrolled.
 *
 * @param {React.RefObject} ref - Ref attached to the scroll zone div
 * @returns {number} Progress: <0 before pin, 0–1 during pin, >1 after
 */
function usePinProgress(ref) {
  const [progress, setProgress] = useState(-1);

  const update = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vh = window.innerHeight;

    /* scrollTravel = how many px the user scrolls while content is pinned.
       Equals zone height minus one viewport (the sticky frame height). */
    const scrollTravel = rect.height - vh;

    if (scrollTravel <= 0) {
      /* Fallback: zone isn't taller than viewport */
      setProgress(rect.top <= 0 ? 1 : 0);
      return;
    }

    if (rect.top > 0) {
      /* Section top hasn't reached viewport top — content not pinned yet.
         Negative value indicates distance until pinning starts. */
      setProgress(-rect.top / vh);
    } else if (rect.bottom < vh) {
      /* Section bottom has passed above the viewport bottom —
         the sticky frame is being pushed out. Value > 1. */
      setProgress(1 + (vh - rect.bottom) / vh);
    } else {
      /* Content is pinned — compute 0→1 progress through the zone. */
      setProgress(Math.max(0, Math.min(1, -rect.top / scrollTravel)));
    }
  }, [ref]);

  useEffect(() => {
    window.addEventListener("scroll", update, { passive: true });
    update(); /* initial measurement */
    return () => window.removeEventListener("scroll", update);
  }, [update]);

  return progress;
}

/* ══════════════════════════════════════
   Interactive Visual Components
   Each feature gets a unique interactive illustration
   driven by scroll progress. Elements animate in
   response to the user's scroll position.
   ══════════════════════════════════════ */

/**
 * VisualTaskEngine — Interactive task list for the Intelligent Task Engine.
 * Displays a realistic sales-pipeline workflow chain: as each task checks
 * off, the next logical step appears — mirroring how the actual engine
 * chains "Prepare proposal → Send proposal → Schedule walkthrough" and
 * then spawns a cross-category follow-up (Ops: legal review).
 *
 * Data mirrors the real sales_proposal template chain in taskEngine.js.
 *
 * @param {Object} props
 * @param {number} props.progress - Scroll progress 0→1 from FeatureSection
 * @returns {JSX.Element}
 */
function VisualTaskEngine({ progress }) {
  /*
   * A real Vantage workflow chain from the sales_proposal template.
   * Each task checks off sequentially — exactly how the engine works.
   * Tags match the actual CATEGORIES in taskEngine.js.
   */
  const tasks = [
    { label: "Prepare proposal for Acme Corp", tag: "Sales", threshold: 0.22 },
    { label: "Send proposal to Acme Corp decision makers", tag: "Sales", threshold: 0.40 },
    { label: "Schedule proposal walkthrough with Acme Corp", tag: "Sales", threshold: 0.56 },
  ];

  /* Count how many tasks have been checked */
  const checkedCount = tasks.filter((t) => progress >= t.threshold).length;

  /*
   * Cross-category follow-up: after the walkthrough completes, the engine
   * spawns an Ops task — "Get legal review on Acme Corp contract terms".
   * This is the real crossCategory behavior from taskEngine.js.
   */
  const followUpT = Math.max(0, Math.min(1, (progress - 0.64) / 0.12));

  return (
    <div className={styles.itEngine}>
      {/* Header bar showing task queue label and progress count */}
      <div className={styles.itHeader}>
        <span className={styles.itHeaderLabel}>Task Queue</span>
        <span className={styles.itHeaderCount}>
          {checkedCount}/{tasks.length}
        </span>
      </div>

      {/* Task rows with animated checkboxes */}
      {tasks.map((task, i) => {
        const isChecked = progress >= task.threshold;
        /* Checkmark SVG draw animation: 0→1 over 10% of scroll progress */
        const checkT = Math.max(
          0,
          Math.min(1, (progress - task.threshold) / 0.1)
        );

        return (
          <div
            key={i}
            className={`${styles.itTask} ${isChecked ? styles.itTaskDone : ""}`}
          >
            {/* Checkbox square — turns green and shows checkmark when done */}
            <div
              className={`${styles.itCheckbox} ${isChecked ? styles.itCheckboxDone : ""}`}
            >
              {isChecked && (
                <svg viewBox="0 0 16 16" className={styles.itCheckmark}>
                  <polyline
                    points="3.5,8 6.5,11.5 12.5,4.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    style={{
                      /* Animate the checkmark drawing via dashoffset */
                      strokeDasharray: 20,
                      strokeDashoffset: 20 * (1 - checkT),
                    }}
                  />
                </svg>
              )}
            </div>

            {/* Task label text */}
            <span className={styles.itTaskText}>{task.label}</span>

            {/* Category tag */}
            <span className={styles.itTag}>{task.tag}</span>
          </div>
        );
      })}

      {/* Cross-category chain: legal review spawned by completing the sales chain */}
      {followUpT > 0 && (
        <div
          className={styles.itChain}
          style={{
            opacity: followUpT,
            transform: `translateY(${(1 - followUpT) * 12}px)`,
          }}
        >
          {/* "Follow-up generated" indicator — shows cross-category bridge */}
          <div className={styles.itChainBar}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M7 7h10v10" />
              <path d="M7 17L17 7" />
            </svg>
            <span>Follow-up generated</span>
          </div>

          {/* Real cross-category follow-up from sales_negotiate template */}
          <div className={`${styles.itTask} ${styles.itTaskNew}`}>
            <div className={styles.itCheckbox} />
            <span className={styles.itTaskText}>
              Get legal review on Acme Corp contract terms
            </span>
            <span className={`${styles.itTag} ${styles.itTagOps}`}>Ops</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * VisualPriority — Interactive priority list for Priority Intelligence.
 * Shows 3 real business tasks from different categories, initially
 * in the order they were added. As the user scrolls, a priority score
 * computes and the cards smoothly reorder to the correct ranking.
 *
 * Uses real task examples from the engine: a critical sales deadline,
 * a high-priority finance deliverable, and a medium ops improvement.
 *
 * @param {Object} props
 * @param {number} props.progress - Scroll progress 0→1 from FeatureSection
 * @returns {JSX.Element}
 */
function VisualPriority({ progress }) {
  /*
   * Cards in their UNSORTED (added-order) positions.
   * sortOffset moves each card to its priority-ranked position.
   * ITEM_HEIGHT = card height (48px) + gap (10px) = 58px.
   *
   * Real tasks that mirror actual taskEngine templates:
   * - ops_sop: "Review and update SOP documentation"
   * - sales_negotiate: "Negotiate contract terms with {company}"
   * - fin_pnl: "Prepare monthly P&L statement"
   */
  const ITEM_HEIGHT = 70;
  const items = [
    {
      label: "Update SOP documentation",
      deadline: "Next Wednesday",
      tag: "Ops",
      color: "#10b981",
      priority: 3,
      sortOffset: 2 * ITEM_HEIGHT, /* moves down 2 positions */
    },
    {
      label: "Finalize Globex Inc contract",
      deadline: "Due today",
      tag: "Sales",
      color: "#ef4444",
      priority: 1,
      sortOffset: -1 * ITEM_HEIGHT, /* moves up 1 position */
    },
    {
      label: "Prepare monthly P&L statement",
      deadline: "Due tomorrow",
      tag: "Finance",
      color: "#f59e0b",
      priority: 2,
      sortOffset: -1 * ITEM_HEIGHT, /* moves up 1 position */
    },
  ];

  /* Score bar fills from 0.25 → 0.45 progress (priority "computing") */
  const scoreT = Math.max(0, Math.min(1, (progress - 0.25) / 0.20));

  /* Sort transition happens at 0.50 → 0.65 progress */
  const sortT = Math.max(0, Math.min(1, (progress - 0.50) / 0.15));

  /* "Ranked" label fades in after sort completes */
  const rankedT = Math.max(0, Math.min(1, (progress - 0.68) / 0.10));

  return (
    <div className={styles.ipList}>
      {/* Header with sorting status */}
      <div className={styles.ipHeader}>
        <span className={styles.ipHeaderLabel}>Priority Queue</span>
        <span
          className={styles.ipHeaderStatus}
          style={{ opacity: rankedT }}
        >
          Ranked
        </span>
      </div>

      {/* Priority cards that reorder via translateY */}
      <div className={styles.ipCards}>
        {items.map((item, i) => (
          <div
            key={i}
            className={styles.ipCard}
            style={{
              /* Smoothly translate each card to its sorted position */
              transform: `translateY(${item.sortOffset * sortT}px)`,
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Color-coded priority bar on the left edge */}
            <div
              className={styles.ipBar}
              style={{ background: item.color }}
            />

            {/* Card content: task label, deadline, and category tag */}
            <div className={styles.ipContent}>
              <span className={styles.ipLabel}>{item.label}</span>
              <span className={styles.ipMeta}>
                {item.deadline}
                <span className={styles.ipMetaTag}>{item.tag}</span>
              </span>
            </div>

            {/* Priority score bar that fills before sorting */}
            <div className={styles.ipScoreTrack}>
              <div
                className={styles.ipScoreFill}
                style={{
                  width: `${scoreT * 100}%`,
                  background: item.color,
                }}
              />
            </div>

            {/* Priority badge number — appears after sort */}
            <span
              className={styles.ipBadge}
              style={{
                borderColor: item.color,
                color: item.color,
                opacity: rankedT,
                transform: `scale(${0.5 + rankedT * 0.5})`,
              }}
            >
              {item.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * VisualCoverage — Interactive category grid for Workflow Coverage.
 * Each of the 8 business categories lights up with a real example task
 * from the engine's template library. Colors and icons match the actual
 * CATEGORIES array in taskEngine.js.
 *
 * @param {Object} props
 * @param {number} props.progress - Scroll progress 0→1 from FeatureSection
 * @returns {JSX.Element}
 */
function VisualCoverage({ progress }) {
  /*
   * All 8 categories with their real taskEngine.js colors and a sample
   * task title pulled directly from the WORKFLOW_TEMPLATES.
   */
  const categories = [
    { label: "Marketing",   task: "Draft Q3 content calendar",     color: "#6366f1" },
    { label: "Sales",       task: "Qualify Globex Inc lead",        color: "#f59e0b" },
    { label: "Operations",  task: "Audit AWS vendor contract",      color: "#10b981" },
    { label: "Finance",     task: "Reconcile June accounts",        color: "#14b8a6" },
    { label: "HR",          task: "Screen UX Designer candidates",  color: "#ec4899" },
    { label: "Product",     task: "Plan Sprint 12 backlog",         color: "#8b5cf6" },
    { label: "Engineering", task: "Deploy auth to staging",         color: "#3b82f6" },
    { label: "Support",     task: "Resolve Tier 2 escalation",      color: "#f97316" },
  ];

  /**
   * lightThreshold — Returns the scroll progress at which a category
   * "lights up" (activates). Categories activate sequentially.
   * @param {number} i - Category index (0-based)
   * @returns {number} Progress threshold for this category
   */
  const lightThreshold = (i) => 0.20 + i * 0.07;

  /* Count of currently active (lit) categories */
  const activeCount = categories.filter(
    (_, i) => progress >= lightThreshold(i)
  ).length;

  return (
    <div className={styles.icGrid}>
      {/* Header with coverage counter */}
      <div className={styles.icHeader}>
        <span className={styles.icHeaderLabel}>Workflow Coverage</span>
        <span className={styles.icHeaderCount}>
          {activeCount}/{categories.length} active
        </span>
      </div>

      {/* 2×4 grid of category cards with real task examples */}
      <div className={styles.icNodes}>
        {categories.map((cat, i) => {
          const isLit = progress >= lightThreshold(i);
          /* Fade-in intensity for the glow/border effect */
          const litT = Math.max(
            0,
            Math.min(1, (progress - lightThreshold(i)) / 0.06)
          );

          return (
            <div
              key={i}
              className={`${styles.icNode} ${isLit ? styles.icNodeLit : ""}`}
              style={{
                /* Dynamic border and glow color when lit */
                borderColor: isLit
                  ? cat.color
                  : "rgba(255, 255, 255, 0.08)",
                boxShadow: isLit
                  ? `0 0 12px ${cat.color}33, inset 0 0 12px ${cat.color}11`
                  : "none",
                opacity: 0.4 + litT * 0.6,
              }}
            >
              {/* Colored dot + category name */}
              <div className={styles.icNodeHeader}>
                <span
                  className={styles.icDot}
                  style={{
                    background: cat.color,
                    opacity: isLit ? 1 : 0.3,
                  }}
                />
                <span
                  className={styles.icLabel}
                  style={{ color: isLit ? cat.color : undefined }}
                >
                  {cat.label}
                </span>
              </div>

              {/* Sample task from this category — visible when lit */}
              <span
                className={styles.icTask}
                style={{ opacity: isLit ? 0.65 : 0 }}
              >
                {cat.task}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * VisualAnalytics — Interactive mini dashboard for Real-Time Analytics.
 * Displays a category-level performance breakdown bar chart using the
 * same 8 categories from the engine, with realistic weekly completion
 * counts and productivity metrics.
 *
 * @param {Object} props
 * @param {number} props.progress - Scroll progress 0→1 from FeatureSection
 * @returns {JSX.Element}
 */
function VisualAnalytics({ progress }) {
  /*
   * Bar chart data: weekly completed tasks per category.
   * Labels and colors match the real CATEGORIES in taskEngine.js.
   * Values represent a realistic week of task completions.
   */
  const bars = [
    { label: "MKT",  count: 14, pct: 82, color: "#6366f1" },
    { label: "Sales", count: 9,  pct: 53, color: "#f59e0b" },
    { label: "Ops",   count: 7,  pct: 41, color: "#10b981" },
    { label: "Fin",   count: 5,  pct: 29, color: "#14b8a6" },
    { label: "HR",    count: 4,  pct: 24, color: "#ec4899" },
    { label: "Eng",   count: 10, pct: 59, color: "#3b82f6" },
  ];

  /* Bars grow from 0 → target height over 0.25→0.60 progress */
  const barGrowth = Math.max(0, Math.min(1, (progress - 0.25) / 0.35));

  /* Total completed = sum of all bar counts, ticked up with bar growth */
  const totalCompleted = Math.round(
    bars.reduce((sum, b) => sum + b.count, 0) * barGrowth
  );

  /* On-time percentage ticks up alongside bar growth */
  const onTimePct = Math.round(92 * barGrowth);

  /* Stats row fades in after bars start growing */
  const statsT = Math.max(0, Math.min(1, (progress - 0.40) / 0.15));

  return (
    <div className={styles.iaChart}>
      {/* Mini window title bar with traffic light dots */}
      <div className={styles.iaTitleBar}>
        <span className={styles.iaDot} style={{ background: "#ef4444" }} />
        <span className={styles.iaDot} style={{ background: "#f59e0b" }} />
        <span className={styles.iaDot} style={{ background: "#10b981" }} />
        <span className={styles.iaTitleText}>Weekly Performance</span>
      </div>

      {/* Bar chart area — one bar per category */}
      <div className={styles.iaBars}>
        {bars.map((bar, i) => (
          <div key={i} className={styles.iaBarCol}>
            {/* Floating count label above the bar */}
            <span
              className={styles.iaBarCount}
              style={{ opacity: barGrowth > 0.3 ? statsT : 0 }}
            >
              {Math.round(bar.count * barGrowth)}
            </span>

            {/* Bar fill grows from bottom up */}
            <div className={styles.iaBarTrack}>
              <div
                className={styles.iaBarFill}
                style={{
                  height: `${bar.pct * barGrowth}%`,
                  background: bar.color,
                  transition: "height 0.3s ease-out",
                }}
              />
            </div>

            {/* Category label below each bar */}
            <span className={styles.iaBarLabel}>{bar.label}</span>
          </div>
        ))}
      </div>

      {/* Stats row: total completed this week and on-time rate */}
      <div className={styles.iaStats} style={{ opacity: statsT }}>
        <div className={styles.iaStat}>
          <span className={styles.iaStatValue}>{totalCompleted}</span>
          <span className={styles.iaStatLabel}>this week</span>
        </div>
        <div className={styles.iaStatDivider} />
        <div className={styles.iaStat}>
          <span className={styles.iaStatValue}>{onTimePct}%</span>
          <span className={styles.iaStatLabel}>on time</span>
        </div>
      </div>
    </div>
  );
}

/**
 * VisualScale — Interactive hub-and-spoke for Built to Scale.
 * Shows a central Vantage hub with 4 real integration platforms
 * (Slack, Salesforce, Google Calendar, GitHub) that connect one
 * by one as the user scrolls. Each node shows what it syncs.
 *
 * These integrations match the vendor/tool ecosystem referenced
 * throughout the taskEngine.js FILL_DATA and templates.
 *
 * @param {Object} props
 * @param {number} props.progress - Scroll progress 0→1 from FeatureSection
 * @returns {JSX.Element}
 */
function VisualScale({ progress }) {
  /*
   * Real integration platforms from the Vantage ecosystem.
   * Descriptions explain what each integration provides.
   */
  const nodes = [
    { label: "Slack",      desc: "Notifications",  color: "#e01e5a", threshold: 0.25 },
    { label: "Salesforce", desc: "CRM sync",       color: "#00a1e0", threshold: 0.40 },
    { label: "Google Cal", desc: "Scheduling",     color: "#4285f4", threshold: 0.55 },
    { label: "GitHub",     desc: "Dev workflow",   color: "#a78bfa", threshold: 0.70 },
  ];

  /* Count of connected (active) nodes */
  const connectedCount = nodes.filter(
    (n) => progress >= n.threshold
  ).length;

  return (
    <div className={styles.isHub}>
      {/* Header with connection count */}
      <div className={styles.isHeader}>
        <span className={styles.isHeaderLabel}>Integrations</span>
        <span className={styles.isHeaderCount}>
          {connectedCount} connected
        </span>
      </div>

      {/* Hub-and-spoke layout: central node surrounded by satellites */}
      <div className={styles.isSpoke}>
        {/* Central Vantage hub */}
        <div className={styles.isCenter}>
          <span className={styles.isCenterV}>V</span>
        </div>

        {/* Satellite nodes in a 2×2 arrangement around the center */}
        {nodes.map((node, i) => {
          const isConnected = progress >= node.threshold;
          /* Connection line draw progress: 0→1 */
          const lineT = Math.max(
            0,
            Math.min(1, (progress - node.threshold) / 0.10)
          );

          return (
            <div
              key={i}
              className={`${styles.isNode} ${isConnected ? styles.isNodeActive : ""}`}
              style={{
                borderColor: isConnected
                  ? node.color
                  : "rgba(255, 255, 255, 0.1)",
                boxShadow: isConnected
                  ? `0 0 16px ${node.color}33`
                  : "none",
              }}
            >
              {/* Connection line (drawn between center and node) */}
              <div
                className={styles.isLine}
                style={{
                  background: node.color,
                  opacity: lineT * 0.6,
                }}
              />

              {/* Node content: platform name + sync description */}
              <div className={styles.isNodeContent}>
                <span
                  className={styles.isNodeLabel}
                  style={{ color: isConnected ? node.color : undefined }}
                >
                  {node.label}
                </span>
                <span
                  className={styles.isNodeDesc}
                  style={{ opacity: isConnected ? 0.6 : 0 }}
                >
                  {node.desc}
                </span>
              </div>

              {/* Green active indicator dot */}
              {isConnected && (
                <span
                  className={styles.isActiveDot}
                  style={{ opacity: lineT }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   Feature Accent Colors (RGB values)
   Used for ambient background glows and progress bars.
   Each feature gets a unique color identity.
   ══════════════════════════════════════ */
const ACCENT_COLORS = [
  "99, 102, 241",   /* indigo  — Task Engine */
  "239, 68, 68",    /* red     — Priority */
  "16, 185, 129",   /* emerald — Coverage */
  "99, 102, 241",   /* indigo  — Analytics */
  "139, 92, 246",   /* purple  — Scale */
];

/* ══════════════════════════════════════
   Feature Data
   Each entry describes a core Vantage service capability.
   ══════════════════════════════════════ */

/**
 * @type {Array<Object>}
 * @property {string}   title       - Feature name
 * @property {string}   subtitle    - Short tagline
 * @property {string}   description - Detailed explanation
 * @property {string[]} highlights  - 3 key bullet points
 * @property {Function} Visual      - SVG illustration component
 */
const FEATURES = [
  {
    title: "Intelligent Task Engine",
    subtitle: "Work that never runs dry",
    description:
      "At the core of Vantage is a task engine that understands your business. When you complete a task, the system analyzes the context and immediately generates the next logical step — creating an unbroken chain of actionable work across every area of your operation.",
    highlights: [
      "Context-aware task generation",
      "Automatic follow-up chaining",
      "Domain-specific task templates",
    ],
    Visual: VisualTaskEngine,
  },
  {
    title: "Priority Intelligence",
    subtitle: "Always know what matters most",
    description:
      "Every task is scored and ranked in real time based on urgency, deadlines, category balance, and business impact. Vantage surfaces the most critical work first so your team never wastes a cycle deciding what to do next.",
    highlights: [
      "Multi-factor priority scoring",
      "Deadline-aware scheduling",
      "Category-balanced queue",
    ],
    Visual: VisualPriority,
  },
  {
    title: "Complete Workflow Coverage",
    subtitle: "Eight categories, one platform",
    description:
      "From marketing campaigns to engineering deployments, Vantage covers every discipline your business relies on. Each category draws from deep domain knowledge to generate structured, relevant tasks — not generic to-do items.",
    highlights: [
      "Marketing, Sales, Ops, HR, Finance",
      "Product, Engineering, Customer Success",
      "Industry-tailored task libraries",
    ],
    Visual: VisualCoverage,
  },
  {
    title: "Real-Time Analytics",
    subtitle: "Insights that drive decisions",
    description:
      "A live analytics dashboard breaks down your task completion rates, category distribution, and efficiency trends over time. See exactly where effort is going, which areas need attention, and how your productivity scales week over week.",
    highlights: [
      "Category performance breakdown",
      "Trend analysis over time",
      "Efficiency scoring per workflow",
    ],
    Visual: VisualAnalytics,
  },
  {
    title: "Built to Scale",
    subtitle: "Grows as fast as you do",
    description:
      "Start solo and expand to your whole organization. Vantage supports team seats, custom task templates, API integrations, and enterprise-grade authentication — all without changing your workflow or losing your data.",
    highlights: [
      "Team seats & collaboration",
      "Custom templates & API access",
      "SSO, SAML & audit logging",
    ],
    Visual: VisualScale,
  },
];

/* ══════════════════════════════════════
   FeatureSection — Scroll-pinned feature reveal

   Each feature lives in a tall scroll zone (200vh). A sticky
   frame pins content to the viewport while the user scrolls.
   Content elements progressively reveal at different scroll
   thresholds, gating visibility behind scroll distance.
   ══════════════════════════════════════ */

/**
 * FeatureSection — A single feature displayed in a tall scroll zone.
 * Content elements (title, description, visual, highlights) animate
 * in sequentially as the user scrolls through the pinned phase.
 *
 * @param {Object}   props
 * @param {string}   props.title       - Feature name
 * @param {string}   props.subtitle    - Short tagline
 * @param {string}   props.description - Detailed text
 * @param {string[]} props.highlights  - Key bullet points
 * @param {Function} props.Visual      - SVG illustration component
 * @param {number}   props.index       - Feature index (0-based)
 * @param {number}   props.total       - Total features count
 * @param {string}   props.accentRgb   - RGB string for the feature's accent color
 * @param {Function} props.onProgress  - Callback: (index, progress) => void
 * @returns {JSX.Element}
 */
function FeatureSection({
  title,
  subtitle,
  description,
  highlights,
  Visual,
  index,
  total,
  accentRgb,
  onProgress,
}) {
  const zoneRef = useRef(null);
  const progress = usePinProgress(zoneRef);
  const isReversed = index % 2 === 1;

  /* Report progress to parent so the floating nav can track active feature */
  useEffect(() => {
    onProgress(index, progress);
  }, [index, progress, onProgress]);

  /* ── Phase helper: maps a [start, end] progress range to 0→1 ── */
  /**
   * phase — Converts a raw progress value to a 0→1 sub-range.
   * Used to stagger when each content element becomes visible.
   *
   * @param {number} start - Progress value where animation begins
   * @param {number} end   - Progress value where animation completes
   * @returns {number} Normalized 0→1 value for this animation phase
   */
  const phase = (start, end) =>
    Math.max(0, Math.min(1, (progress - start) / (end - start)));

  /* ── Compute animation values for each content element ── */

  /* Feature number + title: first to appear */
  const titleT = phase(0.0, 0.15);
  /* Subtitle: slightly delayed from title */
  const subT = phase(0.05, 0.20);
  /* Description paragraph */
  const descT = phase(0.20, 0.38);
  /* Visual card: scales and fades in */
  const vizT = phase(0.32, 0.52);
  /* Individual highlight items: staggered with per-item offset */
  const hlTs = highlights.map((_, i) => phase(0.50 + i * 0.07, 0.60 + i * 0.07));

  /* Per-feature progress bar width (spans the full pinned range) */
  const barWidth = Math.max(0, Math.min(1, progress));

  /* Parallax offset: visual drifts subtly relative to text */
  const parallaxY = (0.5 - progress) * 30;

  /* Highlight slide direction: matches text alignment side */
  const slideDir = isReversed ? 1 : -1;

  return (
    <div
      ref={zoneRef}
      className={styles.scrollZone}
      data-feature-zone={index}
    >
      <div className={styles.stickyFrame}>
        {/* Ambient background glow — unique color per feature */}
        <div
          className={styles.ambientGlow}
          style={{
            background: `radial-gradient(ellipse at center, rgba(${accentRgb}, 0.07) 0%, transparent 70%)`,
            opacity: phase(0.05, 0.30),
          }}
        />

        {/* Progress bar across the top of the pinned frame */}
        <div className={styles.featureProgressBar}>
          <div
            className={styles.featureProgressFill}
            style={{
              width: `${barWidth * 100}%`,
              background: `linear-gradient(90deg, rgba(${accentRgb}, 0.5), rgba(${accentRgb}, 0.8))`,
            }}
          />
        </div>

        {/* Two-column content layout (alternates text/visual sides) */}
        <div
          className={`${styles.contentLayout} ${isReversed ? styles.contentReversed : ""}`}
        >
          {/* ── Text side ── */}
          <div className={styles.textBlock}>
            {/* Feature counter: "01 / 06" */}
            <span
              className={styles.featureNumber}
              style={{
                opacity: titleT,
                transform: `translateY(${(1 - titleT) * 30}px)`,
              }}
            >
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </span>

            {/* Feature title */}
            <h3
              className={styles.featureTitle}
              style={{
                opacity: titleT,
                transform: `translateY(${(1 - titleT) * 40}px)`,
              }}
            >
              {title}
            </h3>

            {/* Feature subtitle / tagline */}
            <p
              className={styles.featureSubtitle}
              style={{
                opacity: subT,
                transform: `translateY(${(1 - subT) * 25}px)`,
              }}
            >
              {subtitle}
            </p>

            {/* Feature description paragraph */}
            <p
              className={styles.featureDesc}
              style={{
                opacity: descT,
                transform: `translateY(${(1 - descT) * 20}px)`,
              }}
            >
              {description}
            </p>

            {/* Highlight bullet points — staggered reveal */}
            <ul className={styles.featureHighlights}>
              {highlights.map((h, i) => (
                <li
                  key={h}
                  className={styles.highlightItem}
                  style={{
                    opacity: hlTs[i],
                    transform: `translateX(${slideDir * (1 - hlTs[i]) * 20}px)`,
                  }}
                >
                  <span
                    className={styles.highlightDot}
                    style={{ background: `rgba(${accentRgb}, 0.8)` }}
                  />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Visual side ── */}
          <div
            className={styles.visualBlock}
            style={{
              opacity: vizT,
              transform: `translateY(${parallaxY + (1 - vizT) * 40}px) scale(${0.88 + vizT * 0.12})`,
            }}
          >
            <div className={styles.visualCard}>
              {/* Pass scroll progress so interactive visuals can animate */}
              <Visual progress={progress} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   FloatingNav — Fixed side dot navigation

   Shows the user's position within the features section.
   Each dot represents a feature; the active one is highlighted.
   Clicking a dot smooth-scrolls to that feature's zone.
   Labels appear on hover for context.
   ══════════════════════════════════════ */

/**
 * FloatingNav — Renders a fixed vertical dot navigation on the right side.
 * Highlights the currently active feature and exposes labels on hover.
 *
 * @param {Object}  props
 * @param {Array}   props.features    - Feature data array (for labels)
 * @param {number}  props.activeIndex - Currently active feature index
 * @param {boolean} props.visible     - Whether the nav should be shown
 * @returns {JSX.Element}
 */
function FloatingNav({ features, activeIndex, visible }) {
  /**
   * handleClick — Scrolls the viewport to a target feature's scroll zone.
   * Positions the viewport ~25% into the zone so content is mid-reveal.
   *
   * @param {number} index - Feature index to scroll to
   */
  const handleClick = (index) => {
    /* querySelector finds the scroll zone by data attribute */
    const zone = document.querySelector(`[data-feature-zone="${index}"]`);
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top + rect.height * 0.25;
    window.scrollTo({ top: scrollTop, behavior: "smooth" });
  };

  return (
    <nav
      className={`${styles.floatingNav} ${visible ? styles.floatingNavVisible : ""}`}
      aria-label="Feature navigation"
    >
      {features.map((feat, i) => (
        <button
          key={feat.title}
          className={`${styles.navDot} ${i === activeIndex ? styles.navDotActive : ""}`}
          onClick={() => handleClick(i)}
          aria-label={`Go to ${feat.title}`}
        >
          <span className={styles.navLabel}>{feat.title}</span>
          <span className={styles.navDotInner} />
        </button>
      ))}
    </nav>
  );
}

/* ══════════════════════════════════════
   Features — Main section export

   Orchestrates the full features experience: header with scroll hint,
   floating side navigation, and the sequence of scroll-pinned
   feature sections. Manages active-feature state for the nav.
   ══════════════════════════════════════ */

/**
 * Features — Immersive scroll-driven features showcase section.
 * Renders a hero-style header, a floating side navigation,
 * and a series of scroll-pinned feature reveals.
 *
 * @returns {JSX.Element}
 */
export default function Features() {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [navVisible, setNavVisible] = useState(false);

  /* Show the floating nav only when the features section is in the viewport */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    /* IntersectionObserver watches the section and toggles nav visibility.
       threshold: 0.02 means the nav appears as soon as ~2% of the section
       is visible, providing early orientation for the user. */
    const obs = new IntersectionObserver(
      ([entry]) => setNavVisible(entry.isIntersecting),
      { threshold: 0.02 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /**
   * handleProgress — Callback invoked by each FeatureSection.
   * When a section is in its pinned phase (progress 0–1), it
   * becomes the "active" feature shown in the floating nav.
   *
   * @param {number} index    - Feature index reporting progress
   * @param {number} progress - Pin progress value
   */
  const handleProgress = useCallback((index, progress) => {
    if (progress >= 0 && progress <= 1) {
      /* Functional update avoids re-renders when value hasn't changed */
      setActiveIndex((prev) => (prev !== index ? index : prev));
    }
  }, []);

  return (
    <section id="features" className={styles.section} ref={sectionRef}>
      {/* ── Section header with scroll hint ── */}
      <div className={styles.header}>
        <p className={styles.headerLabel}>Features</p>
        <h2 className={styles.headerTitle}>
          How Vantage powers your business
        </h2>
        <p className={styles.headerSubtitle}>
          Scroll through the core capabilities that make Vantage the
          operating system for productive teams.
        </p>

        {/* Animated scroll hint — bouncing arrow invites the user to scroll */}
        <div className={styles.scrollHint}>
          <span>Scroll to explore</span>
          <svg
            className={styles.scrollArrow}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* ── Floating side navigation (visible when section is in viewport) ── */}
      <FloatingNav
        features={FEATURES}
        activeIndex={activeIndex}
        visible={navVisible}
      />

      {/* ── Feature scroll zones (one per feature) ── */}
      {FEATURES.map((feat, i) => (
        <FeatureSection
          key={feat.title}
          {...feat}
          index={i}
          total={FEATURES.length}
          accentRgb={ACCENT_COLORS[i]}
          onProgress={handleProgress}
        />
      ))}
    </section>
  );
}
