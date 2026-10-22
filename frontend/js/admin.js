const admin = requireAuth("ADMIN");

const state = { list: [], current: null };
const rowsEl = document.getElementById("rows");
const dlg = document.getElementById("dlg");

fillSelect(document.getElementById("fStatus"), STATUSES, "All statuses");
fillSelect(document.getElementById("fCategory"), CATEGORIES, "All categories");
fillSelect(document.getElementById("dStatus"), STATUSES);

async function loadStats() {
  const s = await Api.get("/admin/stats");
  const cells = [`<div class="stat"><div class="num">${s.total}</div><div class="lbl">Total</div></div>`]
    .concat(Object.entries(STATUSES).map(([k, label]) =>
      `<div class="stat s-${k}"><div class="num">${s.byStatus[k] ?? 0}</div><div class="lbl">${esc(label)}</div></div>`));
  document.getElementById("stats").innerHTML = cells.join("");

  const max = Math.max(1, ...Object.values(s.byCategory));
  document.getElementById("bars").innerHTML = Object.entries(CATEGORIES).map(([k, label]) => {
    const n = s.byCategory[k] ?? 0;
    return `<li><div class="bar-top"><span>${esc(label)}</span><span>${n}</span></div>
            <div class="bar"><i style="width:${(n / max) * 100}%"></i></div></li>`;
  }).join("");
}

async function loadList() {
  const params = new URLSearchParams();
  const st = document.getElementById("fStatus").value;
  const cat = document.getElementById("fCategory").value;
  if (st) params.set("status", st);
  if (cat) params.set("category", cat);
  try {
    state.list = await Api.get("/admin/complaints" + (params.toString() ? "?" + params : ""));
    renderRows();
  } catch (err) {
    rowsEl.innerHTML = `<tr><td colspan="6">${esc(err.message)}</td></tr>`;
  }
}

function renderRows() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const shown = state.list.filter((c) => !q ||
    [c.title, c.userName, c.userEmail, c.location].some((v) => (v || "").toLowerCase().includes(q)));

  if (!shown.length) {
    rowsEl.innerHTML = `<tr><td colspan="6"><div class="empty" style="border:0"><b>No complaints match</b>Change the filters or search.</div></td></tr>`;
    return;
  }
  rowsEl.innerHTML = shown.map((c) => `
    <tr>
      <td class="title-cell">${esc(c.title)}<div class="sub">${esc(c.location)} · ${fmtDate(c.createdAt)}</div></td>
      <td>${esc(c.userName)}<div class="sub">${esc(c.userEmail)}</div></td>
      <td><span class="badge cat">${esc(CATEGORIES[c.category])}</span></td>
      <td><span class="badge prio-${c.priority}">${esc(PRIORITIES[c.priority])}</span></td>
      <td><span class="badge status-${c.status}">${esc(STATUSES[c.status])}</span></td>
      <td><button class="btn btn-ghost btn-sm" data-manage="${esc(c.id)}">Manage</button></td>
    </tr>`).join("");
}

rowsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-manage]");
  if (!btn) return;
  const c = state.list.find((x) => x.id === btn.dataset.manage);
  if (!c) return;
  state.current = c;
  document.getElementById("dlgTitle").textContent = c.title;
  document.getElementById("dlgInfo").innerHTML = `
    <div class="meta" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
      <span class="badge cat">${esc(CATEGORIES[c.category])}</span>
      <span class="badge prio-${c.priority}">${esc(PRIORITIES[c.priority])} priority</span>
      <span class="hint">${esc(c.location)}</span>
    </div>
    <p class="desc">${esc(c.description)}</p>
    <p class="hint">Reported by ${esc(c.userName)} (${esc(c.userEmail)}) on ${fmtDate(c.createdAt)}</p>`;
  document.getElementById("dStatus").value = c.status;
  document.getElementById("dRemark").value = c.adminRemark || "";
  document.getElementById("dlgError").textContent = "";
  dlg.showModal();
});

document.getElementById("dlgForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("dlgSave");
  btn.disabled = true;
  try {
    await Api.put(`/admin/complaints/${state.current.id}/status`, {
      status: document.getElementById("dStatus").value,
      adminRemark: document.getElementById("dRemark").value
    });
    dlg.close();
    toast("Changes saved");
    await Promise.all([loadList(), loadStats()]);
  } catch (err) {
    document.getElementById("dlgError").textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

["dlgClose", "dlgCancel"].forEach((id) =>
  document.getElementById(id).addEventListener("click", () => dlg.close()));
document.getElementById("fStatus").addEventListener("change", loadList);
document.getElementById("fCategory").addEventListener("change", loadList);
document.getElementById("search").addEventListener("input", renderRows);

if (admin) {
  loadStats().catch((err) => toast(err.message, "error"));
  loadList();
}
