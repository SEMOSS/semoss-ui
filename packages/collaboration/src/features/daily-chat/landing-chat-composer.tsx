import { useLocation } from "react-router";
import type { ComposerPrompt } from "@/features/rooms/components/room-composer.types";
import { NewChatWorkbenchProvider } from "./new-chat-workbench-provider";
import { NewChatWorkspace } from "./new-chat-workspace";
import { useNewChatController } from "./use-new-chat-controller";

interface LandingChatComposerProps {
	/** Link the first conversation to this topic before its agent runs. */
	topicId?: string;
	/** Link the first conversation to this work item. */
	taskId?: string;
	/** Today's ask box: lifted off the hero photo, with wording for the whole workspace. */
	isHero?: boolean;
	/**
	 * The page is one agent's own, such as a Digital Twin's chat page, so the
	 * agent the address names cannot be changed here. The model still can.
	 */
	isAgentLocked?: boolean;
	/** Suggested first messages the user can edit before sending. */
	starterPrompts?: readonly ComposerPrompt[];
}

/** Start a conversation in place without opening a room yet. */
export function LandingChatComposer({
	topicId,
	taskId,
	isHero,
	isAgentLocked,
	starterPrompts,
}: LandingChatComposerProps) {
	const location = useLocation();
	const controller = useNewChatController(location.state, topicId, taskId);
	// what the Chat button of a person's own Digital Twin opens Today with (FOCUS_ASK_BOX)
	const state: unknown = location.state;
	const isFocused =
		typeof state === "object" &&
		state !== null &&
		"focusAskBox" in state &&
		state.focusAskBox === true;
	return (
		<NewChatWorkbenchProvider
			key={controller.draftId}
			session={controller.session}
			snapshot={controller.snapshot}
			onSaveSettings={controller.onSaveSettings}
			isAgentLocked={isAgentLocked}
		>
			<NewChatWorkspace
				{...controller}
				isHero={isHero}
				isAgentLocked={isAgentLocked}
				isFocused={isFocused}
				starterPrompts={starterPrompts}
			/>
		</NewChatWorkbenchProvider>
	);
}
