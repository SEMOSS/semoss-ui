import { MessageSquareIcon } from "lucide-react";
import { useWorkbenchChatConfig } from "@/hooks/use-workbench-chat-config";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import { WorkbenchChatPanel } from "./workbench-chat-panel";

/** Renders the workbench CHAT panel driven by the store's `chat` slice. */
export const WorkbenchChatView = () => {
	const systemPrompt = useWorkbenchChatConfig((state) => state.systemPrompt);
	const mcp = useWorkbenchChatConfig((state) => state.mcp);
	const toolHandlers = useWorkbenchChatConfig((state) => state.toolHandlers);

	return (
		<WorkbenchChatPanel
			systemPrompt={systemPrompt}
			mcp={mcp}
			toolHandlers={toolHandlers}
		/>
	);
};

/** Shared `components` map entry every workbench uses for the CHAT border tab. */
export const WORKBENCH_CHAT_PANEL: WorkbenchPanelConfig = {
	tab: () => <MessageSquareIcon className="size-4" />,
	view: () => <WorkbenchChatView />,
};
