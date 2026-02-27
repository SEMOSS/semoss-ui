// src/utils/logger.ts

/**
 * Centralized logging system for SEMOSS CLI.
 *
 * Dual-output logger that:
 * - Writes ALL log levels to daily rotating files in ~/.config/semoss/logs/
 * - Writes to the console respecting the user's chosen verbosity level
 * - Strips ANSI codes from file output for clean, grep-able logs
 * - Auto-prunes old log files beyond a configurable retention window
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

/** Log levels ordered from least to most verbose. */
export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

/** Numeric priority (higher = more verbose). */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	silent: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 4,
};

/** Options used when constructing a Logger instance. */
export interface LoggerOptions {
	/** Console verbosity level. Defaults to "info". */
	level?: LogLevel;

	/**
	 * Command or subsystem name that will appear in log file entries.
	 * Example: "deploy", "connect", "init".
	 */
	command?: string;

	/**
	 * Number of daily log files to keep.  Older files are pruned on startup.
	 * Set to 0 to disable pruning.  Defaults to 30.
	 */
	retention?: number;

	/**
	 * Override the log directory.  Defaults to ~/.config/semoss/logs.
	 * Mainly useful for testing.
	 */
	logDir?: string;

	/**
	 * Optional function used for console output (defaults to console.log).
	 * Accepting this makes it easy to integrate with oclif's `this.log`.
	 */
	console?: (msg: string) => void;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Strip ANSI escape codes so log files are clean plain text. */
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional ANSI stripping
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]|\x1b\].*?(?:\x07|\x1b\\)/g;
function stripAnsi(str: string): string {
	return str.replace(ANSI_RE, "");
}

