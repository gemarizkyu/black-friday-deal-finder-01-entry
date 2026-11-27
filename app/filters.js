// Bargain Beacon — filtering, sorting and deal math.
// Pure functions over the DEALS array: no DOM access here, so the rules are
// testable on their own. app.js owns the DOM; this file owns the decisions.

export function discountPct(deal) {
  return Math.round(((deal.usual - deal.sale) / deal.usual) * 100);
}

export function saving(deal) {
  return Math.round((deal.usual - deal.sale) * 100) / 100;
}

export function fmtUsd(n) {
  return "$" + n.toFixed(2).replace(/\.00$/, "");
}

export function matchesQuery(deal, q) {
  if (!q) return true;
  const hay = (deal.name + " " + deal.brand + " " + deal.category + " " + deal.store + " " + deal.blurb)
    .toLowerCase();
  return q
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .every((word) => hay.includes(word));
}

export function filterDeals(deals, opts) {
  const q = opts.q || "";
  const cat = opts.category || "All";
  const store = opts.store || "All";
  const minOff = Number(opts.minOff || 0);
  const verdict = opts.verdict || "All";
  return deals.filter((d) => {
    if (!matchesQuery(d, q)) return false;
    if (cat !== "All" && d.category !== cat) return false;
    if (store !== "All" && d.store !== store) return false;
    if (discountPct(d) < minOff) return false;
    if (verdict !== "All" && d.verdict !== verdict) return false;
    return true;
  });
}

export const SORTS = {
  discount: { label: "Biggest discount", fn: (a, b) => discountPct(b) - discountPct(a) || a.sale - b.sale },
  saving: { label: "Biggest saving ($)", fn: (a, b) => saving(b) - saving(a) },
  price: { label: "Lowest price", fn: (a, b) => a.sale - b.sale },
  name: { label: "Name A–Z", fn: (a, b) => a.name.localeCompare(b.name) }
};

export function sortDeals(deals, key) {
  const sort = SORTS[key] || SORTS.discount;
  return [...deals].sort(sort.fn);
}

export function totals(deals) {
  const count = deals.length;
  const totalSaving = deals.reduce((s, d) => s + saving(d), 0);
  const avgOff = count ? Math.round(deals.reduce((s, d) => s + discountPct(d), 0) / count) : 0;
  const best = deals.reduce((best, d) => (!best || discountPct(d) > discountPct(best) ? d : best), null);
  return { count, totalSaving, avgOff, best };
}

export function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get("q") || "",
    category: params.get("cat") || "All",
    store: params.get("store") || "All",
    minOff: Number(params.get("min") || 0),
    verdict: params.get("verdict") || "All",
    sort: params.get("sort") || "discount"
  };
}

export function writeStateToUrl(state) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.category && state.category !== "All") params.set("cat", state.category);
  if (state.store && state.store !== "All") params.set("store", state.store);
  if (state.minOff) params.set("min", String(state.minOff));
  if (state.verdict && state.verdict !== "All") params.set("verdict", state.verdict);
  if (state.sort && state.sort !== "discount") params.set("sort", state.sort);
  const qs = params.toString();
  const hash = window.location.hash;
  history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + hash);
}
