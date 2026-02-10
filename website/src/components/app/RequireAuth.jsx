/**
 * RequireAuth.jsx
 *
 * Route guard for the /app area.
 * Ensures a user has a session token before accessing post-login routes.
 * If no token exists, the user is redirected to /login.
 */

import { Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "../../lib/session";

/**
 * RequireAuth — Protects children behind a simple auth check.
 *
 * @param {{ children: import("react").ReactNode }} props - Component props
 * @returns {import("react").ReactElement} Rendered children or redirect
 */
export default function RequireAuth({ children }) {
  const location = useLocation();

  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

