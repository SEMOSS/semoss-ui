export type AppLogLevel =
	| "INFO"
	| "WARN"
	| "ERROR"
	| "DEBUG"
	| "TRACE"
	| "OTHER";

export interface ParsedAppLogLine {
	raw: string;
	level: AppLogLevel;
	/** Present when `raw` matched the AppLogManager pattern; absent otherwise (render raw as a fallback). */
	timestamp?: string;
	source?: string;
	message?: string;
}

// Matches AppLogManager's per-project pattern:
// "[%-5level] %d{yyyy-MM-dd HH:mm:ss} %c{1.}:%L [user=%X{userId}] %maskMsg%n"
const LINE_REGEX =
	/^\[(\w+)\s*\]\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+\[user=([^\]]*)\]\s*(.*)$/;

const VALID_LEVELS: ReadonlySet<string> = new Set([
	"INFO",
	"WARN",
	"ERROR",
	"DEBUG",
	"TRACE",
]);

function normalizeLevel(raw: string): AppLogLevel {
	const upper = raw.toUpperCase();
	return VALID_LEVELS.has(upper) ? (upper as AppLogLevel) : "OTHER";
}

export function parseAppLogLine(raw: string): ParsedAppLogLine {
	const match = raw.match(LINE_REGEX);
	if (!match) {
		return { raw, level: "OTHER" };
	}
	const [, level, timestamp, source, , message] = match;
	return {
		raw,
		level: normalizeLevel(level),
		timestamp,
		source: source.replace(/:$/, ""),
		message,
	};
}

/** Text color classes per level — theme-adaptive (real tokens + Tailwind dark: pairs), not fixed hex. */
export const APP_LOG_LEVEL_TEXT_CLASSES: Record<AppLogLevel, string> = {
	INFO: "text-foreground",
	WARN: "text-amber-600 dark:text-amber-400",
	ERROR: "text-destructive",
	DEBUG: "text-violet-600 dark:text-violet-400",
	TRACE: "text-muted-foreground",
	OTHER: "text-muted-foreground",
};

/** Badge/chip background+text classes per level, active ("on") state only. */
export const APP_LOG_LEVEL_CHIP_CLASSES: Record<
	"INFO" | "WARN" | "ERROR" | "DEBUG",
	string
> = {
	INFO: "data-[state=on]:bg-muted data-[state=on]:text-foreground",
	WARN: "data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700 dark:data-[state=on]:bg-amber-900/30 dark:data-[state=on]:text-amber-400",
	ERROR: "data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive",
	DEBUG: "data-[state=on]:bg-violet-100 data-[state=on]:text-violet-700 dark:data-[state=on]:bg-violet-900/30 dark:data-[state=on]:text-violet-400",
};

/** Static (non-toggle) badge classes per level — for read-only display, e.g. a table cell. */
export const APP_LOG_LEVEL_BADGE_CLASSES: Record<AppLogLevel, string> = {
	INFO: "bg-muted text-foreground",
	WARN: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
	ERROR: "bg-destructive/10 text-destructive",
	DEBUG: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
	TRACE: "bg-muted text-muted-foreground",
	OTHER: "bg-muted text-muted-foreground",
};
