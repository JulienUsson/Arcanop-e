export const CRIT_POINTS = 15;
export function isYellow(score) {
    return score >= 9;
}
export function arrowPoints(arrow) {
    if (arrow.score <= 0)
        return 0;
    return arrow.x ? CRIT_POINTS : arrow.score;
}
export function arrowLabel(arrow) {
    if (arrow.x)
        return 'X';
    return arrow.score === 0 ? 'M' : String(arrow.score);
}
export const RING_COLORS = {
    0: { fill: '#3a3f3b', text: '#ddd', line: '#666' },
    1: { fill: '#f4f1ea', text: '#222', line: '#222' },
    2: { fill: '#f4f1ea', text: '#222', line: '#222' },
    3: { fill: '#1d1d1f', text: '#eee', line: '#eee' },
    4: { fill: '#1d1d1f', text: '#eee', line: '#eee' },
    5: { fill: '#1f8fd6', text: '#fff', line: '#111' },
    6: { fill: '#1f8fd6', text: '#fff', line: '#111' },
    7: { fill: '#e2343a', text: '#fff', line: '#111' },
    8: { fill: '#e2343a', text: '#fff', line: '#111' },
    9: { fill: '#f6d32d', text: '#222', line: '#111' },
    10: { fill: '#f6d32d', text: '#222', line: '#111' },
};
