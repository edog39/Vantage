/**
 * SignUpPage.jsx
 *
 * Dedicated page for the Sign Up form. Renders the SignUp component
 * between the Navbar and Footer, giving it its own route ("/signup")
 * separate from the home and login pages.
 *
 * Follows the same page-wrapper pattern used by LoginPage, ContactPage,
 * and FeaturesPage so every page shares a consistent top-level layout.
 */

import Navbar from "../components/Navbar";
import SignUp from "../components/SignUp";
import Footer from "../components/Footer";

/**
 * SignUpPage — Standalone page that displays the Sign Up form
 * with persistent navigation (Navbar) and site Footer.
 *
 * @returns {JSX.Element} The sign-up page layout
 */
export default function SignUpPage() {
  return (
    <>
      <Navbar />
      <SignUp />
      <Footer />
    </>
  );
}
