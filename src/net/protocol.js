export function encode(message) {
    return JSON.stringify(message);
}
export function decode(data) {
    if (typeof data !== 'string')
        return null;
    try {
        return JSON.parse(data);
    }
    catch {
        return null;
    }
}
