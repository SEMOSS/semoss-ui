import { getI18n } from "@semoss/i18n";
import { RoomsClient } from "@semoss/sdk";
import { toast } from "@semoss/ui/next";
import {
	RoomUiStore,
	type RoomUiStoreInit,
} from "../features/workbench/room-ui.store";
import {
	type ChatHostConfig,
	DEFAULT_CHAT_FEATURE_FLAGS,
} from "./chat-host-config";

/** The chat UI's rooms: the SDK's rooms client over its room UI stores. */
export type ChatRoomsClient = RoomsClient<RoomUiStore>;

/**
 * A host config with every feature switch it left out at its default.
 *
 * @param config - The host's config.
 * @returns The config the chat UI reads.
 */
export const resolveChatHostConfig = (
	config: ChatHostConfig,
): ChatHostConfig => ({
	...config,
	featureFlags: { ...DEFAULT_CHAT_FEATURE_FLAGS, ...config.featureFlags },
});

/**
 * The rooms client a host's chat runs: every room is a {@link RoomUiStore}
 * running the host's engine config, with its Workspace's panels and
 * integrations.
 *
 * @param config - The host's config, resolved.
 * @returns The rooms client; `initialize` it before listing rooms.
 */
export const createChatRoomsClient = (
	config: ChatHostConfig,
): ChatRoomsClient =>
	new RoomsClient<RoomUiStore>({
		engine: config.engine,
		enableModelSelect: Boolean(config.featureFlags.enableModelSelect),
		defaultModel: config.defaultModel,
		preferences: config.preferences,
		createRoomStore: (init) =>
			new RoomUiStore({
				...init,
				// the chat's options, with the shared toolbox types
				options: init.options as RoomUiStoreInit["options"],
				config: config.engine,
				host: config,
			}),
		onFirstMessageError: (_room, error) => {
			// a room whose files were in use is kept for a retry
			if (error.name === "UploadError") {
				toast.error(getI18n().t("room:errors.fileInUse"));
			}
		},
	});
