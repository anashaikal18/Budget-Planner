/* ═══════════════════════════════════════════════
   BUDGET PLANNER · app.js
   Handles: goals (CRUD), entries (CRUD + save
   toggle), computed stats, UI rendering.
   ═══════════════════════════════════════════════ */

"use strict";

/* ── STATE ──────────────────────────────────────
   goals   : [{ id, name, goal, start }]
   entries : [{ id, date, goalId, amount, saved }]
   ──────────────────────────────────────────────── */
let goals   = [];
let entries = [];

/* ── SEEDS ─────────────────────────────────────── */
const SEED_GOALS = [
  { id: "g1", name: "SAMBUNG BELAJAR SEM 4", goal: 3000,   start: 1000 },
  { id: "g2", name: "HOUSE",                  goal: 500000, start: 0    },
  { id: "g3", name: "SETUP",                  goal: 2000,   start: 0    },
];

const SEED_ENTRIES = [
  { id: "e1", date: "2025-01-10", goalId: "g1", amount: 1000, saved: true },
];

/* ── HELPERS ────────────────────────────────────── */
const uid = () => "id_" + Math.random().toString(36).slice(2, 9);

const fmt = (n) =>
  "RM " + Number(n || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (part, whole) =>
  whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0;

/* ── COMPUTED ───────────────────────────────────── */
function goalStats(goal) {
  const goalEntries = entries.filter((e) => e.goalId === goal.id);
  const planned     = goal.start + goalEntries.reduce((s, e) => s + Number(e.amount), 0);
  const saved       = goal.start + goalEntries.filter((e) => e.saved).reduce((s, e) => s + Number(e.amount), 0);
  const toGoSaved   = Math.max(0, goal.goal - saved);
  const toGoPlanned = Math.max(0, goal.goal - planned);
  const savedPct    = pct(saved, goal.goal);
  return { planned, saved, toGoSaved, toGoPlanned, savedPct, goalEntries };
}

/* ── PERSIST (localStorage) ─────────────────────── */
function persist() {
  localStorage.setItem("bp_goals",   JSON.stringify(goals));
  localStorage.setItem("bp_entries", JSON.stringify(entries));
}

function load() {
  try {
    const g = localStorage.getItem("bp_goals");
    const e = localStorage.getItem("bp_entries");
    goals   = g ? JSON.parse(g) : [...SEED_GOALS];
    entries = e ? JSON.parse(e) : [...SEED_ENTRIES];
  } catch {
    goals   = [...SEED_GOALS];
    entries = [...SEED_ENTRIES];
  }
}

/* ══════════════════════════════════════════════════
   RENDER FUNCTIONS
   ══════════════════════════════════════════════════ */

/* ── Category <select> in the input form ──────── */
function renderCategorySelect() {
  const sel = document.getElementById("inp-category");
  sel.innerHTML = '<option value="">— Select Goal —</option>';
  goals.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    sel.appendChild(opt);
  });
}

