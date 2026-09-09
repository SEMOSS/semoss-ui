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
const WorkbenchAssistantView = () => {
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
 * Shared blueprint every workbench registers for the ASSISTANT panel. Mounts
 * eagerly so the assistant initializes (and can surface notifications) while
 * its border is still collapsed.
 *
 * @name WORKBENCH_ASSISTANT_PANEL
 */
export const WORKBENCH_ASSISTANT_PANEL: WorkbenchPanelConfig = {
	name: "Assistant",
	helpText: "Assistant",
	icon: ({ className }) => <MessageSquareIcon className={className} />,
	canClose: false,
	canRename: false,
	// the panel draws its own heading — room title, history, settings, and new
	// conversation — so the shell's border header would stack on top of it
	enableBorderHeader: false,
	mount: "eager",
	content: () => <WorkbenchAssistantView />,
};
