async function loadProjects() {
  const list = document.getElementById("project-list");
  const emptyState = document.getElementById("empty-state");
  const countEl = document.getElementById("project-count");

  let projects = [];
  try {
    const res = await fetch("./projects.json");
    projects = await res.json();
  } catch (err) {
    console.error("Could not load projects.json", err);
  }

  if (!projects || projects.length === 0) {
    emptyState.hidden = false;
    if (countEl) countEl.textContent = "INDEX COUNT: 00";
    return;
  }

  list.innerHTML = projects
    .map((p, i) => {
      const index = String(i + 1).padStart(2, "0");
      const routeLabel = displayUrl(p.url);
      const repoLabel = displayUrl(p.github).replace(/^github\.com\//, "");

      return `
      <li class="entry">
        <span class="entry-index">${index}</span>
        <div class="entry-main">
          <h2 class="entry-name">${escapeHtml(p.name)}</h2>
          <p class="entry-desc">${escapeHtml(p.description)}</p>
        </div>
        ${
          p.url
            ? `<div class="entry-link-group">
          <span class="entry-col-label">Route:</span>
          <span class="link-bracket">[</span><a href="${escapeAttr(p.url)}" class="ref-link" target="_blank" rel="noopener noreferrer">${escapeHtml(routeLabel)}</a><span class="link-bracket">]</span>
        </div>`
            : `<div class="entry-link-group"></div>`
        }
        <div class="entry-link-group">
          <span class="entry-col-label">Repo:</span>
          <span class="link-bracket">[</span><a href="${escapeAttr(p.github)}" class="ref-link" target="_blank" rel="noopener noreferrer">${escapeHtml(repoLabel)}</a><span class="link-bracket">]</span>
        </div>
      </li>`;
    })
    .join("");

  if (countEl) {
    countEl.textContent = `INDEX COUNT: ${String(projects.length).padStart(2, "0")}`;
  }
}

function displayUrl(url) {
  return (url ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
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
