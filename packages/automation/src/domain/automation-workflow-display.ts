import {
	Bot,
	Braces,
	BrainCircuit,
	Database,
	FolderOpen,
	FunctionSquare,
	GitBranch,
	ListTree,
	type LucideIcon,
	Network,
	Repeat2,
	SlidersHorizontal,
	Sparkles,
	Variable,
} from "lucide-react";
import {
	getAutomationNodeDefinition,
	hasAutomationNodeDefinitions,
} from "./automation-node-catalog";

/** Visual metadata shared by workflow-node pickers and canvas cards. */
export interface AutomationWorkflowNodeDisplay {
	icon: LucideIcon;
	color: string;
}

export function getWorkflowNodeDisplay(
	type: string,
): AutomationWorkflowNodeDisplay {
	const category =
		(hasAutomationNodeDefinitions()
			? getAutomationNodeDefinition(type)?.category
			: undefined) ?? type.split(".")[0];
	if (type === "trigger.start") {
		return { icon: Braces, color: "text-chart-2" };
	}
	if (category === "database") {
		return { icon: Database, color: "text-primary" };
	}
	if (category === "model") {
		return { icon: Sparkles, color: "text-chart-4" };
	}
	if (category === "agent") {
		return { icon: Bot, color: "text-primary" };
	}
	if (category === "storage") {
		return { icon: FolderOpen, color: "text-chart-2" };
	}
	if (category === "data") {
		return { icon: ListTree, color: "text-chart-2" };
	}
	if (category === "vector") {
		return { icon: Network, color: "text-chart-5" };
	}
	if (category === "function") {
		return { icon: FunctionSquare, color: "text-chart-3" };
	}
	if (category === "app") {
		return { icon: Variable, color: "text-muted-foreground" };
	}
	if (type === "control.wait") {
		return { icon: SlidersHorizontal, color: "text-primary" };
	}
	if (type === "control.if") {
		return { icon: GitBranch, color: "text-chart-1" };
	}
	if (type === "control.jev") {
		return { icon: BrainCircuit, color: "text-chart-4" };
	}
	if (type === "control.loop") {
		return { icon: Repeat2, color: "text-primary" };
	}
	return { icon: Braces, color: "text-primary" };
}
