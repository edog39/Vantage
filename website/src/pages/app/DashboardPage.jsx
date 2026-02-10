/**
 * DashboardPage.jsx
 *
 * Primary post-login landing page for Vantage (/app).
 * Displays a lightweight "today" summary plus a prioritized task list.
 *
 * This is intentionally minimal for MVP:
 * - Reads onboarding context (if available) to personalize messaging
 * - Fetches tasks from `/api/tasks` using the stored user id
 *
 * Future upgrades:
 * - Real analytics cards (traffic, conversion, funnel)
 * - "Insights → tasks" generation pipeline
 * - Filters/sorting based on `preferences`
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../../styles/Dashboard.module.css";
import { requestJson } from "../../lib/apiClient";
import { getOnboarding, getUser } from "../../lib/session";

/**
 * formatFocus — Turns a stored focus id into a human label.
 *
 * @param {string} focus - Focus id
 * @returns {string} Human-friendly label
 */
function formatFocus(focus) {
  switch (focus) {
    case "conversion": return "Conversion";
    case "seo": return "SEO";
    case "funnel": return "Funnel";
    case "performance": return "Performance";
    default: return "Growth";
  }
}

/**
 * DashboardPage — Fetches tasks and shows the app overview.
 *
 * @returns {import("react").ReactElement} Dashboard UI
 */
export default function DashboardPage() {
  const user = useMemo(() => getUser(), []);
  const onboarding = useMemo(() => getOnboarding(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let cancelled = false;

    /**
     * load — Loads tasks for the current user.
     *
     * @returns {Promise<void>}
     */
    async function load() {
      setLoading(true);
      setError("");

      try {
        if (!user?.id) {
          setTasks([]);
          return;
        }

        // requestJson() — Fetch wrapper that returns parsed JSON and throws ApiError on failure.
        const data = await requestJson(`/api/tasks?userId=${encodeURIComponent(user.id)}`);
        if (!cancelled) {
          setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Unable to load tasks.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const focusLabel = formatFocus(onboarding?.focus);

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            {onboarding?.websiteUrl
              ? <>Focus: <strong>{focusLabel}</strong> • Website: <strong>{onboarding.websiteUrl}</strong></>
              : <>Focus: <strong>{focusLabel}</strong> • <Link to="/app/onboarding" className={styles.link}>Finish setup</Link></>
            }
          </p>
        </div>

        <Link to="/app/onboarding" className={styles.secondaryBtn}>
          Update onboarding
        </Link>
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Your tasks</div>
            <div className={styles.cardMeta}>
              {loading ? "Loading…" : `${tasks.length} total`}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {!loading && !error && tasks.length === 0 && (
            <div className={styles.empty}>
              No tasks yet. Once we connect analytics and scan your site, Vantage will generate your first set of recommended actions.
            </div>
          )}

          <ul className={styles.list} aria-busy={loading}>
            {tasks.slice(0, 10).map((t) => (
              <li key={t.id} className={styles.item}>
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>{t.title}</div>
                  <div className={styles.itemMeta}>
                    {(t.category || "general").toUpperCase()} • Priority {t.priority ?? 3}
                  </div>
                </div>
                <div className={styles.itemRight}>
                  <span className={`${styles.badge} ${t.completed ? styles.badgeDone : styles.badgeTodo}`}>
                    {t.completed ? "Done" : "To do"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Next: connect data</div>
            <div className={styles.cardMeta}>Unlock real analytics</div>
          </div>

          <div className={styles.nextList}>
            <div className={styles.nextItem}>
              <div className={styles.nextTitle}>Connect Google Analytics</div>
              <div className={styles.nextDesc}>So we can see traffic sources, conversions, and drop-offs.</div>
            </div>
            <div className={styles.nextItem}>
              <div className={styles.nextTitle}>Connect Search Console</div>
              <div className={styles.nextDesc}>So we can find queries and pages with big SEO upside.</div>
            </div>
            <div className={styles.nextItem}>
              <div className={styles.nextTitle}>Confirm your website</div>
              <div className={styles.nextDesc}>So we can analyze page structure and generate actionable tasks.</div>
            </div>
          </div>

          <div className={styles.nextActions}>
            <Link to="/app/onboarding" className={styles.primaryBtn}>
              Go to setup
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

