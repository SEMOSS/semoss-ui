import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { NewChatWorkbenchProvider } from "./new-chat-workbench-provider";
import { NewChatWorkspace } from "./new-chat-workspace";
import { useNewChatController } from "./use-new-chat-controller";

interface NewChatSessionProps {
	/** Optional retained draft identity, workbench destination, and editable prompt. */
	navigationState: unknown;
}

/** A separate chat page with the same draft and first-send lifecycle as the overview. */
export function NewChatSession({ navigationState }: NewChatSessionProps) {
	const controller = useNewChatController("new", navigationState);
	const { state } = useCollaborationSession();
	return (
		<NewChatWorkbenchProvider
			session={controller.session}
			snapshot={controller.snapshot}
			onSaveSettings={controller.onSaveSettings}
		>
			<NewChatWorkspace
				{...controller}
				userName={(state.liveProfile ?? state.profile).name}
			/>
		</NewChatWorkbenchProvider>
	);
}
