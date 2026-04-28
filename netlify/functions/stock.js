exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const symbol = event.queryStringParameters?.symbol;
  if (!symbol) return { statusCode: 400, body: 'Missing symbol' };

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    // Yahoo Finance v8 - free, no key needed
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`Yahoo returned ${res.status}`);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data returned');

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0] || {};
    const closes = (quotes.close || []).filter(v => v != null);
    const volumes = (quotes.volume || []).filter(v => v != null);
    const timestamps = (result.timestamp || []);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        symbol: meta.symbol,
        name: meta.shortName || symbol,
        exchange: meta.exchangeName,
        currency: meta.currency,
        price: meta.regularMarketPrice,
        prevClose: meta.chartPreviousClose || meta.previousClose,
        open: meta.regularMarketDayHigh ? meta.regularMarketOpen : null,
        dayHigh: meta.regularMarketDayHigh,
        dayLow: meta.regularMarketDayLow,
        high52: meta.fiftyTwoWeekHigh,
        low52: meta.fiftyTwoWeekLow,
        volume: meta.regularMarketVolume,
        avgVolume: meta.averageDailyVolume3Month || meta.averageDailyVolume10Day,
        marketCap: meta.marketCap,
        closes: closes.slice(-60),
        volumes: volumes.slice(-60),
        timestamps: timestamps.slice(-60),
      })
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
