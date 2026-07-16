import {
	AppWindow,
	Archive,
	Bolt,
	Bot,
	Code,
	Database,
	GitBranch,
	type LucideIcon,
	Repeat,
	Shuffle,
	Sigma,
	Workflow,
	Zap,
} from "lucide-react";
import type {
	RunStatus,
	WorkflowNode,
	WorkflowNodeResult,
	WorkflowNodeType,
} from "@/pages/workflow/workflow.types";
import { formatDurationMs } from "../workflow-workspace/workflow-utils";

export const FOR_EACH_TYPE = "for-each" as WorkflowNodeType;

// Manual runs execute in the background now (see TriggerWorkflowReactor) — the FE polls
// GetWorkflowRun on this interval until the run leaves RUNNING status.
export const RUN_POLL_INTERVAL_MS = 3000;

export interface WorkflowRunData {
	STATUS: RunStatus;
	RUN_ID?: string;
	TOTAL_NODES?: number;
	COMPLETED_NODES?: number;
	FAILED_NODE_ID?: string;
	nodeResults?: WorkflowNodeResult[];
	ERROR_MESSAGE?: string;
}

export const STEP_TYPES: {
	type: WorkflowNodeType;
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
		icon: Bot,
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
		label: "Run App",
		description: "Execute another app's pixel recipe",
		icon: AppWindow,
		color: "text-pink-600",
	},
	{
		type: "custom-pixel",
		label: "Custom Pixel",
		description: "Write and execute raw Pixel code",
		icon: Code,
		color: "text-slate-600",
	},
	{
		type: "transform",
		label: "Transform",
		description: "Reshape data between steps",
		icon: Shuffle,
		color: "text-orange-600",
	},
	{
		type: "for-each" as WorkflowNodeType,
		label: "For Each",
		description: "Iterate over rows and run steps per item",
		icon: Repeat,
		color: "text-indigo-600",
	},
	{
		type: "sub-workflow",
		label: "Sub-Workflow",
		description:
			"Run another project's saved workflow and wait for its result",
		icon: Workflow,
		color: "text-teal-600",
	},
	{
		type: "conditional",
		label: "Conditional",
		description: "Branch on a JS expression — run TRUE or FALSE steps",
		icon: GitBranch,
		color: "text-amber-600",
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
		runtimeType?: WorkflowNodeType;
	}
> = {
	trigger: {
		label: "Trigger",
		description: "Start the workflow manually or on a schedule",
		icon: Zap,
		color: "text-yellow-600",
	},
	"database-engine": STEP_TYPES[0],
	"model-engine": STEP_TYPES[1],
	"vector-engine": STEP_TYPES[2],
	"storage-engine": STEP_TYPES[3],
	"function-engine": STEP_TYPES[4],
	app: STEP_TYPES[5],
	"custom-pixel": STEP_TYPES[6],
	transform: STEP_TYPES[7],
	"for-each": {
		...STEP_TYPES[8],
		runtimeType: "fan-out",
	},
	"fan-out": {
		...STEP_TYPES[8],
		runtimeType: "fan-out",
	},
	"sub-workflow": STEP_TYPES[9],
	conditional: STEP_TYPES[10],
};

export function newStepId(type: WorkflowNodeType) {
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

export function getDisplayMeta(type: WorkflowNodeType) {
	return TYPE_DISPLAY_META[type] ?? TYPE_DISPLAY_META["custom-pixel"];
}

export function getStepHeaderLabel(step: WorkflowNode) {
	const meta = getDisplayMeta(step.type);
	return step.label || meta.label;
}
