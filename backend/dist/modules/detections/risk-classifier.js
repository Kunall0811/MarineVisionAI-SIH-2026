"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyRisk = classifyRisk;
const HIGH_RISK_CLASSES = new Set(['ghost_net', 'fishing_gear']);
const STRUCTURAL_CLASSES = new Set(['shipwreck', 'pipe', 'cylinder']);
function classifyRisk(input) {
    let score = 0;
    score += input.finalConfidence * 40;
    if (HIGH_RISK_CLASSES.has(input.objectClass))
        score += 25;
    else if (STRUCTURAL_CLASSES.has(input.objectClass))
        score += 15;
    else if (input.objectClass === 'container' || input.objectClass === 'marine_debris')
        score += 10;
    if (input.lengthMetres !== null) {
        if (input.lengthMetres > 15)
            score += 15;
        else if (input.lengthMetres > 5)
            score += 8;
    }
    if (input.depth !== null && input.depth < 30)
        score += 10;
    if (input.status === 'VERIFIED')
        score += 10;
    if (input.status === 'REJECTED')
        score = 0;
    if (score >= 75)
        return 'CRITICAL';
    if (score >= 55)
        return 'HIGH';
    if (score >= 30)
        return 'MEDIUM';
    return 'LOW';
}
//# sourceMappingURL=risk-classifier.js.map