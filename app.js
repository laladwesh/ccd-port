const GITHUB_ICON = `<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>`;

async function loadProjects() {
  const list = document.getElementById("project-list");
  const emptyState = document.getElementById("empty-state");

  let projects = [];
  try {
    const res = await fetch("./projects.json");
    projects = await res.json();
  } catch (err) {
    console.error("Could not load projects.json", err);
  }

  if (!projects || projects.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  list.innerHTML = projects
    .map(
      (p, i) => `
      <li class="group border-b border-white-100/10 last:border-b-0">
        <div
          class="flex items-start sm:items-center justify-between gap-4 py-5 px-3 -mx-3 rounded-lg transition-colors group-hover:bg-white-100/5"
        >
          <div class="flex items-start sm:items-center gap-4 min-w-0">
            <span
              class="hidden sm:block shrink-0 font-mono text-xs text-secondary/60 tabular-nums pt-0.5"
              >${String(i + 1).padStart(2, "0")}</span
            >
            <div class="min-w-0">
              <h2 class="text-base sm:text-lg font-medium truncate">
                ${
                  p.url
                    ? `<a href="${escapeAttr(p.url)}" target="_blank" rel="noopener noreferrer" class="hover:text-accent transition-colors">${escapeHtml(p.name)}</a>`
                    : escapeHtml(p.name)
                }
              </h2>
              <p class="text-secondary text-sm mt-1 leading-relaxed">${escapeHtml(p.description)}</p>
            </div>
          </div>
          <a
            href="${escapeAttr(p.github)}"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 flex items-center gap-1.5 rounded-full border border-white-100/10 px-3 py-1.5 text-secondary hover:text-accent hover:border-accent/50 transition-colors text-xs sm:text-sm"
            aria-label="${escapeAttr(p.name)} on GitHub"
          >
            ${GITHUB_ICON}
            <span class="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </li>`
    )
    .join("");

  const countEl = document.getElementById("project-count");
  if (countEl) {
    countEl.textContent = `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str ?? "").replace(/"/g, "&quot;");
}

loadProjects();
