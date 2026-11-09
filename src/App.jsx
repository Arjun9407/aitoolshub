import { AppProvider } from "./context/AppContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Directory from "./components/Directory.jsx";
import FreeTools from "./components/FreeTools.jsx";
import { Ticker, Featured, Categories, CompareTable, Blog, Testimonials, FAQ, Footer, SiteIndex } from "./components/Sections.jsx";
import { Modal, CommandPalette, Toast, BackToTop, CookieNotice } from "./components/Overlays.jsx";

export default function App() {
  return (
    <AppProvider>
      <a href="#ai-tools" className="skip-link">
        Skip to tools
      </a>
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <Featured />
        <Categories />
        <Directory />
        <FreeTools />
        <CompareTable />
        <Blog />
        <Testimonials />
        <FAQ />
      </main>
      <SiteIndex />
      <Footer />
      <BackToTop />
      <Modal />
      <CommandPalette />
      <Toast />
      <CookieNotice />
    </AppProvider>
  );
}
