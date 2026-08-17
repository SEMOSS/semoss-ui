import { MessageSquareIcon } from "lucide-react";
import { useEffect } from "react";
import { useInsight } from "@semoss/sdk/react";
import { useWorkbench } from "@/hooks/use-workbench";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import { WorkbenchChatPanel } from "./workbench-chat-panel";

/**
 * Renders the workbench CHAT panel, initializing the chat slice for the
 * insight. Waits until the insight is ready, initializes the chat slice for
 * the insight ID, and disposes the slice (dropping subscriptions and state)
 * when the panel unmounts or the insight changes.
 *
 * @name WorkbenchChatView
 * @return The chat panel wired to the current insight.
 */
export const WorkbenchChatView = () => {
	const insight = useInsight();
	const initialize = useWorkbench((state) => state.chat.initialize);
	const dispose = useWorkbench((state) => state.chat.dispose);

	useEffect(() => {
		if (!insight.isReady || !insight.insightId) {
			return;
		}
		void initialize(insight.insightId);
		return () => dispose();
	}, [insight.isReady, insight.insightId, initialize, dispose]);

	return <WorkbenchChatPanel />;
};

/**
 * Shared `components` map entry every workbench uses for the CHAT border tab:
 * the message icon shown on the border tab and the chat view rendered when
 * the tab is active.
 *
 * @name WORKBENCH_CHAT_PANEL
 */
export const WORKBENCH_CHAT_PANEL: WorkbenchPanelConfig = {
	tab: () => <MessageSquareIcon className="size-4" />,
	view: () => <WorkbenchChatView />,
};
