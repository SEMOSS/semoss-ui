import {
	Archive,
	Bolt,
	Clock,
	Cpu,
	Database,
	LayoutGrid,
	type LucideIcon,
	Play,
	Sigma,
} from "lucide-react";
import type {
	AutomationNode,
	AutomationNodeResult,
	AutomationNodeType,
	RunStatus,
} from "./automation.types";
import { formatDurationMs } from "./format";

export interface AutomationRunData {
	STATUS: RunStatus;
	RUN_ID?: string;
	nodeResults?: AutomationNodeResult[];
	ERROR_MESSAGE?: string;
	/** Per-workflow human-readable summary (see AutomationConstants.RESULT_SUMMARY on the backend). */
	summary?: string;
}

export const STEP_TYPES: {
	type: AutomationNodeType;
	label: string;
	description: string;
	icon: LucideIcon;
	color: string;
}[] = [
	{
		type: "database-engine",
		label: "Query Database",
		description: "Run a query or write against a connected database",
		icon: Database,
		color: "text-blue-600",
	},
	{
		type: "model-engine",
		label: "Ask AI",
		description: "Send a prompt to an AI model and get a response",
		icon: Cpu,
		color: "text-purple-600",
	},
	{
		type: "vector-engine",
		label: "Search Documents",
		description: "Find relevant documents using semantic search",
		icon: Bolt,
		color: "text-amber-600",
	},
	{
		type: "storage-engine",
		label: "File Storage",
		description: "Upload, download, or list files in cloud storage",
		icon: Archive,
		color: "text-emerald-600",
	},
	{
		type: "function-engine",
		label: "Run Function",
		description: "Call a custom function or external API",
		icon: Sigma,
		color: "text-cyan-600",
	},
	{
		type: "app",
		label: "Run App",
		description: "Run a custom function from this app",
		icon: LayoutGrid,
		color: "text-slate-600",
	},
	{
		type: "wait",
		label: "Delay",
		description: "Pause execution for a fixed number of seconds",
		icon: Clock,
		color: "text-sky-600",
	},
];

// Two namespaces in one map: UPPERCASE keys match RunStatus/NodeStatus from the
// backend (PENDING, RUNNING, SUCCESS, FAILED, SKIPPED, INTERRUPTED, CANCELLED);
// lowercase keys match the FE-only StepRunStatus used during live poll (idle,
// running, success, error). getStatusClasses() handles both.
export const STATUS_STYLES: Record<string, string> = {
	PENDING: "bg-muted text-muted-foreground",
	RUNNING: "bg-primary/10 text-primary",
	SUCCESS: "bg-emerald-500/10 text-emerald-700",
	FAILED: "bg-destructive/10 text-destructive",
	SKIPPED:
		"bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
	INTERRUPTED: "bg-amber-500/10 text-amber-700",
	CANCELLED:
		"bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
	error: "bg-destructive/10 text-destructive",
	success: "bg-emerald-500/10 text-emerald-700",
	running: "bg-primary/10 text-primary",
	idle: "bg-muted text-muted-foreground",
};

export const TYPE_DISPLAY_META: Record<
	string,
	{
		label: string;
		description: string;
		icon: LucideIcon;
		color: string;
	}
> = {
	trigger: {
		label: "Trigger",
		description: "Start the automation manually",
		icon: Play,
		color: "text-emerald-600",
	},
	"database-engine": STEP_TYPES[0],
	"model-engine": STEP_TYPES[1],
	"vector-engine": STEP_TYPES[2],
	"storage-engine": STEP_TYPES[3],
	"function-engine": STEP_TYPES[4],
	app: STEP_TYPES[5],
	wait: STEP_TYPES[6],
};

/**
 * DB timestamps come back as "YYYY-MM-DD HH:MM:SS.s" with no timezone marker but
 * are stored as UTC. Appending "Z" tells JS to interpret them as UTC, not local time.
 */
function parseUtcDate(iso: string): Date {
	if (!iso) return new Date(Number.NaN);
	const s = iso.trim();
	// Already has timezone info — trust it
	if (s.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
	// Bare datetime (space or T separator) — normalize to ISO 8601 UTC
	return new Date(`${s.replace(" ", "T").replace(/\.\d+$/, "")}Z`);
}

export function formatTimestamp(iso: string): string {
	try {
		return parseUtcDate(iso).toLocaleString();
	} catch {
		return iso;
	}
}

export function formatRelativeTime(iso: string): string {
	try {
		const ms = Date.now() - parseUtcDate(iso).getTime();
		if (ms < 60_000) return "just now";
		if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
		if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
		return parseUtcDate(iso).toLocaleDateString();
	} catch {
		return iso;
	}
}

export function getStatusClasses(status: string) {
	return STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
}

export function getDisplayMeta(type: AutomationNodeType | string) {
	return TYPE_DISPLAY_META[type] ?? TYPE_DISPLAY_META["database-engine"];
}

export function formatRunDuration(
	startedAt: string,
	completedAt: string | null,
): string {
	if (!completedAt) return "—";
	const ms =
		parseUtcDate(completedAt).getTime() - parseUtcDate(startedAt).getTime();
	return formatDurationMs(ms);
}

export const STEP_STATUS_BORDER: Record<string, string> = {
	error: "border-destructive/40",
	success: "border-emerald-500/40",
	running: "border-primary/40",
	idle: "border-border",
};

export function newStepId(type: AutomationNodeType) {
	return `${type}-${crypto.randomUUID()}`;
}

export function getStepHeaderLabel(step: AutomationNode) {
	const meta = getDisplayMeta(step.type);
	return step.label || meta.label;
}