/** Return today's date as YYYY-MM-DD. */
function todayStamp(): string {
	const d = new Date();
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/** Return an ISO-ish timestamp without the timezone suffix for brevity. */
function timestamp(): string {
	return new Date().toISOString().replace("T", " ").replace("Z", "");
}

/** Get the default log directory following XDG convention. */
function getDefaultLogDir(): string {
	const xdgConfigHome = process.env.XDG_CONFIG_HOME;
	const baseDir = xdgConfigHome || path.join(os.homedir(), ".config");
	return path.join(baseDir, "semoss", "logs");
}

// ────────────────────────────────────────────────────────────────────────────
// Logger
// ────────────────────────────────────────────────────────────────────────────

export class Logger {
	private readonly level: LogLevel;
	private readonly command: string;
	private readonly logDir: string;
	private readonly retention: number;
	private readonly consoleFn: (msg: string) => void;

	/** Resolved path to today's log file (lazy-initialised). */
	private logFilePath: string | null = null;

	/** Write stream for the current log file (lazy-initialised). */
	private stream: fs.WriteStream | null = null;

	/** Tracks whether we've already run log pruning this session. */
	private pruned = false;

	/**
	 * When set, this logger is a child and should delegate file writes
	 * to the parent instead of managing its own stream.
	 */
	private parent: Logger | null = null;

	constructor(options: LoggerOptions = {}) {
		this.level = options.level ?? "info";
		this.command = options.command ?? "cli";
		this.logDir = options.logDir ?? getDefaultLogDir();
		this.retention = options.retention ?? 30;
		this.consoleFn = options.console ?? console.log;
	}

	// ── Public API ──────────────────────────────────────────────────────

	/** Log at debug level – only visible in console when level=debug. */
	debug(message: string, ...args: unknown[]): void {
		this.write("debug", message, args);
	}

	/** Log at info level – visible at info and debug. */
	info(message: string, ...args: unknown[]): void {
		this.write("info", message, args);
	}

	/** Log at warn level – visible at warn, info, and debug. */
	warn(message: string, ...args: unknown[]): void {
		this.write("warn", message, args);
	}

	/** Log at error level – always visible (except in silent mode). */
	error(message: string, ...args: unknown[]): void {
		this.write("error", message, args);
	}

	/**
	 * Unconditionally log to the console (ignoring level), AND write to file.
	 * Use for messages that must always appear (banners, prompts, etc.).
	 */
	always(message: string): void {
		this.consoleFn(message);
		this.appendToFile("info", message);
	}

	/**
	 * Write ONLY to the log file (never to console).
	 * Useful for capturing raw data/payloads without cluttering the terminal.
	 */
	fileOnly(level: LogLevel, message: string): void {
		this.appendToFile(level, message);
	}

	/**
	 * Create a child logger that inherits settings but overrides the command
	 * label.  Handy for sub-tasks within a command.
	 *
	 * ```ts
	 * const sub = logger.child("backup");
	 * sub.info("Creating backup…"); // [backup] Creating backup…
	 * ```
	 */
	child(command: string): Logger {
		const child = new Logger({
			level: this.level,
			command,
			retention: this.retention,
			logDir: this.logDir,
			console: this.consoleFn,
		});
		// Delegate file I/O to the parent so we don't open a second
		// stream to the same file (which could interleave lines).
		child.parent = this;
		return child;
	}

	/**
	 * Start a timed operation.  Returns a function that, when called, logs
	 * the elapsed time.
	 *
	 * ```ts
	 * const done = logger.time("zip creation");
	 * // … do work …
	 * done(); // logs "zip creation completed in 1234ms"
	 * ```
	 */
	time(label: string): () => void {
		const start = Date.now();
		this.debug(`${label} started`);
		return () => {
			const elapsed = Date.now() - start;
			this.debug(`${label} completed in ${elapsed}ms`);
		};
	}

	/**
	 * Flush the write stream and release resources.
	 * Call this at the end of a command's lifecycle if you want to guarantee
	 * all data is flushed before the process exits.
	 */
	async close(): Promise<void> {
		return new Promise((resolve) => {
			if (this.stream) {
				this.stream.end(() => {
					this.stream = null;
					this.logFilePath = null;
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	/**
	 * Return the absolute path to the current log file (creating the
	 * directory if needed).  Useful for telling the user where to find logs.
	 */
	getLogFilePath(): string {
		this.ensureLogDir();
		return this.resolveLogFilePath();
	}

	/**
	 * Return the log directory path.
	 */
	getLogDir(): string {
		return this.logDir;
	}

	// ── Internals ───────────────────────────────────────────────────────

	/**
	 * Core write: sends to console (if level allows) and always to file.
	 */
	private write(level: LogLevel, message: string, args: unknown[]): void {
		const formatted = this.formatConsole(level, message, args);

		// Console output respects the configured verbosity.
		if (this.shouldLogToConsole(level)) {
			this.consoleFn(formatted);
		}

		// File output always captures everything.
		this.appendToFile(level, message, args);
	}

	/** Check if a given level should appear on the console. */
	private shouldLogToConsole(level: LogLevel): boolean {
		return LOG_LEVEL_PRIORITY[this.level] >= LOG_LEVEL_PRIORITY[level];
	}

	/** Format a message for console output (preserves ANSI). */
	private formatConsole(
		_level: LogLevel,
		message: string,
		args: unknown[],
	): string {
		const extra =
			args.length > 0
				? ` ${args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}`
				: "";
		return `${message}${extra}`;
	}

	/** Format a message for file output (no ANSI, includes metadata). */
	private formatFile(
		level: LogLevel,
		message: string,
		args?: unknown[],
	): string {
		const ts = timestamp();
		const lvl = level.toUpperCase().padEnd(5);
		const cmd = this.command;
		const extra =
			args && args.length > 0
				? ` ${args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}`
				: "";
		return `${ts} [${lvl}] [${cmd}] ${stripAnsi(message)}${stripAnsi(extra)}\n`;
	}

	/** Append a formatted line to the daily log file. */
	private appendToFile(
		level: LogLevel,
		message: string,
		args?: unknown[],
	): void {
		// Child loggers delegate to the parent so only one stream is open.
		if (this.parent) {
			// Format with *this* logger's command label, then write via parent.
			try {
				const line = this.formatFile(level, message, args);
				this.parent.writeRawLine(line);
			} catch {
				// Never let file logging break the CLI.
			}
			return;
		}

		try {
			this.ensureStream();
			const line = this.formatFile(level, message, args);
			this.stream?.write(line);
		} catch {
			// Never let file logging break the CLI.
		}
	}

	/**
	 * Write a pre-formatted line directly to the stream.
	 * Used by child loggers to share the parent's stream.
	 */
	private writeRawLine(line: string): void {
		try {
			this.ensureStream();
			this.stream?.write(line);
		} catch {
			// Never let file logging break the CLI.
		}
	}

	/** Lazy-init the write stream, creating the log dir if needed. */
	private ensureStream(): void {
		const filePath = this.resolveLogFilePath();

		// If the date rolled over, swap to a new file.
		if (this.logFilePath !== filePath) {
			if (this.stream) {
				this.stream.end();
				this.stream = null;
			}
			this.ensureLogDir();

			// Open the file with restrictive permissions (0o600).
			// We use fs.openSync to bypass the process umask, then wrap
			// the file descriptor in a WriteStream.
			const fd = fs.openSync(filePath, "a", 0o600);
			this.stream = fs.createWriteStream(filePath, {
				fd,
				flags: "a",
			});
			this.logFilePath = filePath;

			// Run pruning once per session on first write.
			if (!this.pruned) {
				this.pruned = true;
				this.pruneOldLogs();
			}
		}
	}

	/** Ensure the log directory exists. */
	private ensureLogDir(): void {
		if (!fs.existsSync(this.logDir)) {
			fs.mkdirSync(this.logDir, { recursive: true, mode: 0o700 });
		}
	}

	/** Resolve today's log file path. */
	private resolveLogFilePath(): string {
		return path.join(this.logDir, `semoss-${todayStamp()}.log`);
	}

	/**
	 * Delete log files older than `this.retention` days.
	 * Runs asynchronously in the background – failures are silently ignored.
	 */
	private pruneOldLogs(): void {
		if (this.retention <= 0) return;

		try {
			const entries = fs.readdirSync(this.logDir);
			const logFiles = entries
				.filter((f) => /^semoss-\d{4}-\d{2}-\d{2}\.log$/.test(f))
				.sort();

			if (logFiles.length <= this.retention) return;

			const toRemove = logFiles.slice(
				0,
				logFiles.length - this.retention,
			);
			for (const file of toRemove) {
				fs.unlinkSync(path.join(this.logDir, file));
			}
		} catch {
			// Pruning is best-effort.
		}
	}
}

// ────────────────────────────────────────────────────────────────────────────
// Convenience: map the old logLevel flag values to LogLevel
// ────────────────────────────────────────────────────────────────────────────

/**
 * Convert the deploy command's legacy `--logLevel` flag values
 * ("silent" | "normal" | "verbose" | "debug") into the new LogLevel type.
 */
export function toLogLevel(flagValue: string | undefined): LogLevel {
	switch (flagValue) {
		case "silent":
			return "silent";
		case "debug":
			return "debug";
		case "verbose":
			return "info";
		case "normal":
			return "info";
		default:
			return "info";
	}
}

// ────────────────────────────────────────────────────────────────────────────
// Singleton helper (optional convenience)
// ────────────────────────────────────────────────────────────────────────────

let _defaultLogger: Logger | null = null;

/**
 * Get or create a default logger instance.
 * Useful for utility modules that don't have access to a command context.
 */
export function getDefaultLogger(): Logger {
	if (!_defaultLogger) {
		_defaultLogger = new Logger();
	}
	return _defaultLogger;
}

/**
 * Replace the default singleton logger.
 * Call this early in a command's lifecycle so utility modules pick it up.
 */
export function setDefaultLogger(logger: Logger): void {
	_defaultLogger = logger;
}
