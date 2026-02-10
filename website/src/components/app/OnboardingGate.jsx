/**
 * OnboardingGate.jsx
 *
 * Route guard that ensures onboarding runs once before a user
 * reaches the main dashboard.
 *
 * Current implementation uses localStorage (see `lib/session.js`).
 * Later, you can switch this to check a server-side preference
 * (synced across devices) without changing the calling code.
 */

import { Navigate } from "react-router-dom";
import { getOnboardingCompleted } from "../../lib/session";

/**
 * OnboardingGate — Redirects first-time users to `/app/onboarding`.
 *
 * @param {{ children: import("react").ReactNode }} props - Component props
 * @returns {import("react").ReactElement} Children when complete; redirect otherwise
 */
export default function OnboardingGate({ children }) {
  const completed = getOnboardingCompleted();

  if (!completed) {
    return <Navigate to="/app/onboarding" replace />;
  }

  return <>{children}</>;
}

