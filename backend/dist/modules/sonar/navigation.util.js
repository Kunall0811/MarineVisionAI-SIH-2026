"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNavigationCsv = parseNavigationCsv;
exports.findNearestByTimestamp = findNearestByTimestamp;
function parseNavigationCsv(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2)
        return { byFileName: new Map(), byTimestamp: [] };
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const idx = (name) => header.indexOf(name);
    const byFileName = new Map();
    const byTimestamp = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length < header.length)
            continue;
        const lat = parseFloat(cols[idx('latitude')]);
        const lon = parseFloat(cols[idx('longitude')]);
        if (Number.isNaN(lat) || Number.isNaN(lon))
            continue;
        const record = {
            image: idx('image') >= 0 ? cols[idx('image')].trim() : undefined,
            timestamp: idx('timestamp') >= 0 ? cols[idx('timestamp')].trim() : undefined,
            latitude: lat,
            longitude: lon,
            heading: idx('heading') >= 0 ? parseFloat(cols[idx('heading')]) : undefined,
            depth: idx('depth') >= 0 ? parseFloat(cols[idx('depth')]) : undefined,
            range: idx('range') >= 0 ? parseFloat(cols[idx('range')]) : undefined,
            side: idx('side') >= 0 ? cols[idx('side')].trim().toUpperCase() : undefined,
            altitude: idx('altitude') >= 0 ? parseFloat(cols[idx('altitude')]) : undefined,
            heave: idx('heave') >= 0 ? parseFloat(cols[idx('heave')]) : undefined,
            pitch: idx('pitch') >= 0 ? parseFloat(cols[idx('pitch')]) : undefined,
            roll: idx('roll') >= 0 ? parseFloat(cols[idx('roll')]) : undefined,
        };
        if (record.image)
            byFileName.set(record.image, record);
        if (record.timestamp)
            byTimestamp.push(record);
    }
    byTimestamp.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return { byFileName, byTimestamp };
}
function findNearestByTimestamp(records, targetIso, maxDeltaMs = 5 * 60 * 1000) {
    if (!records.length)
        return null;
    const target = new Date(targetIso).getTime();
    if (Number.isNaN(target))
        return null;
    let closest = null;
    let closestDelta = Infinity;
    for (const r of records) {
        const delta = Math.abs(new Date(r.timestamp).getTime() - target);
        if (delta < closestDelta) {
            closestDelta = delta;
            closest = r;
        }
    }
    if (!closest || closestDelta > maxDeltaMs)
        return null;
    return { record: closest, isEstimated: closestDelta > 0 };
}
//# sourceMappingURL=navigation.util.js.map