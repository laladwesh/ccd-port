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
    emptyState.hidden = false;
    return;
  }

  list.innerHTML = projects
    .map((p, i) => {
      const index = String(i + 1).padStart(2, "0");

      return `
      <li class="project-item">
        <div class="project-header">
          <span class="project-num">${index}</span>
          <h2 class="project-title">${escapeHtml(p.name)}</h2>
        </div>
        <p class="project-desc">${escapeHtml(p.description)}</p>
        <div class="project-links">
          ${
            p.url
              ? `<div class="link-row">
            <span class="link-label">Route</span>
            <a href="${escapeAttr(p.url)}" class="link-url" target="_blank" rel="noopener noreferrer">${escapeHtml(p.url)}</a>
          </div>`
              : ""
          }
          <div class="link-row">
            <span class="link-label">Source</span>
            <a href="${escapeAttr(p.github)}" class="link-url" target="_blank" rel="noopener noreferrer">${escapeHtml(p.github)}</a>
          </div>
        </div>
      </li>`;
    })
    .join("");
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
