import { useLocation } from "react-router";
import { NewChatWorkbenchProvider } from "./new-chat-workbench-provider";
import { NewChatWorkspace } from "./new-chat-workspace";
import { useNewChatController } from "./use-new-chat-controller";

/** Start an ordinary conversation from the global overview without opening a room yet. */
export function LandingChatComposer() {
	const location = useLocation();
	const controller = useNewChatController(location.state);
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
