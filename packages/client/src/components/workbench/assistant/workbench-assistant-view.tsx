import { MessageSquareIcon } from "lucide-react";
import { useEffect } from "react";
import { useInsight } from "@semoss/sdk/react";
import { useWorkbench } from "@/hooks/use-workbench";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import { WorkbenchAssistantPanel } from "./workbench-assistant-panel";

/**
 * Renders the workbench ASSISTANT panel, initializing the assistant slice for the
 * insight. Waits until the insight is ready, initializes the assistant slice for
 * the insight ID, and disposes the slice (dropping subscriptions and state)
 * when the panel unmounts or the insight changes.
 *
 * @name WorkbenchAssistantView
 * @return The assistant panel wired to the current insight.
 */
export const WorkbenchAssistantView = () => {
	const insight = useInsight();
	const initialize = useWorkbench((state) => state.assistant.initialize);
	const dispose = useWorkbench((state) => state.assistant.dispose);

	useEffect(() => {
		if (!insight.isReady || !insight.insightId) {
			return;
		}
		void initialize(insight.insightId);
		return () => dispose();
	}, [insight.isReady, insight.insightId, initialize, dispose]);

	return <WorkbenchAssistantPanel />;
};

/**
 * Shared `components` map entry every workbench uses for the ASSISTANT border tab:
 * the message icon shown on the border tab and the assistant view rendered when
 * the tab is active.
 *
 * @name WORKBENCH_ASSISTANT_PANEL
 */
export const WORKBENCH_ASSISTANT_PANEL: WorkbenchPanelConfig = {
	tab: () => <MessageSquareIcon className="size-4" />,
	view: () => <WorkbenchAssistantView />,
};
