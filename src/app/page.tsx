"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, Menu, Pause, Play, Sparkles, X } from "lucide-react";
import ProjectCards from "@/components/ProjectCards";
import { useCallback, useEffect, useRef, useState } from "react";
import AskBuckyLauncher from "@/components/AskBuckyLauncher";
import ElectronicOcean from "@/components/ElectronicOcean";
import {
  resolveOceanPerformance,
  type OceanMotionPreference,
  type OceanPerformanceSettings,
} from "@/lib/ocean-performance";

const oceanMotionPreferenceKey = "bucky-ocean-motion";

type NavigatorWithPerformanceHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://buckyqian.com/#website",
      url: "https://buckyqian.com/",
      name: "Bucky Qian",
      publisher: { "@id": "https://buckyqian.com/#person" },
    },
    {
      "@type": "ProfilePage",
      "@id": "https://buckyqian.com/#profile",
      url: "https://buckyqian.com/",
      name: "Bucky Qian | AI Product Engineer",
      description:
        "AI Product Engineer building AI agents, RAG systems, LLM applications, and production software with TypeScript.",
      dateModified: "2026-10-10",
      isPartOf: { "@id": "https://buckyqian.com/#website" },
      mainEntity: { "@id": "https://buckyqian.com/#person" },
      about: { "@id": "https://buckyqian.com/#person" },
      author: { "@id": "https://buckyqian.com/#person" },
      publisher: { "@id": "https://buckyqian.com/#person" },
    },
    {
      "@type": "Person",
      "@id": "https://buckyqian.com/#person",
      name: "Bucky Qian",
      url: "https://buckyqian.com/",
      jobTitle: "AI Product Engineer",
      description:
        "AI Product Engineer building AI agents, RAG systems, LLM applications, and production software with TypeScript.",
      email: "mailto:BuckQianWorking@gmail.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Mountain View",
        addressRegion: "CA",
        addressCountry: "US",
      },
      alumniOf: [
        { "@type": "CollegeOrUniversity", name: "Trine University" },
        { "@type": "CollegeOrUniversity", name: "University of California, Santa Cruz" },
      ],
      sameAs: [
        "https://www.linkedin.com/in/hao-q-156421170/",
        "https://github.com/BuckyQ",
      ],
      knowsAbout: [
        "Applied AI",
        "AI Agents",
        "RAG",
        "RAG Evaluation",
        "LLM Applications",
        "Tool Calling",
        "Structured Outputs",
        "TypeScript",
        "React",
        "Next.js",
      ],
    },
  ],
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [askBuckyOpen, setAskBuckyOpen] = useState(false);
  const [oceanPerformance, setOceanPerformance] =
    useState<OceanPerformanceSettings | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.055]);
  const oceanOpacity = useTransform(scrollYProgress, [0, 0.58, 1], [1, 0.88, 0.14]);
  const oceanBrightness = useTransform(scrollYProgress, [0, 0.62, 1], ["brightness(1)", "brightness(.7)", "brightness(.24)"]);
  const heroFade = useTransform(scrollYProgress, [0, 0.58, 1], [1, 0.9, 0]);
  const heroLift = useTransform(scrollYProgress, [0, 0.5, 1], [0, -10, -76]);
  const transitionShade = useTransform(scrollYProgress, [0, 0.55, 1], [0.08, 0.32, 1]);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateOceanPerformance = () => {
      const navigatorWithHints = navigator as NavigatorWithPerformanceHints;
      let storedPreference: OceanMotionPreference = null;

      try {
        const storedValue = window.localStorage.getItem(
          oceanMotionPreferenceKey,
        );
        if (storedValue === "on" || storedValue === "off") {
          storedPreference = storedValue;
        }
      } catch {
        // Automatic device hints still provide a safe default without storage.
      }

      setOceanPerformance(
        resolveOceanPerformance({
          deviceMemory: navigatorWithHints.deviceMemory,
          hardwareConcurrency: navigator.hardwareConcurrency,
          prefersReducedMotion: motionQuery.matches,
          saveData: navigatorWithHints.connection?.saveData,
          storedPreference,
        }),
      );
    };

    updateOceanPerformance();
    motionQuery.addEventListener?.("change", updateOceanPerformance);
    return () =>
      motionQuery.removeEventListener?.("change", updateOceanPerformance);
  }, []);

  const handleOceanPerformancePressure = useCallback(
    (action: "pause" | "reduce") => {
      setOceanPerformance((current) => {
        if (!current) return current;
        if (action === "reduce") {
          return current.quality === "reduced"
            ? current
            : { ...current, quality: "reduced" };
        }

        return current.motionEnabled
          ? { ...current, motionEnabled: false, quality: "reduced" }
          : current;
      });
    },
    [],
  );

  const toggleOceanMotion = useCallback(() => {
    setOceanPerformance((current) => {
      if (!current) return current;
      const motionEnabled = !current.motionEnabled;

      try {
        window.localStorage.setItem(
          oceanMotionPreferenceKey,
          motionEnabled ? "on" : "off",
        );
      } catch {
        // The current page still honors the preference when storage is blocked.
      }

      return {
        ...current,
        motionEnabled,
        quality:
          current.constrainedDevice || !motionEnabled ? "reduced" : "full",
      };
    });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const menu = mobileNavRef.current;
    const menuButton = menuButtonRef.current;
    const menuLinks = Array.from(menu?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);
    menuLinks[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        window.requestAnimationFrame(() => menuButton?.focus());
        return;
      }

      if (event.key !== "Tab" || !menuButton || menuLinks.length === 0) return;

      const focusableElements: HTMLElement[] = [...menuLinks, menuButton];
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const closeMobileMenu = () => {
    const shouldRestoreFocus = menuOpen;
    setMenuOpen(false);
    if (shouldRestoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <header className="site-header compact-home-header">
        <a className="wordmark" href="#top" aria-label="Bucky Qian home">
          Bucky Qian <span>AI Product Engineer</span>
        </a>
        <nav
          className={menuOpen ? "nav-open" : ""}
          id="primary-navigation"
          ref={mobileNavRef}
          aria-label="Primary navigation"
        >
          <a href="/about" onClick={closeMobileMenu}>About</a>
          <a href="#work" onClick={closeMobileMenu}>Selected work</a>
          <a href="/projects" onClick={closeMobileMenu}>Projects</a>
          <a href="#contact" onClick={closeMobileMenu}>Contact</a>
          <a className="mobile-nav-cta" href="mailto:BuckQianWorking@gmail.com" onClick={closeMobileMenu}>
            Start a conversation <ArrowUpRight size={16} />
          </a>
        </nav>
        <a className="header-contact" href="mailto:BuckQianWorking@gmail.com">
          Start a conversation <ArrowUpRight size={15} />
        </a>
        <button
          className="menu-button"
          ref={menuButtonRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        >
          <span>{menuOpen ? "Close" : "Menu"}</span>
          {menuOpen ? <X size={17} /> : <Menu size={17} />}
        </button>
      </header>

      <main className="compact-home" id="main-content" tabIndex={-1}>

      <section className="hero" id="top" ref={heroRef} aria-labelledby="hero-title">
        <motion.div
          className="hero-media hero-ocean-media"
          style={{
            scale: prefersReducedMotion ? 1 : heroScale,
            opacity: prefersReducedMotion ? 1 : oceanOpacity,
            filter: prefersReducedMotion ? "brightness(.86)" : oceanBrightness,
          }}
        >
          {oceanPerformance ? (
            <ElectronicOcean
              motionEnabled={oceanPerformance.motionEnabled}
              onPerformancePressure={handleOceanPerformancePressure}
              quality={oceanPerformance.quality}
            />
          ) : (
            <div className="electronic-ocean" aria-hidden="true" />
          )}
        </motion.div>
        <div className="hero-shade" />
        <div className="hero-sea-light" aria-hidden="true" />
        <motion.div
          className="hero-transition-shade"
          style={{ opacity: prefersReducedMotion ? 0.55 : transitionShade }}
          aria-hidden="true"
        />
        <div className="hero-continuity-lines" aria-hidden="true"><i /><i /></div>
        <motion.div
          className="hero-content"
          style={{
            opacity: prefersReducedMotion ? 1 : heroFade,
            y: prefersReducedMotion ? 0 : heroLift,
          }}
        >
          <div className="hero-layout">
            <div className="hero-copy">
              <p className="hero-status"><span /> Bucky Qian · Mountain View, California</p>
              <h1 className="hero-title" id="hero-title">AI Product<br /><em>Engineer.</em></h1>
              <p className="hero-summary">I turn AI workflows into products people can use.</p>
            </div>

          </div>
          <div className="hero-lower">
            <div className="hero-actions">
              <a className="hero-action hero-action-work" href="#work">
                View selected work <ArrowDown aria-hidden="true" size={16} />
              </a>
              <button
                aria-controls="ask-bucky-drawer"
                aria-expanded={askBuckyOpen}
                className="hero-action hero-action-ai"
                onClick={() => setAskBuckyOpen(true)}
                type="button"
              >
                Ask Bucky AI <Sparkles aria-hidden="true" size={15} />
              </button>
            </div>
          </div>
        </motion.div>
        {oceanPerformance ? (
          <button
            aria-label={
              oceanPerformance.motionEnabled
                ? "Pause animated ocean"
                : "Enable animated ocean"
            }
            aria-pressed={oceanPerformance.motionEnabled}
            className="ocean-motion-toggle"
            data-quality={oceanPerformance.quality}
            onClick={toggleOceanMotion}
            type="button"
          >
            {oceanPerformance.motionEnabled ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
            <span>
              {oceanPerformance.motionEnabled ? "Pause ocean" : "Enable ocean"}
            </span>
            <small>
              {oceanPerformance.quality === "reduced" ? "Low power" : "Full"}
            </small>
          </button>
        ) : null}
      </section>

      <section className="home-work" id="work" aria-labelledby="selected-work-title">
        <div className="home-work-heading"><h2 id="selected-work-title">Selected work.</h2><a href="/projects">All projects <ArrowUpRight aria-hidden="true" /></a></div>
        <ProjectCards selectedOnly />
      </section>
      </main>

      <footer className="compact-contact" id="contact">

        <div className="contact-main">
          <p className="section-label">Contact</p>
          <h2>Let&apos;s build something useful.</h2>
          <nav className="contact-links" aria-label="Contact links">
            <a href="mailto:BuckQianWorking@gmail.com">Email</a>
            <a href="https://github.com/BuckyQ" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/hao-q-156421170/" target="_blank" rel="noreferrer">LinkedIn</a>
            <a href="/Bucky-Qian-Resume.pdf" download>Resume</a>
          </nav>
          <p className="resume-context">Resume + selected AI projects</p>
          <a className="contact-email" href="mailto:BuckQianWorking@gmail.com">
            Start a conversation <ArrowUpRight />
          </a>
        </div>
        <div className="footer-meta">
          <p>
            Bucky Qian · AI Product Engineer<br />Mountain View, California
            <time className="footer-freshness" dateTime="2026-10-10">Last updated / Oct 2026</time>
          </p>
          <span>© 2026 Bucky Qian</span>
        </div>
      </footer>
      <AskBuckyLauncher open={askBuckyOpen} onOpenChange={setAskBuckyOpen} />
    </>
  );
}
