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
