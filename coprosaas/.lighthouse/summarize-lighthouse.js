const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
const files = fs.readdirSync(dir).filter((name) => name.endsWith('.json') && name !== 'summary.json');

const results = files.map((file) => {
  const json = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const audits = json.audits || {};
  return {
    file,
    url: json.finalDisplayedUrl || json.finalUrl,
    performance: Math.round((json.categories?.performance?.score || 0) * 100),
    fcpMs: Math.round(audits['first-contentful-paint']?.numericValue || 0),
    lcpMs: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
    tbtMs: Math.round(audits['total-blocking-time']?.numericValue || 0),
    cls: Number((audits['cumulative-layout-shift']?.numericValue || 0).toFixed(3)),
    speedIndexMs: Math.round(audits['speed-index']?.numericValue || 0),
  };
}).sort((a, b) => b.fcpMs - a.fcpMs);

fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
