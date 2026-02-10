/**
 * OnboardingPage.jsx
 *
 * Post-login onboarding wizard for business context + data connections.
 * This is the first screen a new user sees after signing in.
 *
 * MVP behavior:
 * - Collects a small set of answers (business type, goal, audience, website URL, focus).
 * - Stores onboarding answers in localStorage via `lib/session.js`.
 * - Marks onboarding complete and routes the user to `/app`.
 *
 * Future upgrades:
 * - Persist onboarding to Neon via `/api/preferences` (or a dedicated endpoint)
 * - Add OAuth flows for GA / Search Console
 * - Trigger a website scan and generate initial tasks automatically
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/Onboarding.module.css";
import {
  getOnboarding,
  setOnboarding,
  setOnboardingCompleted,
} from "../../lib/session";

const STEPS = [
  { id: "business", title: "About your business" },
  { id: "connect", title: "Connect your data" },
  { id: "focus", title: "Pick a focus" },
];

/**
 * clampStepIndex — Bounds a step index to valid range.
 *
 * @param {number} idx - Proposed index
 * @returns {number} Clamped index
 */
function clampStepIndex(idx) {
  return Math.max(0, Math.min(STEPS.length - 1, idx));
}

/**
 * normalizeUrl — Normalizes a user-entered website value into a URL-ish string.
 * Keeps this intentionally light (we don't want to reject common inputs).
 *
 * @param {string} raw - User input
 * @returns {string} Normalized value
 */
