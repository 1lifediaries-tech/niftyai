exports.handler = async function(event) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const q = event.queryStringParameters?.q;
  if (!q) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing query' }) };

  try {
    // Yahoo Finance search - returns matching stocks for any query
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=20&lang=en-US&region=IN`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) throw new Error(`Yahoo search ${res.status}`);
    const data = await res.json();

    // Filter to NSE (.NS) and BSE (.BO) stocks only
    const quotes = (data.quotes || [])
      .filter(q => q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')) && q.quoteType === 'EQUITY')
      .map(q => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.symbol.endsWith('.NS') ? 'NSE' : 'BSE',
        sector: q.sector || '',
      }));

    return { statusCode: 200, headers, body: JSON.stringify({ results: quotes }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
