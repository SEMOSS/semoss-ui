import { PlusIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useModelChat } from "@/hooks";
import type { WorkbenchChromeProps } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";

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
export const ModelChatNewConversationControl: FC<WorkbenchChromeProps> = () => {
	const isInitializing = useModelChat((state) => state.isInitializing);
	const isSending = useModelChat((state) => state.isSending);
	const isStopping = useModelChat((state) => state.isStopping);
	const newRoom = useModelChat((state) => state.newRoom);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => void newRoom()}
					disabled={isInitializing || isSending || isStopping}
					aria-label="Start a new conversation"
					data-testid="model-chat-panel--new-conversation-btn"
					className={cn(
						"flex-none text-muted-foreground",
						WORKBENCH_STYLES.chromeButton,
					)}
				>
					<PlusIcon className={WORKBENCH_STYLES.chromeIcon} />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Start a new conversation</TooltipContent>
		</Tooltip>
	);
};
