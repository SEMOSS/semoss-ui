import { useEffect, useState } from "react";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { DEFAULT_WORKBENCH_PANELS } from "../../workbench/panels/default-workbench-panels";
import type { ChatConfig } from "../config/chat-config.context";
import { resolveChatOptions } from "../config/chat-options";
import { ChatStore } from "./chat.store";

/** The part of the host's {@link ChatConfig} the chat store is made from. */
export type ChatStoreConfig = Pick<
	ChatConfig,
	"options" | "tools" | "workbenchPanels"
>;

/** A chat store and what it was made with. */
interface MadeChatStore {
	readonly store: ChatStore;
	readonly tools: ChatConfig["tools"];
	readonly panels: Record<string, WorkbenchPanelConfigAny>;
}

/**
 * Create the session's chat store from the host's config, with the chat's
 * Workspace panels unless the host names its own, and start reading its
 * models and rooms. A new tools host or new Workspace panels make a new store
 * and drop the old one's rooms; new options are handed to the same store, so
 * its rooms and models survive a deployment's settings arriving late.
 *
 * @param config - The host's chat config.
 * @returns The chat store, the same one while the tools and panels are unchanged.
 */
export const useCreateChatStore = ({
	options,
	tools,
	workbenchPanels,
}: ChatStoreConfig): ChatStore => {
	const panels = workbenchPanels ?? DEFAULT_WORKBENCH_PANELS;
	const resolved = resolveChatOptions(options);
	const make = (): MadeChatStore => ({
		store: new ChatStore({
			options: resolved,
			workbenchPanels: panels,
			tools,
		}),
		tools,
		panels,
	});
	const [made, setMade] = useState(make);
	let { store } = made;
	// a new tools host or new panels replace the store while rendering, as
	// React does for state that follows a prop
	if (made.tools !== tools || made.panels !== panels) {
		const next = make();
		setMade(next);
		store = next.store;
	}

	useEffect(() => {
		void store.initialize();
		return () => store.dispose();
	}, [store]);

	useEffect(() => {
		store.setOptions(resolved);
	}, [store, resolved]);

	return store;
};
