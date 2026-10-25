export function nextRandom(seed) {
    const next = (seed + 0x6d2b79f5) | 0;
    let t = next;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return [value, next];
}
export function shuffle(items, seed) {
    const result = items.slice();
    let state = seed;
    for (let i = result.length - 1; i > 0; i--) {
        const [r, s] = nextRandom(state);
        state = s;
        const j = Math.floor(r * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return [result, state];
}
export function randomSeed() {
    return (Math.random() * 4294967296) | 0;
}
