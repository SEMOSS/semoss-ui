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
} from "@/pages/automation/automation.types";
import { formatDurationMs } from "../automation-workspace/automation-utils";

export { formatDurationMs };

// Manual runs execute in the background — the FE polls GetAutomationRun on this
// interval until the run leaves RUNNING status.
export const RUN_POLL_INTERVAL_MS = 3000;

export interface AutomationRunData {
	STATUS: RunStatus;
	RUN_ID?: string;
	TOTAL_NODES?: number;
	COMPLETED_NODES?: number;
	FAILED_NODE_ID?: string;
	nodeResults?: AutomationNodeResult[];
	ERROR_MESSAGE?: string;
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
		label: "Database Query",
		description: "Run SQL against a database engine",
		icon: Database,
		color: "text-blue-600",
	},
	{
		type: "model-engine",
		label: "AI Model",
		description: "Call an LLM, get embeddings, or run vision",
		icon: Cpu,
		color: "text-purple-600",
	},
	{
		type: "vector-engine",
		label: "Vector Search",
		description: "Query a vector database for similar content",
		icon: Bolt,
		color: "text-amber-600",
	},
	{
		type: "storage-engine",
		label: "Storage",
		description: "Upload or download from cloud storage",
		icon: Archive,
		color: "text-emerald-600",
	},
	{
		type: "function-engine",
		label: "Function / API",
		description: "Call an external API or function engine",
		icon: Sigma,
		color: "text-cyan-600",
	},
	{
		type: "app",
		label: "App Engine",
		description: "Run a Pixel expression inside an app engine context",
		icon: LayoutGrid,
		color: "text-slate-600",
	},
	{
		type: "wait",
		label: "Wait / Delay",
		description: "Pause execution for a fixed number of seconds",
		icon: Clock,
		color: "text-sky-600",
	},
];

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

export const STEP_STATUS_BORDER: Record<string, string> = {
	error: "border-destructive/40",
	success: "border-emerald-500/40",
	running: "border-primary/40",
	idle: "border-border",
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
		description: "Start the automation manually or on a schedule",
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

export function newStepId(type: AutomationNodeType) {
	return `${type}-${crypto.randomUUID()}`;
}

export function formatTimestamp(iso: string): string {
	try {
		return new Date(iso).toLocaleString();
	} catch {
		return iso;
	}
}

export function formatRunDuration(
	startedAt: string,
	completedAt: string | null,
): string {
	if (!completedAt) return "—";
	try {
		const durationMs =
			new Date(completedAt).getTime() - new Date(startedAt).getTime();
		return formatDurationMs(durationMs);
	} catch {
		return "—";
	}
}

export function getStatusClasses(status: string) {
	return STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
}

export function getDisplayMeta(type: AutomationNodeType | string) {
	return TYPE_DISPLAY_META[type] ?? TYPE_DISPLAY_META["database-engine"];
}

export function getStepHeaderLabel(step: AutomationNode) {
	const meta = getDisplayMeta(step.type);
	return step.label || meta.label;
}
