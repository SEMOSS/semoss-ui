import { PlusIcon } from "lucide-react";
import type { FC } from "react";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { WorkbenchChromeButton } from "@semoss/workbench";
import { useModelChat } from "@/hooks";

/**
 * The chat panel's chrome control: start a new conversation. It abandons the
 * whole room the panel is showing rather than acting on anything inside it, so
 * it belongs to the panel's chrome rather than its body.
 *
 * It reads the busy flags itself — a control draws in the chrome's subtree,
 * which does not re-render when its panel does, so a disabled state closed
 * over the panel's render would never update.
 *
 * @name ModelChatNewConversationControl
 * @return The new-conversation chrome button.
 */
export const ModelChatNewConversationControl: FC<WorkbenchPanelProps> = () => {
	const isInitializing = useModelChat((state) => state.isInitializing);
	const isSending = useModelChat((state) => state.isSending);
	const isStopping = useModelChat((state) => state.isStopping);
	const newRoom = useModelChat((state) => state.newRoom);

	return (
		<WorkbenchChromeButton
			icon={PlusIcon}
			label="Start a new conversation"
			onClick={() => void newRoom()}
			disabled={isInitializing || isSending || isStopping}
			data-testid="model-chat-panel--new-conversation-btn"
		/>
	);
};
