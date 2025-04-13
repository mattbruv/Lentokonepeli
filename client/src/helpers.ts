export function randomGuid() {
    return crypto.randomUUID();
}

/**
 * Useful in switch statements.
 * Ensures that all possible cases have been tested on type level.
 */
export function assertNever(value: never, message?: string) {
    throw new Error(`${message ?? "Expected to never get here, got value"}: ${value}`);
}

export function ticksToHHMMSS(ticks: number): string {
    const totalSeconds = Math.floor((ticks * 10) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
