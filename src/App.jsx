import { useCallback, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";
import Daemon from "./daemon/Daemon";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SectionHeading from "./components/SectionHeading";
import Terminal from "./components/Terminal";
import Rack, { Legend } from "./components/Rack";
import { HUBS, buildUnits, detectHub } from "./hubs";

const App = () => {
  const hub = useMemo(() => HUBS[detectHub()], []);
  const units = useMemo(() => buildUnits(hub.items), [hub]);
  const [openSlug, setOpenSlug] = useState(null);

  useEffect(() => {
    document.title = `${hub.rack} / ${hub.title}`;
  }, [hub]);

  // One drawer at a time; Esc closes it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpenSlug(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = useCallback((slug) => setOpenSlug((cur) => (cur === slug ? null : slug)), []);

  const openUnit = useCallback((slug) => {
    setOpenSlug(slug);
    requestAnimationFrame(() =>
      document.getElementById(`unit-${slug}`)?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      })
    );
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <a href="#rack" className="skip-link">Skip to the rack</a>
      <Daemon />
      <Header hub={hub} />
      <main className="page">
        <SectionHeading command={`$ ls ${hub.rack.toLowerCase()}/`} title={hub.title} />
        <p className="page-intro">{hub.intro}</p>
        <div className="stage">
          <Legend />
          <div className="stage-main">
            <Terminal hub={hub} units={units} openUnit={openUnit} />
            <Rack hub={hub} units={units} openSlug={openSlug} onToggle={toggle} />
          </div>
        </div>
      </main>
      <Footer hub={hub} />
    </MotionConfig>
  );
};

export default App;