/* ── Entries table ────────────────────────────── */
function renderEntriesTable() {
  const tbody = document.getElementById("entries-tbody");
  tbody.innerHTML = "";

  if (entries.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No entries yet. Add one above!</td></tr>';
    return;
  }

  [...entries].reverse().forEach((entry, idx) => {
    const goal = goals.find((g) => g.id === entry.goalId);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entries.length - idx}</td>
      <td>${entry.date || "—"}</td>
      <td>${goal ? goal.name : "Unknown"}</td>
      <td>${fmt(entry.amount)}</td>
      <td>
        <input
          type="checkbox"
          class="saved-checkbox"
          data-id="${entry.id}"
          ${entry.saved ? "checked" : ""}
          title="Mark as saved"
        />
      </td>
      <td>
        <button class="btn btn-danger" data-del-entry="${entry.id}">✕</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

/* ── Goal cards ───────────────────────────────── */
function renderGoalCards() {
  const grid = document.getElementById("goals-grid");
  grid.innerHTML = "";

  if (goals.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-muted);font-style:italic;">No goals yet. Click "+ Add New Goal" to create one.</p>';
    return;
  }

  goals.forEach((goal) => {
    const s    = goalStats(goal);
    const card = document.createElement("div");
    card.className = "goal-card";
    card.dataset.goalId = goal.id;

    /* build entry rows */
    let entryRowsHTML = "";
    if (s.goalEntries.length === 0) {
      entryRowsHTML = '<p class="no-entries-text">No entries for this goal yet.</p>';
    } else {
      s.goalEntries.forEach((e) => {
        entryRowsHTML += `
          <div class="entry-row">
            <span class="entry-date">${e.date || "—"}</span>
            <span class="entry-amount">${fmt(e.amount)}</span>
            ${e.saved ? '<span class="entry-saved-badge">✓ SAVED</span>' : ""}
          </div>`;
      });
    }

    card.innerHTML = `
      <div class="goal-card-header">
        <span class="goal-card-title">${goal.name}</span>
        <button class="goal-card-delete" data-del-goal="${goal.id}" title="Delete goal">✕</button>
      </div>

      <div class="progress-wrap">
        <div class="progress-label">
          <span>Progress</span>
          <span>${s.savedPct}% saved</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${s.savedPct}%"></div>
        </div>
      </div>

      <div class="goal-stats">
        <div class="stat-cell">
          <div class="stat-label">Goal</div>
          <div class="stat-value">${fmt(goal.goal)}</div>
        </div>
        <div class="stat-cell highlight">
          <div class="stat-label">Saved</div>
          <div class="stat-value">${fmt(s.saved)}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-label">Planned</div>
          <div class="stat-value">${fmt(s.planned)}</div>
        </div>
        <div class="stat-cell ${s.toGoSaved > 0 ? "danger-stat" : "highlight"}">
          <div class="stat-label">To Go</div>
          <div class="stat-value">${fmt(s.toGoSaved)}</div>
        </div>
      </div>

      <div class="goal-entries">
        <div class="goal-entries-title">Entries</div>
        ${entryRowsHTML}
      </div>`;

    grid.appendChild(card);
  });
}

/* ── Master render ────────────────────────────── */
function render() {
  renderCategorySelect();
  renderEntriesTable();
  renderGoalCards();
}

/* ══════════════════════════════════════════════════
   EVENT HANDLERS
   ══════════════════════════════════════════════════ */

/* ── Add budget entry ─────────────────────────── */
document.getElementById("add-entry-btn").addEventListener("click", () => {
  const date    = document.getElementById("inp-date").value;
  const goalId  = document.getElementById("inp-category").value;
  const amount  = parseFloat(document.getElementById("inp-amount").value);

  if (!goalId)         return alert("Please select a goal.");
  if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount.");

  entries.push({ id: uid(), date, goalId, amount, saved: false });
  document.getElementById("inp-amount").value = "";
  document.getElementById("inp-date").value   = "";
  document.getElementById("inp-category").value = "";

  persist();
  render();
});

/* ── Toggle saved / delete entry (delegation) ──── */
document.getElementById("entries-tbody").addEventListener("change", (e) => {
  if (!e.target.classList.contains("saved-checkbox")) return;
  const id    = e.target.dataset.id;
  const entry = entries.find((en) => en.id === id);
  if (entry) { entry.saved = e.target.checked; persist(); render(); }
});

document.getElementById("entries-tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-del-entry]");
  if (!btn) return;
  if (!confirm("Delete this entry?")) return;
  entries = entries.filter((en) => en.id !== btn.dataset.delEntry);
  persist();
  render();
});

/* ── Delete goal (delegation on grid) ─────────── */
document.getElementById("goals-grid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-del-goal]");
  if (!btn) return;
  const gId = btn.dataset.delGoal;
  if (!confirm("Delete this goal and all its entries?")) return;
  goals   = goals.filter((g) => g.id !== gId);
  entries = entries.filter((en) => en.goalId !== gId);
  persist();
  render();
});

/* ── Modal: open ─────────────────────────────── */
document.getElementById("add-goal-btn").addEventListener("click", () => {
  document.getElementById("modal-backdrop").classList.add("open");
  document.getElementById("modal-name").focus();
});

/* ── Modal: cancel ───────────────────────────── */
document.getElementById("modal-cancel").addEventListener("click", closeModal);
document.getElementById("modal-backdrop").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeModal();
});

function closeModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
  document.getElementById("modal-name").value  = "";
  document.getElementById("modal-goal").value  = "";
  document.getElementById("modal-start").value = "";
}

/* ── Modal: save ─────────────────────────────── */
document.getElementById("modal-save").addEventListener("click", () => {
  const name  = document.getElementById("modal-name").value.trim();
  const goal  = parseFloat(document.getElementById("modal-goal").value);
  const start = parseFloat(document.getElementById("modal-start").value) || 0;

  if (!name)              return alert("Please enter a goal name.");
  if (isNaN(goal) || goal <= 0) return alert("Please enter a valid target amount.");

  goals.push({ id: uid(), name, goal, start });
  closeModal();
  persist();
  render();
});

/* ── Keyboard: Escape closes modal ─────────────── */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ══════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════ */
load();
render();
