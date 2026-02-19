// src/utils/logHelpers.ts

/**
 * Determines if a message should be logged at the given level.
 * @param logLevel The current log level (silent, normal, verbose, debug)
 * @param level The level to check (normal, verbose, debug)
 */
export function shouldLog(
	logLevel: string | undefined,
	level: "normal" | "verbose" | "debug",
): boolean {
	const levels = ["silent", "normal", "verbose", "debug"];
	let current: string = "normal";
	if (typeof logLevel === "string" && levels.includes(logLevel)) {
		current = logLevel;
	}
	return levels.indexOf(current) >= levels.indexOf(level);
}

/**
 * Logs a message with timing if the log level allows.
 * @param log The log function (e.g., this.log)
 * @param logLevel The current log level
 * @param message The message to log
 * @param startTime Optional start time for timing
 * @param level The log level for this message
 */
export function logWithTiming(
	log: (msg: string) => void,
	message: string,
	startTime: number,
) {
	const elapsed = Date.now() - startTime;
	log(`⏱️ [${elapsed}ms] ${message}`);
}
