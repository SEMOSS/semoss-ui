import {
	Bot,
	Braces,
	Database,
	FolderOpen,
	FunctionSquare,
	GitBranch,
	type LucideIcon,
	Network,
	SlidersHorizontal,
	Sparkles,
	Variable,
} from "lucide-react";
import { getAutomationNodeDefinition } from "./automation-node-catalog";
import type { AutomationWorkflowNodeType } from "./automation-workflow.types";

/** Visual metadata shared by workflow-node pickers and canvas cards. */
export interface AutomationWorkflowNodeDisplay {
	icon: LucideIcon;
	color: string;
}

export function getWorkflowNodeDisplay(
	type: AutomationWorkflowNodeType,
): AutomationWorkflowNodeDisplay {
	const category = getAutomationNodeDefinition(type)?.category;
	if (type === "trigger.start") {
		return { icon: Braces, color: "text-emerald-600" };
	}
	if (category === "database") {
		return { icon: Database, color: "text-blue-600" };
	}
	if (category === "model") {
		return { icon: Sparkles, color: "text-purple-600" };
	}
	if (category === "agent") {
		return { icon: Bot, color: "text-indigo-600" };
	}
	if (category === "storage") {
		return { icon: FolderOpen, color: "text-emerald-600" };
	}
	if (category === "vector") {
		return { icon: Network, color: "text-amber-600" };
	}
	if (category === "function") {
		return { icon: FunctionSquare, color: "text-cyan-600" };
	}
	if (category === "app") {
		return { icon: Variable, color: "text-slate-600" };
	}
	if (type === "control.wait") {
		return { icon: SlidersHorizontal, color: "text-sky-600" };
	}
	if (type === "control.if") {
		return { icon: GitBranch, color: "text-orange-600" };
	}
	return { icon: Braces, color: "text-primary" };
}
