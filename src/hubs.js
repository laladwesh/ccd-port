import ccd from "./data/ccd.json";
import prasad from "./data/prasad.json";

// The two racks. Everything on a unit comes from src/data/<hub>.json.
export const HUBS = {
  ccd: {
    key: "ccd",
    rack: "RACK-01",
    plate: "CENTRE FOR CAREER DEVELOPMENT, IIT GUWAHATI",
    title: "CCD",
    name: "CCD, IIT Guwahati",
    intro: "Every route and project the placement cell runs, with a link to its source. Maintained by Avinash.",
    host: "ccd.avinashgupta.in",
    other: "prasad",
    items: ccd,
  },
  prasad: {
    key: "prasad",
    rack: "RACK-02",
    plate: "PRASAD ACADEMIC",
    title: "Prasad Academic",
    name: "Prasad Academic",
    intro: "Every route and project built for the institute, with a link to its source. Maintained by Avinash.",
    host: "prasad.avinashgupta.in",
    other: "ccd",
    items: prasad,
  },
};

export const PORTFOLIO = "https://avinashgupta.in";
export const MINE = "laladwesh";

// ccd.* and prasad.* pick the hub by hostname; anywhere else (local dev) use ?hub=
export const detectHub = () => {
  const host = window.location.hostname;
  if (host.startsWith("prasad.")) return "prasad";
  if (host.startsWith("ccd.")) return "ccd";
  return new URLSearchParams(window.location.search).get("hub") === "prasad" ? "prasad" : "ccd";
};

export const hubHref = (key) =>
  window.location.hostname.endsWith("avinashgupta.in") ? `https://${HUBS[key].host}` : `/?hub=${key}`;

export const slugOf = (name) =>
  name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const hostOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
};

const ownerOf = (repo) => repo?.match(/github\.com\/([^/]+)/i)?.[1] ?? "";

// Units in rack order. A unit with a stack is 2U, the rest are 1U.
export const buildUnits = (items) => {
  let u = 1;
  return items.map((p) => {
    const slug = slugOf(p.name);
    const owner = ownerOf(p.github);
    const size = p.stack?.length ? 2 : 1;
    const detail = p.stack?.length ? p.stack.slice(0, 3).join("·") : hostOf(p.url);
    const unit = {
      ...p,
      slug,
      owner,
      mine: owner.toLowerCase() === MINE,
      size,
      u,
      model: `${slug} / ${detail}`.toUpperCase(),
    };
    u += size;
    return unit;
  });
};
