import { useLocation } from "react-router";
import { NewChatWorkbenchProvider } from "./new-chat-workbench-provider";
import { NewChatWorkspace } from "./new-chat-workspace";
import { useNewChatController } from "./use-new-chat-controller";

interface LandingChatComposerProps {
	/** Link the first conversation to this topic before its assistant runs. */
	topicId?: string;
	/** Link the first conversation to this work item. */
	taskId?: string;
}

/** Start a conversation in place without opening a room yet. */
export function LandingChatComposer({
	topicId,
	taskId,
}: LandingChatComposerProps) {
	const location = useLocation();
	const controller = useNewChatController(location.state, topicId, taskId);
	return (
		<NewChatWorkbenchProvider
			key={controller.draftId}
			session={controller.session}
			snapshot={controller.snapshot}
			onSaveSettings={controller.onSaveSettings}
		>
			<NewChatWorkspace {...controller} />
		</NewChatWorkbenchProvider>
	);
}
