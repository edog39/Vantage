/**
 * FeaturesPage.jsx
 *
 * Dedicated page for the Features section. Renders the full
 * Features component between the Navbar and Footer, giving it
 * its own route ("/features") separate from the home page.
 *
 * This allows users to navigate directly to the features
 * overview without scrolling through the entire landing page.
 */

import Navbar from "../components/Navbar";
import Features from "../components/Features";
import Footer from "../components/Footer";

/**
 * FeaturesPage — Standalone page that displays the Features section
 * with persistent navigation (Navbar) and site Footer.
 *
 * @returns {JSX.Element} The features page layout
 */
export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <Features />
      <Footer />
    </>
  );
}
