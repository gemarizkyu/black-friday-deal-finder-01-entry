// Bargain Beacon — rendering and interaction.
// Owns the DOM: header stats, deal cards, filters, the detail view and the
// hash routes (#/ and #/deal/<id>). Deal data comes from deals.js, the
// filtering/sorting rules from filters.js.

import { DEALS, CATEGORIES, STORES, VERDICTS, CHECKED_ON } from "./deals.js";
import {
  discountPct, saving, fmtUsd, filterDeals, sortDeals, totals,
  readStateFromUrl, writeStateToUrl, SORTS
} from "./filters.js";

const grid = document.getElementById("grid");
const countEl = document.getElementById("result-count");
const detailEl = document.getElementById("detail");
const mainEl = document.getElementById("main");

let state = readStateFromUrl();

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function verdictBadge(deal) {
  const v = VERDICTS[deal.verdict];
  return `<span class="badge v-${deal.verdict}" title="${esc(v.note)}">${esc(v.label)} · ${discountPct(deal)}% off</span>`;
}

function initials(deal) {
  return deal.name
    .split(/\s+/)
    .filter((w) => /^[A-Z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

function cardHtml(deal) {
  const pct = discountPct(deal);
  const also = deal.alsoAt.length
    ? `<p class="also">Also at ${deal.alsoAt.map((a) => `${esc(a.store)} ${fmtUsd(a.price)}`).join(" · ")}</p>`
    : "";
  return `<article class="card" data-id="${deal.id}">
    <a class="tile" href="#/deal/${deal.id}" aria-label="${esc(deal.name)} details">
      <span class="mono">${esc(initials(deal))}</span>
      <span class="cat">${esc(deal.category)}</span>
    </a>
    <div class="card-body">
      <div class="card-top">${verdictBadge(deal)}<span class="store">${esc(deal.store)}</span></div>
      <h3><a href="#/deal/${deal.id}">${esc(deal.name)}</a></h3>
      <p class="blurb">${esc(deal.blurb)}</p>
      <p class="price"><span class="sale">${fmtUsd(deal.sale)}</span>
        <span class="usual">${fmtUsd(deal.usual)}</span>
        <span class="save">Save ${fmtUsd(saving(deal))} (${pct}%)</span></p>
      ${also}
      <p class="meta">Checked ${CHECKED_ON} · ${esc(deal.source)}</p>
      <div class="actions">
        <a class="btn primary" href="${esc(deal.url)}" target="_blank" rel="noopener">View at ${esc(deal.store)} ↗</a>
        <a class="btn" href="#/deal/${deal.id}">Why this deal?</a>
      </div>
    </div>
  </article>`;
}

function renderStats() {
  const t = totals(DEALS);
  document.getElementById("stat-deals").textContent = t.count;
  document.getElementById("stat-saving").textContent = fmtUsd(t.totalSaving);
  document.getElementById("stat-avg").textContent = t.avgOff + "%";
  document.getElementById("stat-best").textContent = t.best
    ? `${t.best.name} — ${discountPct(t.best)}% off`
    : "—";
}

function renderGrid() {
  const filtered = sortDeals(filterDeals(DEALS, state), state.sort);
  grid.innerHTML = filtered.length
    ? filtered.map(cardHtml).join("")
    : `<p class="empty">No deals match those filters. <button id="clear-filters" type="button">Clear filters</button></p>`;
  countEl.textContent = filtered.length === DEALS.length
    ? `Showing all ${DEALS.length} deals`
    : `Showing ${filtered.length} of ${DEALS.length} deals`;
  const clear = document.getElementById("clear-filters");
  if (clear) clear.addEventListener("click", () => {
    state = { q: "", category: "All", store: "All", minOff: 0, verdict: "All", sort: "discount" };
    syncControls();
    applyState();
  });
}

function renderDetail(id) {
  const deal = DEALS.find((d) => d.id === id);
  if (!deal) {
    document.getElementById("controls").hidden = false;
    detailEl.hidden = true;
    mainEl.hidden = false;
    return;
  }
  const pct = discountPct(deal);
  const v = VERDICTS[deal.verdict];
  const rows = deal.alsoAt.length
    ? deal.alsoAt.map((a) => `<tr><td>${esc(a.store)}</td><td>${fmtUsd(a.price)}</td><td>${a.price < deal.sale ? "Cheaper" : a.price > deal.sale ? "More" : "Same"}</td></tr>`).join("")
    : "";
  detailEl.innerHTML = `
    <p class="crumb"><a href="#/">← All deals</a></p>
    <div class="detail-card">
      <div class="detail-head">
        <span class="tile big"><span class="mono">${esc(initials(deal))}</span></span>
        <div>
          <div class="card-top">${verdictBadge(deal)}<span class="store">${esc(deal.store)}</span></div>
          <h2>${esc(deal.name)}</h2>
          <p class="blurb">${esc(deal.blurb)}</p>
        </div>
      </div>
      <dl class="facts">
        <div><dt>Sale price</dt><dd class="big">${fmtUsd(deal.sale)}</dd></div>
        <div><dt>Usual price</dt><dd>${fmtUsd(deal.usual)}</dd></div>
        <div><dt>You save</dt><dd>${fmtUsd(saving(deal))} (${pct}%)</dd></div>
        <div><dt>Verdict</dt><dd><strong>${esc(v.label)}</strong> — ${esc(v.note)}</dd></div>
        <div><dt>Evidence</dt><dd>${esc(deal.evidence)}</dd></div>
        <div><dt>Price checked</dt><dd>${CHECKED_ON}, via ${esc(deal.source)}</dd></div>
      </dl>
      ${rows ? `<h3>Same product at other stores</h3>
        <table class="compare"><thead><tr><th>Store</th><th>Price</th><th>vs. this deal</th></tr></thead>
        <tbody><tr><td>${esc(deal.store)} (this deal)</td><td>${fmtUsd(deal.sale)}</td><td>—</td></tr>${rows}</tbody></table>` : ""}
      <p class="note">Prices were read from the store or a deals source that names the store on ${CHECKED_ON}.
      Black Friday prices change fast — confirm the price on the store page before you buy.</p>
      <div class="actions">
        <a class="btn primary" href="${esc(deal.url)}" target="_blank" rel="noopener">View at ${esc(deal.store)} ↗</a>
        <a class="btn" href="#/">Back to all deals</a>
      </div>
    </div>`;
  detailEl.hidden = false;
  mainEl.hidden = true;
  window.scrollTo(0, 0);
}

function route() {
  const m = window.location.hash.match(/^#\/deal\/([\w-]+)$/);
  const controls = document.getElementById("controls");
  if (m) {
    controls.hidden = true;
    renderDetail(m[1]);
  } else {
    controls.hidden = false;
    detailEl.hidden = true;
    mainEl.hidden = false;
  }
}

function buildControls() {
  const catSel = document.getElementById("f-category");
  const storeSel = document.getElementById("f-store");
  const sortSel = document.getElementById("f-sort");
  catSel.innerHTML = CATEGORIES.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  storeSel.innerHTML = STORES.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
  sortSel.innerHTML = Object.entries(SORTS).map(([k, s]) => `<option value="${k}">${esc(s.label)}</option>`).join("");
  document.getElementById("f-search").addEventListener("input", (e) => { state.q = e.target.value; applyState(); });
  catSel.addEventListener("change", (e) => { state.category = e.target.value; applyState(); });
  storeSel.addEventListener("change", (e) => { state.store = e.target.value; applyState(); });
  sortSel.addEventListener("change", (e) => { state.sort = e.target.value; applyState(); });
  document.querySelectorAll('input[name="minoff"]').forEach((r) =>
    r.addEventListener("change", (e) => { state.minOff = Number(e.target.value); applyState(); }));
  document.querySelectorAll('input[name="verdict"]').forEach((r) =>
    r.addEventListener("change", (e) => { state.verdict = e.target.value; applyState(); }));
}

function syncControls() {
  document.getElementById("f-search").value = state.q;
  document.getElementById("f-category").value = state.category;
  document.getElementById("f-store").value = state.store;
  document.getElementById("f-sort").value = state.sort;
  document.querySelectorAll('input[name="minoff"]').forEach((r) => { r.checked = Number(r.value) === state.minOff; });
  document.querySelectorAll('input[name="verdict"]').forEach((r) => { r.checked = r.value === state.verdict; });
}

function applyState() {
  writeStateToUrl(state);
  renderGrid();
}

buildControls();
syncControls();
renderStats();
renderGrid();
route();
window.addEventListener("hashchange", route);
