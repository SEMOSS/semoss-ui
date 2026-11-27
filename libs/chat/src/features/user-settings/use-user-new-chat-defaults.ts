import { useTranslation } from "@semoss/i18n";
import { Session, useSession } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	NEW_CHAT_DEFAULT_KEYS,
	type NewChatMode,
	readUserNewChatDefaults,
	type UserNewChatDefaults,
} from "../chat/config/new-chat-defaults";

/** What {@link useUserNewChatDefaults} returns. */
interface NewChatPreferencesState extends UserNewChatDefaults {
	/** Set the default model, or clear it with null for the deployment's. */
	setModelId: (modelId: string | null) => void;
	/** Set the default mode. Chat clears the default agent too. */
	setMode: (mode: NewChatMode) => void;
	/** Set the default saved agent, or clear it with null for the deployment's. */
	setAgentId: (agentId: string | null) => void;
}

/**
 * The signed in user's defaults for a new chat, and how to change them. Each
 * change shows at once and is saved to the user's metadata; a failed save goes
 * back and says so in a toast.
 *
 * @returns The defaults and their setters.
 */
export const useUserNewChatDefaults = (): NewChatPreferencesState => {
	const { t } = useTranslation("sidebar");
	const meta = useSession((state) => state.user?.meta);
	const preferences = readUserNewChatDefaults(meta);

	/** Save metadata changes, toasting a failure. */
	const save = (changes: Record<string, string>): void => {
		Session.setMetadata(changes).catch((error: unknown) => {
			toast.error(
				t("settings.general.newChat.saveError", {
					message: getErrorMessage(error, ""),
				}),
			);
		});
	};

	return {
		...preferences,
		setModelId: (modelId) =>
			save({ [NEW_CHAT_DEFAULT_KEYS.model]: modelId ?? "" }),
		setMode: (mode) =>
			save({
				[NEW_CHAT_DEFAULT_KEYS.mode]: mode,
				...(mode === "chat"
					? { [NEW_CHAT_DEFAULT_KEYS.agent]: "" }
					: {}),
			}),
		setAgentId: (agentId) =>
			save({ [NEW_CHAT_DEFAULT_KEYS.agent]: agentId ?? "" }),
	};
};
