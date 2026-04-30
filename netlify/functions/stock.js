exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
  const symbol = event.queryStringParameters?.symbol;
  if (!symbol) return { statusCode: 400, body: 'Missing symbol' };
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Yahoo ${res.status}`);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data');
    const meta = result.meta;
    const q = result.indicators?.quote?.[0] || {};
    const closes = (q.close || []).filter(v => v != null);
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        symbol: meta.symbol, name: meta.shortName || symbol,
        exchange: meta.exchangeName, price: meta.regularMarketPrice,
        prevClose: meta.chartPreviousClose || meta.previousClose,
        dayHigh: meta.regularMarketDayHigh, dayLow: meta.regularMarketDayLow,
        high52: meta.fiftyTwoWeekHigh, low52: meta.fiftyTwoWeekLow,
        volume: meta.regularMarketVolume,
        avgVolume: meta.averageDailyVolume3Month || meta.averageDailyVolume10Day,
        closes: closes.slice(-60),
      })
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
