// Shared state and a tiny event bus for the daemon (the pixel companion).
// The terminal's commands emit events; the Daemon component listens.

const KEY = "daemon-stopped";

export const daemon = {
  mood: "following the pointer",
  stopped: false,
  available: false, // false on touch devices and with reduced motion
};

try {
  daemon.stopped = sessionStorage.getItem(KEY) === "1";
} catch {
  /* sessionStorage can be blocked; the daemon then just starts running */
}

export const daemonEvent = (name) => window.dispatchEvent(new CustomEvent("daemon", { detail: name }));

export const setDaemonStopped = (stopped) => {
  daemon.stopped = stopped;
  try {
    if (stopped) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
