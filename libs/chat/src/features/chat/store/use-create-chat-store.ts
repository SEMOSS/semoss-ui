import { useMemo } from "react";
import { DEFAULT_WORKBENCH_PANEL_COMPONENTS } from "../../workbench/panels/room-panel-components";
import type { ChatConfig } from "../config/chat-config.context";
import { ChatStore } from "./chat.store";

/** The part of the host's {@link ChatConfig} the chat store is made from. */
export type ChatStoreConfig = Pick<
	ChatConfig,
	"theme" | "newChatDefaults" | "localFolders" | "workbenchPanelComponents"
>;

/**
 * Create the session's chat store from the host's config, with the chat's
 * Workspace panels unless the host names its own, and start reading its models and rooms. Pass the same
 * `ChatConfig` the host gives `ChatConfigProvider`, so the store and chat UI
 * never disagree. A new theme, new-chat defaults or local folders host makes
 * a new store, as do new Workspace panel components; a change to the rest of
 * the config does not.
 *
 * @param config - The host's chat config.
 * @returns The chat store, the same one while those three are unchanged.
 */
export const useCreateChatStore = ({
	theme,
	newChatDefaults,
	localFolders,
	workbenchPanelComponents = DEFAULT_WORKBENCH_PANEL_COMPONENTS,
}: ChatStoreConfig): ChatStore =>
	useMemo(() => {
		const store = new ChatStore({
			theme,
			panelComponents: workbenchPanelComponents,
			newChatDefaults,
			localFolders,
		});
		store.initialize();
		return store;
	}, [theme, newChatDefaults, localFolders, workbenchPanelComponents]);
