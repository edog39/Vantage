/**
 * AppLayout.jsx
 *
 * Visual shell for the authenticated /app area (post-login).
 * Keeps marketing pages (Navbar/Footer) separate from the product UI.
 *
 * Layout includes:
 * - A lightweight top bar with product name + user badge
 * - A centered content container for pages (Dashboard, Onboarding, etc.)
 */

import { Outlet, Link, useNavigate } from "react-router-dom";
import styles from "../../styles/AppLayout.module.css";
import { clearSession, getUser } from "../../lib/session";

/**
 * getUserInitials — Derives user initials for the avatar circle.
 *
 * @param {{ name?: string, email?: string } | null} user - User object
 * @returns {string} Initials string
 */
function getUserInitials(user) {
  const name = user?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => (p[0] || "").toUpperCase()).join("");
  }
  const email = user?.email?.trim();
  return email ? email[0].toUpperCase() : "U";
}

/**
 * AppLayout — Authenticated app shell with top bar + routed content.
 *
 * @returns {import("react").ReactElement} Layout with Outlet for nested routes
 */
export default function AppLayout() {
  const navigate = useNavigate();
  const user = getUser();

  /**
   * handleLogout — Clears local session state and returns to login.
   *
   * @returns {void}
   */
  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <Link to="/app" className={styles.brandLink} aria-label="Vantage dashboard">
              <span className={styles.brandMark} aria-hidden="true">V</span>
              <span className={styles.brandText}>Vantage</span>
            </Link>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.userPill} title={user?.email || "Signed in user"}>
              <div className={styles.avatar} aria-hidden="true">
                {getUserInitials(user)}
              </div>
              <div className={styles.userText}>
                <div className={styles.userName}>{user?.name || "Account"}</div>
                <div className={styles.userEmail}>{user?.email || ""}</div>
              </div>
            </div>

            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

