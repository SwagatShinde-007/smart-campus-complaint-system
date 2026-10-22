const user = requireAuth("STUDENT");

const state = { list: [], filter: "ALL" };
const form = document.getElementById("complaintForm");
const ticketsEl = document.getElementById("tickets");
const chipsEl = document.getElementById("chips");

fillSelect(document.getElementById("category"), CATEGORIES, "Choose…");
fillSelect(document.getElementById("priority"), PRIORITIES);
document.getElementById("priority").value = "MEDIUM";

async function load() {
  try {
    state.list = await Api.get("/complaints/my");
    render();
  } catch (err) {
    ticketsEl.innerHTML = `<div class="empty"><b>Could not load complaints</b>${esc(err.message)}</div>`;
  }
}

function render() {
  const counts = { ALL: state.list.length };
  Object.keys(STATUSES).forEach((s) => counts[s] = state.list.filter((c) => c.status === s).length);

  chipsEl.innerHTML = [["ALL", "All"], ...Object.entries(STATUSES)].map(([k, label]) =>
    `<button class="chip" data-filter="${k}" aria-pressed="${state.filter === k}">${esc(label)}<span class="n">${counts[k]}</span></button>`
  ).join("");

  const shown = state.filter === "ALL" ? state.list : state.list.filter((c) => c.status === state.filter);
  if (!shown.length) {
    ticketsEl.innerHTML = state.list.length
      ? `<div class="empty"><b>No ${esc((STATUSES[state.filter] || "").toLowerCase())} complaints</b>Try another filter.</div>`
      : `<div class="empty"><b>No complaints yet</b>Use the form to report your first issue.</div>`;
    return;
  }
  ticketsEl.innerHTML = shown.map(ticket).join("");
}

function track(c) {
  if (c.status === "REJECTED") return `<p class="rejected-note">Rejected</p>`;
  const steps = ["Submitted", "In progress", "Resolved"];
  const idx = { PENDING: 0, IN_PROGRESS: 1, RESOLVED: 2 }[c.status];
  return `<ol class="track" aria-label="Progress">` + steps.map((s, i) => {
    const cls = c.status === "RESOLVED" || i < idx ? "done" : i === idx ? "current" : "";
    return `<li class="${cls}">${s}</li>`;
  }).join("") + `</ol>`;
}

function ticket(c) {
  const remark = c.adminRemark
    ? `<div class="remark"><b>Response from campus admin</b>${esc(c.adminRemark)}</div>` : "";
  const withdraw = c.status === "PENDING"
    ? `<button class="btn btn-danger btn-sm" data-withdraw="${esc(c.id)}">Withdraw</button>` : "";
  return `
  <article class="ticket st-${c.status}">
    <div class="ticket-head">
      <h3>${esc(c.title)}</h3>
      <span class="badge status-${c.status}">${esc(STATUSES[c.status])}</span>
    </div>
    <div class="meta">
      <span class="badge cat">${esc(CATEGORIES[c.category])}</span>
      <span class="badge prio-${c.priority}">${esc(PRIORITIES[c.priority])} priority</span>
      <span>${esc(c.location)}</span>
      <span>Submitted ${fmtDate(c.createdAt)}</span>
    </div>
    <p class="desc">${esc(c.description)}</p>
    ${remark}
    <div class="ticket-foot">${track(c)}${withdraw}</div>
  </article>`;
}

chipsEl.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-filter]");
  if (!chip) return;
  state.filter = chip.dataset.filter;
  render();
});

ticketsEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-withdraw]");
  if (!btn) return;
  if (!confirm("Withdraw this complaint? This cannot be undone.")) return;
  try {
    await Api.del("/complaints/" + btn.dataset.withdraw);
    toast("Complaint withdrawn");
    load();
  } catch (err) { toast(err.message, "error"); }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("formError");
  const btn = document.getElementById("submitBtn");
  errEl.textContent = "";
  btn.disabled = true;
  try {
    await Api.post("/complaints", {
      title: document.getElementById("title").value,
      category: document.getElementById("category").value || null,
      priority: document.getElementById("priority").value,
      location: document.getElementById("location").value,
      description: document.getElementById("description").value
    });
    form.reset();
    document.getElementById("priority").value = "MEDIUM";
    toast("Complaint submitted");
    load();
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

if (user) load();
