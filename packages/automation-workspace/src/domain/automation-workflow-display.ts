import {
	Braces,
	Database,
	FolderOpen,
	FunctionSquare,
	type LucideIcon,
	Network,
	SlidersHorizontal,
	Sparkles,
	Variable,
} from "lucide-react";
import type { AutomationWorkflowNodeType } from "./automation-workflow.types";

/** Visual metadata shared by workflow-node pickers and canvas cards. */
export interface AutomationWorkflowNodeDisplay {
	icon: LucideIcon;
	color: string;
}

export function getWorkflowNodeDisplay(
	type: AutomationWorkflowNodeType,
): AutomationWorkflowNodeDisplay {
	if (type === "trigger.start") {
		return { icon: Braces, color: "text-emerald-600" };
	}
	if (type.startsWith("database.")) {
		return { icon: Database, color: "text-blue-600" };
	}
	if (type.startsWith("model.")) {
		return { icon: Sparkles, color: "text-purple-600" };
	}
	if (type.startsWith("storage.")) {
		return { icon: FolderOpen, color: "text-emerald-600" };
	}
	if (type.startsWith("vector.")) {
		return { icon: Network, color: "text-amber-600" };
	}
	if (type === "function.execute") {
		return { icon: FunctionSquare, color: "text-cyan-600" };
	}
	if (type === "app.pixel") {
		return { icon: Variable, color: "text-slate-600" };
	}
	if (type === "control.wait") {
		return { icon: SlidersHorizontal, color: "text-sky-600" };
	}
	return { icon: Braces, color: "text-primary" };
}
