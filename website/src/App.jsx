/**
 * App.jsx
 *
 * Root component and router shell for the Vantage website.
 * Currently renders routes for Home, a dedicated Features page,
 * a dedicated Contact page, and the Login page. Additional routes
 * for Dashboard, Signup, and Onboarding can be added later.
 *
 * Includes a ScrollHandler helper that:
 *  - Scrolls to a hash target (e.g. #pricing) when the URL
 *    contains a fragment, enabling in-page section navigation.
 *  - Scrolls to the top of the page on plain route changes
 *    (e.g. navigating to /features with no hash).
 */

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import FeaturesPage from "./pages/FeaturesPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

/**
 * ScrollHandler — Watches both the pathname and hash of the
 * current URL. When a hash fragment is present (e.g. #pricing),
 * it waits for the new route to render and then smooth-scrolls
 * to the matching element. Otherwise it scrolls to the top.
 *
 * Placed inside BrowserRouter so it has access to the router context.
 *
 * @returns {null} Renders nothing; side-effect only.
 */
function ScrollHandler() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      /*
       * Allow React to finish rendering the new route before
       * attempting to locate the hash target in the DOM. A short
       * delay (50 ms) is enough to cover the render cycle while
       * remaining imperceptible to the user.
       */
      const timerId = setTimeout(() => {
        const target = document.getElementById(hash.slice(1));
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);

      return () => clearTimeout(timerId);
    }

    /* No hash — scroll to the very top of the page */
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

/**
 * App — Top-level component that wraps the page in a router.
 * Defines routes for the home page, features page, and contact page.
 * ScrollHandler ensures every navigation either targets a specific
 * section (via hash) or starts at the top of the page.
 *
 * @returns {JSX.Element} The routed application
 */
export default function App() {
  return (
    <BrowserRouter>
      <ScrollHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </BrowserRouter>
  );
}
