import { WrenchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbenchPanel } from "@semoss/workbench";
import { useAssistant } from "@/hooks/use-assistant";
import { AssistantToolContent } from "./assistant-tool-content";
import { getPresentedTools } from "./assistant-tool-ui";

/** Discard cached/stale panels and resolve live content using all three identity fields. */
export const AssistantToolPanel = ({ id }: WorkbenchPanelProps) => {
	const { config, close, isVisible } = useWorkbenchPanel(id);
	const [hasStarted, setHasStarted] = useState(false);
	const conversationId = useAssistant((state) => state.roomId);
	const isInitializing = useAssistant((state) => state.isInitializing);
	const run = useAssistant((state) =>
		typeof config.runId === "string" ? state.runs[config.runId] : undefined,
	);
	const tool =
		run &&
		getPresentedTools(run).find((tool) => tool.id === config.toolCallId);
	const hasPendingAction = Boolean(
		run?.pendingActions.some((action) => action.toolCallId === tool?.id),
	);
	const shouldMount = hasStarted || isVisible || hasPendingAction;
	// Start pending frames even in background tabs, then retain their browser
	// state after the action settles. Unvisited history remains lazy.
	useEffect(() => {
		if (shouldMount) setHasStarted(true);
	}, [shouldMount]);
	const isStale =
		config.conversationId !== conversationId || (!isInitializing && !tool);
	useEffect(() => {
		if (isStale) close();
	}, [close, isStale]);
	if (isStale || !run || !tool || !shouldMount) return null;
	return (
		<AssistantToolContent
			key={`${run.runId}:${tool.id}`}
			run={run}
			tool={tool}
		/>
	);
};

/** Registered in each client workbench; pending frames start even in background tabs. */
export const ASSISTANT_TOOL_PANEL: WorkbenchPanelConfig = {
	name: "Tool",
	mount: "eager",
	canRename: false,
	icon: ({ className }) => <WrenchIcon className={className} />,
	matches: (a, b) =>
		typeof a.conversationId === "string" &&
		typeof a.runId === "string" &&
		typeof a.toolCallId === "string" &&
		a.conversationId === b.conversationId &&
		a.runId === b.runId &&
		a.toolCallId === b.toolCallId,
	content: AssistantToolPanel,
};
