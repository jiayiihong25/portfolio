// Vercel function: GET /api/github-contributions
//
// Returns the same contribution calendar a visitor sees on the public GitHub
// profile (github.com/users/<user>/contributions), so the about page heatmap
// never drifts from the real data. No token needed; the edge cache keeps
// GitHub requests to a few per day.

const GITHUB_USER = 'jiayiihong25';

async function fetchContributions(user = GITHUB_USER) {
    const response = await fetch(`https://github.com/users/${user}/contributions`, {
        headers: { 'User-Agent': 'jiayihong.ca contribution heatmap' }
    });
    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
    const html = await response.text();

    // Each day is a <td data-date="YYYY-MM-DD" id="..." data-level="0-4">, with
    // its count in a <tool-tip for="<id>">N contributions on ...</tool-tip>.
    const tooltips = new Map();
    for (const [, id, text] of html.matchAll(/<tool-tip[^>]*\sfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
        tooltips.set(id, text.trim());
    }

    const days = [];
    for (const [tag] of html.matchAll(/<td\b[^>]*\bdata-date="[^"]+"[^>]*>/g)) {
        const date = tag.match(/data-date="([^"]+)"/)[1];
        const level = Number((tag.match(/data-level="(\d)"/) || [])[1] || 0);
        const id = (tag.match(/\bid="([^"]+)"/) || [])[1];
        const countMatch = (tooltips.get(id) || '').match(/^(\d[\d,]*) contributions?/);
        const count = countMatch ? Number(countMatch[1].replace(/,/g, '')) : 0;
        days.push([date, level, count]);
    }
    if (!days.length) throw new Error('No contribution days found in GitHub markup');
    days.sort((a, b) => (a[0] < b[0] ? -1 : 1));

    return { user, fetchedAt: new Date().toISOString(), days };
}

async function handler(req, res) {
    try {
        const data = await fetchContributions();
        // Fresh at the edge for 6h, then served stale for up to a day while it refreshes.
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400');
        res.status(200).json(data);
    } catch (error) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(502).json({ error: error.message });
    }
}

module.exports = handler;
module.exports.fetchContributions = fetchContributions;
