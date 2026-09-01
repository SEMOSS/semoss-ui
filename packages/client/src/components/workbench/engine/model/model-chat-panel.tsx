import { MessageSquareIcon } from "lucide-react";
import { Alert, AlertDescription, cn } from "@semoss/ui/next";
import { useModelChat, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";
import { ModelChatComposer } from "./model-chat-composer";
import { ModelChatMessages } from "./model-chat-messages";
import { ModelChatNewConversationControl } from "./model-chat-new-conversation-control";

/**
 * The model chat panel: a persistent, streaming conversation with this
 * workbench's model engine, backed by a room so history survives a reload.
 *
 * Model settings and conversation history are their own border panels on the
 * right, and starting a new conversation is a chrome control, so this is the
 * room title, the transcript, and the composer.
 *
 * @name ModelChatPanel
 * @return The chat panel.
 */
const ModelChatPanel: WorkbenchComponent = ({ id }) => {
	const roomName = useModelChat((state) => state.roomName);
	const initError = useModelChat((state) => state.initError);

	useWorkbenchControl(id, ModelChatNewConversationControl);

	return (
		<div
			className="flex h-full min-h-0 w-full flex-col bg-background"
			data-testid="model-chat-panel"
		>
			<header
				className={cn(
					"flex shrink-0 items-center gap-2 border-border border-b px-3",
					WORKBENCH_STYLES.borderHeader,
				)}
			>
				<h2 className="min-w-0 flex-1 truncate font-medium text-sm">
					{roomName || "New conversation"}
				</h2>
			</header>

			{initError ? (
				<Alert
					variant="destructive"
					className="m-3 mb-0 w-auto shrink-0"
				>
					<AlertDescription>
						<span className="wrap-break-word">{initError}</span>
					</AlertDescription>
				</Alert>
			) : null}

			<ModelChatMessages />
			<ModelChatComposer />
		</div>
	);
};

/**
 * Blueprint for the model chat panel. keepAlive: the draft and scroll position
 * are local state a user would miss after a tab switch.
 *
 * @name MODEL_CHAT_PANEL
 */
export const MODEL_CHAT_PANEL: WorkbenchPanelConfig = {
	name: "Chat",
	helpText: "Chat with this model",
	icon: ({ className }) => <MessageSquareIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: ModelChatPanel,
};
