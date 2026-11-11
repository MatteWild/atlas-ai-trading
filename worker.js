const SYMBOLS = [
  { symbol: "GC=F", label: "Gold futures" },
  { symbol: "EURUSD=X", label: "EUR/USD" },
  { symbol: "NQ=F", label: "Nasdaq 100 futures" },
  { symbol: "SI=F", label: "Silver futures" }
];

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { ...cors(origin), "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=30" }
  });
}
async function fetchYahoo(symbol) {
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(symbol) + "?range=5d&interval=15m";
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 NeoIndex/1.1", "Accept": "application/json" }
  });
  if (!response.ok) throw new Error("Yahoo HTTP " + response.status + " for " + symbol);
  const body = await response.json();
  const result = body?.chart?.result?.[0];
  if (!result) throw new Error("No chart data for " + symbol);
  const quote = result.indicators?.quote?.[0];
  const closes = (quote?.close || []).filter(v => Number.isFinite(v));
  if (!closes.length) throw new Error("No prices for " + symbol);
  const meta = result.meta || {};
  const price = Number(meta.regularMarketPrice ?? closes[closes.length - 1]);
  const previous = Number(meta.chartPreviousClose ?? closes[0]);
  const time = (meta.regularMarketTime || result.timestamp?.at(-1) || 0) * 1000;
  return {
    symbol, price, changePct: previous ? ((price - previous) / previous) * 100 : null,
    time: time || null, closes, status: "INDICATIVE",
    currency: meta.currency || null, decimals: meta.priceHint ?? 2
  };
}
async function getQuotes() {
  const results = await Promise.allSettled(SYMBOLS.map(s => fetchYahoo(s.symbol)));
  const quotes = results.map((r, i) => r.status === "fulfilled" ? r.value : ({
    symbol: SYMBOLS[i].symbol, status: "UNAVAILABLE", error: String(r.reason?.message || r.reason)
  }));
  return { source: "Yahoo Finance chart (indicative)", fetchedAt: new Date().toISOString(), quotes };
}
async function getNews() {
  const query = '("Federal Reserve" OR gold OR dollar OR inflation OR tariffs OR war OR sanctions OR central bank)';
  const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(query) + "&mode=ArtList&format=json&maxrecords=20&sort=DateDesc";
  const r = await fetch(url, { headers: { "User-Agent": "NeoIndex/1.1", "Accept": "application/json" } });
  if (!r.ok) throw new Error("GDELT HTTP " + r.status);
  const data = await r.json();
  const articles = (data.articles || []).map(a => ({
    title: a.title || "", url: a.url || "", domain: a.domain || "",
    seendate: a.seendate || "", language: a.language || ""
  })).filter(a => a.url && a.title);
  return { source: "GDELT", fetchedAt: new Date().toISOString(), articles };
}
export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "*";
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405, origin);
    try {
      if (url.pathname === "/api/health") return json({ ok: true, service: "Neo Index API", version: "1.1" }, 200, origin);
      if (url.pathname === "/api/quotes") return json(await getQuotes(), 200, origin);
      if (url.pathname === "/api/news") return json(await getNews(), 200, origin);
      return json({ error: "Not found" }, 404, origin);
    } catch (e) {
      return json({ error: String(e?.message || e) }, 502, origin);
    }
  }
};
