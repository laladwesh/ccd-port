import { AnimatePresence, motion } from "framer-motion";

export const U = 64; // height of one rack unit, in px
const SPRING = { type: "spring", stiffness: 300, damping: 30 };

// A strip of the rack rail: two screw holes per U, and the U numbers on the left rail.
const Rail = ({ u, size, numbered }) => (
  <svg className="unit-rail" width="28" height={U * size} viewBox={`0 0 28 ${U * size}`} aria-hidden="true">
    <rect width="28" height={U * size} fill="#1A1A1A" />
    {Array.from({ length: size }, (_, i) => (
      <g key={i}>
        <circle cx="14" cy={i * U + 14} r="3.5" fill="#0D0D0D" stroke="#5A5A5A" strokeWidth="1" />
        <circle cx="14" cy={i * U + 50} r="3.5" fill="#0D0D0D" stroke="#5A5A5A" strokeWidth="1" />
        {numbered && (
          <text x="14" y={i * U + 36} textAnchor="middle" fontSize="10" fill="#8A8A8A" fontFamily="JetBrains Mono, monospace">
            {String(u + i).padStart(2, "0")}
          </text>
        )}
      </g>
    ))}
    <line x1={numbered ? 27.5 : 0.5} x2={numbered ? 27.5 : 0.5} y1="0" y2={U * size} stroke="#2A2A2A" />
  </svg>
);

// Vent slots: purely decorative, taller on 2U units.
const Vents = ({ size }) => (
  <svg className="unit-vents" width="72" height={U * size - 24} viewBox={`0 0 72 ${U * size - 24}`} aria-hidden="true">
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={i * 9 + 2} y="0" width="3" height={U * size - 24} fill="#0D0D0D" stroke="#2A2A2A" strokeWidth="1" />
    ))}
  </svg>
);

const Led = ({ mine }) => <span className={`led ${mine ? "led--amber" : "led--mint"}`} aria-hidden="true" />;

const Field = ({ label, children }) => (
  <div className="drawer-field">
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

const Drawer = ({ unit, onClose }) => {
  const has = (v) => (Array.isArray(v) ? v.length > 0 : Boolean(v));
  return (
    <motion.div
      className="drawer"
      id={`drawer-${unit.slug}`}
      role="region"
      aria-label={`${unit.name} details`}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={SPRING}
    >
      <div className="drawer-head">
        <h2 className="sub-heading">{unit.name}</h2>
        <button type="button" className="btn drawer-close" onClick={onClose}>
          close &times;
        </button>
      </div>

      <p className="drawer-desc">{unit.description}</p>

      <dl className="drawer-fields">
        {has(unit.role) && <Field label="role">{unit.role}</Field>}
        {has(unit.stack) && (
          <Field label="stack">
            <ul className="drawer-stack">
              {unit.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Field>
        )}
        <Field label="source">
          <span className="drawer-owner">
            <Led mine={unit.mine} />
            {unit.mine ? `built by me (${unit.owner})` : `institute / org repo (${unit.owner})`}
          </span>
        </Field>
      </dl>

      {has(unit.highlights) && (
        <ul className="drawer-highlights">
          {unit.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}

      {unit.screenshot && <img className="drawer-shot" src={unit.screenshot} alt={`${unit.name} screenshot`} loading="lazy" />}

      <div className="drawer-links">
        {unit.url && (
          <a className="btn-primary" href={unit.url} target="_blank" rel="noopener noreferrer">
            open live site
          </a>
        )}
        {unit.github && (
          <a className="btn" href={unit.github} target="_blank" rel="noopener noreferrer">
            source repo
          </a>
        )}
        {unit.appStore && (
          <a className="btn" href={unit.appStore} target="_blank" rel="noopener noreferrer">
            App Store
          </a>
        )}
        {unit.playStore && (
          <a className="btn" href={unit.playStore} target="_blank" rel="noopener noreferrer">
            Play Store
          </a>
        )}
      </div>
    </motion.div>
  );
};

const Unit = ({ unit, open, onToggle }) => (
  <motion.li className="unit-slot" layout="position" transition={SPRING}>
    <button
      type="button"
      id={`unit-${unit.slug}`}
      className="unit"
      style={{ height: U * unit.size }}
      aria-expanded={open}
      aria-controls={`drawer-${unit.slug}`}
      onClick={() => onToggle(unit.slug)}
    >
      <Rail u={unit.u} size={unit.size} numbered />
      <span className="unit-face">
        <span className="unit-text">
          <span className="unit-name">{unit.name}</span>
          <span className="unit-model">{unit.model}</span>
        </span>
        <Vents size={unit.size} />
        <Led mine={unit.mine} />
        <span className="sr-only">{unit.mine ? "built by me" : "institute or org repo"}</span>
      </span>
      <Rail u={unit.u} size={unit.size} />
    </button>
    <AnimatePresence initial={false}>{open && <Drawer unit={unit} onClose={() => onToggle(unit.slug)} />}</AnimatePresence>
  </motion.li>
);

export const Legend = () => (
  <aside className="legend" aria-label="Legend">
    <p className="legend-title">legend</p>
    <ul>
      <li>
        <span className="led led--mint led--print" aria-hidden="true" />
        mint: institute / org repo
      </li>
      <li>
        <span className="led led--amber led--print" aria-hidden="true" />
        amber: built by me (laladwesh)
      </li>
    </ul>
    <p className="legend-note">2U units list a stack. Click a unit to pull it out, Esc to push it back.</p>
  </aside>
);

const Rack = ({ hub, units, openSlug, onToggle }) => (
  <section id="rack" className="rack" aria-label={`${hub.rack} server rack`}>
    <div className="rack-plate">
      {hub.rack} / {hub.plate}
    </div>
    <ul className="rack-units">
      {units.map((u) => (
        <Unit key={u.slug} unit={u} open={openSlug === u.slug} onToggle={onToggle} />
      ))}
    </ul>
    <div className="rack-base" aria-hidden="true" />
  </section>
);

export default Rack;
