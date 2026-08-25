export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');

    if (!target || !target.startsWith('https://site.api.espn.com/')) {
      return new Response('Invalid request', { status: 400 });
    }

    try {
      const espnResponse = await fetch(target, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-GB,en;q=0.9',
          'Referer': 'https://www.espn.com/'
        }
      });
      const data = await espnResponse.text();
      return new Response(data, {
        status: espnResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60'
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'fetch failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
