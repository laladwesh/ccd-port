import { useEffect, useMemo, useRef, useState } from "react";
import { HUBS, PORTFOLIO, hubHref } from "../hubs";

const COMMANDS = [
  { name: "help", usage: "help", desc: "list commands" },
  { name: "ls", usage: "ls", desc: "list the units in this rack" },
  { name: "ssh", usage: "ssh <unit>", desc: "pull a unit out of the rack" },
  { name: "open", usage: "open <unit>", desc: "open the unit's live site" },
  { name: "whoami", usage: "whoami", desc: "who runs this rack" },
  { name: "cd", usage: "cd ~", desc: "go to avinashgupta.in" },
  { name: "clear", usage: "clear", desc: "clear the screen" },
  { name: "exit", usage: "exit", desc: "close the terminal" },
];

const common = (words) => {
  let p = words[0];
  for (const w of words) while (!w.startsWith(p)) p = p.slice(0, -1);
  return p;
};

const Terminal = ({ hub, units, openUnit }) => {
  const [lines, setLines] = useState([]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState([]);
  const [cursor, setCursor] = useState(-1);
  const [closed, setClosed] = useState(false);
  const [matches, setMatches] = useState([]);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const nextId = useRef(1);

  const slugs = useMemo(() => units.map((u) => u.slug), [units]);

  const find = (arg = "") => {
    const a = arg.toLowerCase().replace(/^u/, "");
    if (/^\d+$/.test(a)) return units.find((u) => u.u === Number(a)) ?? units[Number(a) - 1];
    const exact = units.find((u) => u.slug === arg.toLowerCase());
    if (exact) return exact;
    const pre = units.filter((u) => u.slug.startsWith(arg.toLowerCase()));
    return arg && pre.length === 1 ? pre[0] : undefined;
  };

  const push = (cmd, out) => setLines((l) => [...l, { id: nextId.current++, cmd, out }]);

  const Run = ({ cmd, children }) => (
    <button type="button" className="term-run" onClick={() => run(cmd)}>
      {children ?? cmd}
    </button>
  );

  const run = (raw) => {
    const line = raw.trim();
    if (!line) return;
    setHistory((h) => [...h, line]);
    setCursor(-1);
    setMatches([]);
    const [name, ...args] = line.split(/\s+/);

    switch (name.toLowerCase()) {
      case "help":
        push(
          line,
          <div className="term-grid">
            {COMMANDS.map((c) => (
              <div key={c.name} className="term-row">
                <Run cmd={c.name}>{c.usage}</Run>
                <span className="term-muted">{c.desc}</span>
              </div>
            ))}
          </div>
        );
        break;
      case "ls":
        push(
          line,
          <div className="term-grid">
            {units.map((u) => (
              <div key={u.slug} className="term-row">
                <span className="term-muted">U{String(u.u).padStart(2, "0")}</span>
                <Run cmd={`ssh ${u.slug}`}>{u.slug}</Run>
                <span className="term-led">
                  <span className={`led ${u.mine ? "led--amber" : "led--mint"}`} aria-hidden="true" />
                  {u.mine ? "mine" : "org"}
                </span>
              </div>
            ))}
          </div>
        );
        break;
      case "ssh": {
        if (!args[0]) {
          push(line, <span className="term-muted">usage: ssh &lt;unit&gt;. try ls.</span>);
          break;
        }
        const unit = find(args[0]);
        if (!unit) {
          push(line, <span className="term-muted">ssh: {args[0]}: no such unit. try ls.</span>);
          break;
        }
        push(line, <span>avinash@{unit.slug}: pulling the unit out of {hub.rack}</span>);
        openUnit(unit.slug);
        break;
      }
      case "open": {
        if (!args[0]) {
          push(line, <span className="term-muted">usage: open &lt;unit&gt;. try ls.</span>);
          break;
        }
        const unit = find(args[0]);
        if (!unit) {
          push(line, <span className="term-muted">open: {args[0]}: no such unit. try ls.</span>);
          break;
        }
        if (!unit.url) {
          push(line, <span className="term-muted">open: {unit.slug} has no live site.</span>);
          break;
        }
        push(
          line,
          <span>
            opening{" "}
            <a href={unit.url} target="_blank" rel="noopener noreferrer">
              {unit.url}
            </a>
          </span>
        );
        window.open(unit.url, "_blank", "noopener,noreferrer");
        break;
      }
      case "whoami":
        push(
          line,
          <span>
            Avinash Gupta, IIT Guwahati. Builds and runs the portals in this rack.{" "}
            <a href="https://github.com/laladwesh" target="_blank" rel="noopener noreferrer">
              github.com/laladwesh
            </a>
          </span>
        );
        break;
      case "cd":
        if (args[0] === "~" || args.length === 0) {
          push(line, <span>going to avinashgupta.in</span>);
          window.location.href = PORTFOLIO;
        } else {
          push(line, <span className="term-muted">cd: {args[0]}: only ~ exists here.</span>);
        }
        break;
      case "clear":
        setLines([]);
        break;
      case "exit":
        push(line, <span className="term-muted">logout</span>);
        setClosed(true);
        break;
      default:
        push(line, <span className="term-muted">{name}: command not found. try help.</span>);
    }
  };

  // Tab: complete a command name, or a unit name after ssh/open.
  const completeInfo = (v) => {
    const parts = v.split(/\s+/);
    if (parts.length === 1) {
      const names = COMMANDS.map((c) => c.name).filter((n) => n.startsWith(parts[0]));
      if (!parts[0] || !names.length) return { completed: v, matches: [] };
      return { completed: names.length === 1 ? `${names[0]} ` : common(names), matches: names };
    }
    if (parts.length === 2 && ["ssh", "open"].includes(parts[0].toLowerCase())) {
      const hits = slugs.filter((s) => s.startsWith(parts[1].toLowerCase()));
      if (!hits.length) return { completed: v, matches: [] };
      return { completed: `${parts[0]} ${hits.length === 1 ? hits[0] : common(hits)}`, matches: hits };
    }
    return { completed: v, matches: [] };
  };

  const ghost = useMemo(() => {
    if (!value) return "";
    const fromHistory = [...history].reverse().find((h) => h.length > value.length && h.startsWith(value));
    if (fromHistory) return fromHistory.slice(value.length);
    const { completed } = completeInfo(value);
    return completed.length > value.length && completed.startsWith(value) ? completed.slice(value.length) : "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, history, slugs]);

  const accept = () => {
    if (ghost) setValue(value + ghost);
  };

  const onKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const info = completeInfo(value);
      if (info.completed !== value) setValue(info.completed);
      else if (info.matches.length > 1) setMatches(info.matches);
      else accept();
    } else if (e.key === "ArrowRight" && ghost && e.currentTarget.selectionStart === value.length) {
      e.preventDefault();
      accept();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(i);
      setValue(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cursor === -1) return;
      const i = cursor + 1;
      if (i >= history.length) {
        setCursor(-1);
        setValue("");
      } else {
        setCursor(i);
        setValue(history[i]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    run(value);
    setValue("");
  };

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    if (!closed) inputRef.current?.focus({ preventScroll: true });
  }, [closed]);

  if (closed) {
    return (
      <button type="button" className="term-pill" onClick={() => setClosed(false)}>
        open terminal
      </button>
    );
  }

  const other = HUBS[hub.other];

  return (
    <section
      className="term-window"
      aria-label="Rack console"
      onClick={(e) => {
        if (!e.target.closest("button, a") && !window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
      }}
    >
      <div className="term-bar">
        <span className="term-lights" aria-hidden="true">
          <i className="term-light term-light--close" />
          <i className="term-light term-light--min" />
          <i className="term-light term-light--max" />
        </span>
        <span className="term-title">avinash@{hub.key}-rack: ~</span>
        <span />
      </div>

      <div className="term-body" ref={bodyRef} aria-live="polite">
        <p className="term-muted">
          {hub.rack} console. {units.length} units. Type <Run cmd="help" /> or <Run cmd="ls" />. The other rack is{" "}
          <a href={hubHref(other.key)}>{other.rack}</a>.
        </p>
        {lines.map((l) => (
          <div key={l.id} className="term-entry">
            <p className="term-cmd">
              <span className="term-prompt">$</span> {l.cmd}
            </p>
            <div className="term-res">{l.out}</div>
          </div>
        ))}
        {matches.length > 1 && <p className="term-muted">{matches.join("   ")}</p>}
      </div>

      <form className="term-inputline" onSubmit={onSubmit}>
        <span className="term-prompt" aria-hidden="true">
          $
        </span>
        <span className="term-field">
          <span className="term-ghostlayer" aria-hidden="true">
            <span className="term-typed">{value}</span>
            <span className="term-ghost">{ghost}</span>
          </span>
          <input
            ref={inputRef}
            className="term-input"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setMatches([]);
            }}
            onKeyDown={onKeyDown}
            name="command"
            aria-label="Terminal command"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
          />
        </span>
        {ghost && (
          <button type="button" className="term-tab" onClick={accept} aria-label="Accept suggestion">
            tab
          </button>
        )}
      </form>

      <div className="term-statusbar">
        <span>? help / tab complete / ssh &lt;unit&gt; to open a drawer</span>
      </div>
    </section>
  );
};

export default Terminal;
