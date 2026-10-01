import { MessageSquareIcon } from "lucide-react";
import { useEffect } from "react";
import { useInsight } from "@semoss/sdk/react";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useAssistant } from "@/hooks/use-assistant";
import { AssistantPanel } from "./assistant-panel";

/**
 * Renders the workbench ASSISTANT panel. Waits until the insight is ready,
 * initializes the assistant store for that insight ID, and disposes it
 * (dropping run watchers) when the panel unmounts or the insight changes.
 *
 * `dispose()`, not `destroy()`: the store outlives any one insight. Its
 * lifetime belongs to `useAssistantStore`, which owns the teardown.
 *
 * @name AssistantView
 * @return The assistant panel wired to the current insight.
 */
const AssistantView = () => {
	const insight = useInsight();
	const initialize = useAssistant((state) => state.initialize);
	const dispose = useAssistant((state) => state.dispose);

	useEffect(() => {
		if (!insight.isReady || !insight.insightId) {
			return;
		}
		void initialize(insight.insightId);
		return () => dispose();
	}, [insight.isReady, insight.insightId, initialize, dispose]);

	return <AssistantPanel />;
};

/**
 * Shared blueprint every workbench registers for the ASSISTANT panel. Mounts
 * eagerly so the assistant initializes (and can surface notifications) while
 * its border is still collapsed.
 *
 * @name ASSISTANT_PANEL
 */
export const ASSISTANT_PANEL: WorkbenchPanelConfig = {
	name: "Assistant",
	helpText: "Assistant",
	icon: ({ className }) => <MessageSquareIcon className={className} />,
	canClose: false,
	canRename: false,
	// the panel draws its own heading — room title, history, settings, and new
	// conversation — so the shell's border header would stack on top of it
	enableBorderHeader: false,
	mount: "eager",
	content: () => <AssistantView />,
};
