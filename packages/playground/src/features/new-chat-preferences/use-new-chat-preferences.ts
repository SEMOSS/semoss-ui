import { useTranslation } from "@semoss/i18n";
import { Session, useSession } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	NEW_CHAT_PREFERENCE_KEYS,
	type NewChatMode,
	type NewChatPreferences,
	readNewChatPreferences,
} from "./new-chat-preferences";

/** What {@link useNewChatPreferences} returns. */
interface NewChatPreferencesState extends NewChatPreferences {
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
export const useNewChatPreferences = (): NewChatPreferencesState => {
	const { t } = useTranslation("sidebar");
	const meta = useSession((state) => state.user?.meta);
	const preferences = readNewChatPreferences(meta);

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
			save({ [NEW_CHAT_PREFERENCE_KEYS.model]: modelId ?? "" }),
		setMode: (mode) =>
			save({
				[NEW_CHAT_PREFERENCE_KEYS.mode]: mode,
				...(mode === "chat"
					? { [NEW_CHAT_PREFERENCE_KEYS.agent]: "" }
					: {}),
			}),
		setAgentId: (agentId) =>
			save({ [NEW_CHAT_PREFERENCE_KEYS.agent]: agentId ?? "" }),
	};
};
