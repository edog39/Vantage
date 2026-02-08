/**
 * ContactPage.jsx
 *
 * Dedicated page for the Contact Us section. Renders the
 * AboutUs (contact) component between the Navbar and Footer,
 * giving it its own route ("/contact") separate from the home page.
 *
 * This allows users to navigate directly to the contact /
 * founder profile without scrolling through the entire landing page.
 */

import Navbar from "../components/Navbar";
import AboutUs from "../components/AboutUs";
import Footer from "../components/Footer";

/**
 * ContactPage — Standalone page that displays the Contact Us section
 * with persistent navigation (Navbar) and site Footer.
 *
 * @returns {JSX.Element} The contact page layout
 */
export default function ContactPage() {
  return (
    <>
      <Navbar />
      <AboutUs />
      <Footer />
    </>
  );
}
