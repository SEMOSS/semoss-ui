import {
	Activity,
	AppWindow,
	Brain,
	Code2,
	Database,
	GitBranch,
	Layers,
	Play,
	Server,
	Shuffle,
	Workflow,
	Zap,
} from "lucide-react";
import type React from "react";
import type { WorkflowNodeType } from "@/pages/workflow/workflow.types";

export const NODE_ICONS: Record<
	WorkflowNodeType,
	React.ComponentType<{ className?: string }>
> = {
	trigger: Play,
	"database-engine": Database,
	"storage-engine": Server,
	"vector-engine": Brain,
	"model-engine": Activity,
	"function-engine": Zap,
	app: AppWindow,
	"custom-pixel": Code2,
	"fan-out": Layers,
	conditional: GitBranch,
	transform: Shuffle,
	"sub-workflow": Workflow,
};

export const NODE_COLORS: Record<WorkflowNodeType, string> = {
	trigger: "bg-emerald-500",
	"database-engine": "bg-blue-500",
	"storage-engine": "bg-orange-500",
	"vector-engine": "bg-purple-500",
	"model-engine": "bg-pink-500",
	"function-engine": "bg-yellow-500",
	app: "bg-cyan-500",
	"custom-pixel": "bg-slate-500",
	"fan-out": "bg-indigo-500",
	conditional: "bg-amber-500",
	transform: "bg-teal-500",
	"sub-workflow": "bg-teal-600",
};

export const NODE_LABELS: Record<WorkflowNodeType, string> = {
	trigger: "Trigger",
	"database-engine": "Database",
	"storage-engine": "Storage",
	"vector-engine": "Vector",
	"model-engine": "Model",
	"function-engine": "Function",
	app: "App",
	"custom-pixel": "Custom Pixel",
	"fan-out": "Fan-Out",
	conditional: "Conditional",
	transform: "Transform",
	"sub-workflow": "Sub-Workflow",
};
