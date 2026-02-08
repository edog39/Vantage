/**
 * LoginPage.jsx
 *
 * Dedicated page for the Login form. Renders the Login component
 * between the Navbar and Footer, giving it its own route ("/login")
 * separate from the home page.
 *
 * Follows the same page-wrapper pattern used by ContactPage and
 * FeaturesPage so every page shares a consistent top-level layout.
 */

import Navbar from "../components/Navbar";
import Login from "../components/Login";
import Footer from "../components/Footer";

/**
 * LoginPage — Standalone page that displays the Login form
 * with persistent navigation (Navbar) and site Footer.
 *
 * @returns {JSX.Element} The login page layout
 */
export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Login />
      <Footer />
    </>
  );
}
