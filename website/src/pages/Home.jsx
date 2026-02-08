/**
 * Home.jsx
 *
 * Landing page that assembles all sections in order:
 * Navbar, Hero, Logo Carousel, Services, Pricing, Call-to-Action, Footer.
 * The Contact Us section lives on its own dedicated page at "/contact".
 *
 * This is the default route ("/") of the website.
 * Each section is a self-contained component imported from
 * the components directory. The Features section lives on its
 * own dedicated page at "/features".
 */

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import LogoCarousel from "../components/LogoCarousel";
import Services from "../components/Services";
import Pricing from "../components/Pricing";
import CallToAction from "../components/CallToAction";
import Footer from "../components/Footer";

/**
 * Home — The full landing page, composed from individual sections.
 * @returns {JSX.Element} The complete home page
 */
export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <LogoCarousel />
      <Services />
      <Pricing />
      <CallToAction />
      <Footer />
    </>
  );
}
