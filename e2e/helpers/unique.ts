export function uniqueEmail(prefix = "e2e"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@example.com`;
}
export function eventDateRange(days = 5): {
    startsOn: string;
    endsOn: string;
} {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 14);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days - 1);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { startsOn: fmt(start), endsOn: fmt(end) };
}