function normalizeUrl(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * OnboardingPage — Multi-step onboarding wizard.
 *
 * @returns {import("react").ReactElement} Onboarding UI
 */
export default function OnboardingPage() {
  const navigate = useNavigate();

  const saved = useMemo(() => getOnboarding() || {}, []);

  /* Step navigation state */
  const [stepIdx, setStepIdx] = useState(0);

  /* Answers (MVP set) */
  const [businessType, setBusinessType] = useState(saved.businessType || "");
  const [primaryGoal, setPrimaryGoal] = useState(saved.primaryGoal || "");
  const [audience, setAudience] = useState(saved.audience || "");
  const [monthlyVisitors, setMonthlyVisitors] = useState(saved.monthlyVisitors || "");
  const [websiteUrl, setWebsiteUrl] = useState(saved.websiteUrl || "");
  const [connectIntents, setConnectIntents] = useState(saved.connectIntents || {
    googleAnalytics: false,
    searchConsole: false,
  });
  const [focus, setFocus] = useState(saved.focus || "");

  const step = STEPS[stepIdx];

  /**
   * canContinueBusinessStep — Determines whether all required
   * business step fields have been filled in by the user.
   *
   * @returns {boolean} True if all required fields are non-empty
   */
  const canContinueBusinessStep =
    Boolean(businessType) &&
    Boolean(primaryGoal) &&
    Boolean(audience) &&
    Boolean(monthlyVisitors);

  /**
   * canFinishFocusStep — Determines whether the focus step
   * has a selection, which is required before finishing.
   *
   * @returns {boolean} True if a focus value has been chosen
   */
  const canFinishFocusStep = Boolean(focus);

  /**
   * persistDraft — Saves current answers as a draft.
   *
   * @returns {void}
   */
  const persistDraft = () => {
    setOnboarding({
      businessType,
      primaryGoal,
      audience,
      monthlyVisitors,
      websiteUrl: normalizeUrl(websiteUrl),
      connectIntents,
      focus,
      updatedAt: new Date().toISOString(),
    });
  };

  /**
   * next — Advances to the next step (saving draft).
   *
   * @returns {void}
   */
  const next = () => {
    persistDraft();
    setStepIdx((i) => clampStepIndex(i + 1));
  };

  /**
   * back — Goes to the previous step (saving draft).
   *
   * @returns {void}
   */
  const back = () => {
    persistDraft();
    setStepIdx((i) => clampStepIndex(i - 1));
  };

  /**
   * finish — Marks onboarding complete and routes to dashboard.
   *
   * @returns {void}
   */
  const finish = () => {
    persistDraft();
    setOnboardingCompleted(true);
    navigate("/app");
  };

  /**
   * toggleIntent — Updates a connect-intent toggle.
   *
   * @param {"googleAnalytics" | "searchConsole"} key - Intent key
   * @returns {void}
   */
  const toggleIntent = (key) => {
    setConnectIntents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Let’s set up Vantage for your business</h1>
        <p className={styles.subtitle}>
          Answer a few quick questions so we can generate real insights and a task plan that fits your goals.
        </p>
      </div>

      <div className={styles.card}>
        {/* Progress */}
        <div className={styles.progress}>
          <div className={styles.progressTop}>
            <div className={styles.stepTitle}>{step.title}</div>
            <div className={styles.stepCount}>
              Step {stepIdx + 1} of {STEPS.length}
            </div>
          </div>
          <div className={styles.progressBar} aria-hidden="true">
            <div
              className={styles.progressFill}
              style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        {step.id === "business" && (
          <section className={styles.section}>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ob-business-type">
                  Business type
                </label>
                <select
                  id="ob-business-type"
                  className={styles.select}
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                >
                  <option value="">Select one…</option>
                  <option value="saas">SaaS</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="agency">Agency</option>
                  <option value="content">Content / Media</option>
                  <option value="local">Local services</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="ob-audience">
                  Audience
                </label>
                <select
                  id="ob-audience"
                  className={styles.select}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                >
                  <option value="">Select one…</option>
                  <option value="b2b">B2B</option>
                  <option value="b2c">B2C</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="ob-goal">
                  Primary goal (next 90 days)
                </label>
                <select
                  id="ob-goal"
                  className={styles.select}
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                >
                  <option value="">Select one…</option>
                  <option value="traffic">Increase website traffic</option>
                  <option value="conversion">Improve conversion rate</option>
                  <option value="leads">Get more leads / demo requests</option>
                  <option value="retention">Improve retention / engagement</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="ob-visitors">
                  Monthly visitors (estimate)
                </label>
                <select
                  id="ob-visitors"
                  className={styles.select}
                  value={monthlyVisitors}
                  onChange={(e) => setMonthlyVisitors(e.target.value)}
                >
                  <option value="">Select one…</option>
                  <option value="0-1k">0–1k</option>
                  <option value="1k-10k">1k–10k</option>
                  <option value="10k-100k">10k–100k</option>
                  <option value="100k+">100k+</option>
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <div />
              <button
                type="button"
                className={styles.primary}
                onClick={next}
                disabled={!canContinueBusinessStep}
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step.id === "connect" && (
          <section className={styles.section}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ob-website">
                Your website
              </label>
              <input
                id="ob-website"
                className={styles.input}
                placeholder="yourdomain.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
              <div className={styles.help}>
                We’ll use this to analyze pages, funnels, and recommend high-impact improvements.
              </div>
            </div>

            <div className={styles.tileGrid}>
              <button
                type="button"
                className={`${styles.tile} ${connectIntents.googleAnalytics ? styles.tileOn : ""}`}
                onClick={() => toggleIntent("googleAnalytics")}
              >
                <div className={styles.tileTitle}>Google Analytics</div>
                <div className={styles.tileDesc}>Traffic sources, conversions, drop-offs (intent only for now)</div>
              </button>

              <button
                type="button"
                className={`${styles.tile} ${connectIntents.searchConsole ? styles.tileOn : ""}`}
                onClick={() => toggleIntent("searchConsole")}
              >
                <div className={styles.tileTitle}>Google Search Console</div>
                <div className={styles.tileDesc}>Queries, rankings, CTR opportunities (intent only for now)</div>
              </button>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={back}>
                Back
              </button>
              <button type="button" className={styles.primary} onClick={next}>
                Continue
              </button>
            </div>
          </section>
        )}

        {step.id === "focus" && (
          <section className={styles.section}>
            <div className={styles.focusGrid}>
              {[
                { id: "conversion", title: "Improve conversion", desc: "Turn more visitors into customers/leads." },
                { id: "seo", title: "Increase organic traffic", desc: "Grow search impressions and clicks." },
                { id: "funnel", title: "Fix funnel drop-offs", desc: "Identify where users abandon and why." },
                { id: "performance", title: "Speed & UX", desc: "Improve Core Web Vitals and usability." },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.focusCard} ${focus === item.id ? styles.focusOn : ""}`}
                  onClick={() => setFocus(item.id)}
                >
                  <div className={styles.focusTitle}>{item.title}</div>
                  <div className={styles.focusDesc}>{item.desc}</div>
                </button>
              ))}
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.secondary} onClick={back}>
                Back
              </button>
              <button
                type="button"
                className={styles.primary}
                onClick={finish}
                disabled={!canFinishFocusStep}
              >
                Generate my plan
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

