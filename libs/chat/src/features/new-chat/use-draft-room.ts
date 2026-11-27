import { useEffect, useRef, useState } from "react";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import type { ResolvedChatOptions } from "../chat/config/chat-options";
import { RoomStore } from "../room/store/room.store";
import type { RoomOptions } from "../room/store/room-snapshot";

/** The options a draft takes from the host's new-chat defaults. */
type DraftDefaults = Pick<RoomOptions, "mcp" | "temperature">;

/**
 * Read what a draft starts with from the host's options.
 *
 * @param options - The host's chat options.
 * @returns The draft's starting tools and temperature.
 */
const readDraftDefaults = (options: ResolvedChatOptions): DraftDefaults => ({
	mcp: [...(options.newChat.tools ?? [])],
	temperature: options.isTemperatureEditable
		? (options.newChat.temperature ?? 0)
		: undefined,
});

/** A draft room and what it was made with. */
interface MadeDraft {
	readonly room: RoomStore;
	readonly panels: Record<string, WorkbenchPanelConfigAny>;
	/** The host's options when the draft's defaults were last written. */
	readonly options: ResolvedChatOptions;
	/** The defaults last written, to tell them from what the user picked. */
	readonly defaults: DraftDefaults;
}

/**
 * Make a draft room with the host's new-chat defaults.
 *
 * @param options - The host's chat options.
 * @param panels - The Workspace panels the chat's rooms are built with.
 * @returns The draft room and what it was made with.
 */
const makeDraft = (
	options: ResolvedChatOptions,
	panels: Record<string, WorkbenchPanelConfigAny>,
): MadeDraft => {
	const defaults = readDraftDefaults(options);
	const room = new RoomStore({
		chatOptions: options,
		roomId: "temp",
		workbenchPanels: panels,
		// no insight for Files to read until the draft prepares its room
		includeFiles: false,
	});
	room.setOptions({
		instructions: "",
		workspace: undefined,
		predefinedPrompts: [],
		...defaults,
	});
	return { room, panels, options, defaults };
};

/**
 * The new chat's draft room, which holds its options until its first message.
 * It lasts as long as the chat's Workspace panels: new host options reach the
 * same draft, so what the user picked survives a deployment's settings
 * arriving late, and new defaults replace only those the user left alone.
 *
 * @param options - The host's chat options.
 * @param panels - The Workspace panels the chat's rooms are built with.
 * @returns The draft room.
 */
export const useDraftRoom = (
	options: ResolvedChatOptions,
	panels: Record<string, WorkbenchPanelConfigAny>,
): RoomStore => {
	const [made, setMade] = useState(() => makeDraft(options, panels));
	let current = made;
	// new panels make a new draft while rendering, as React does for state
	// that follows a prop
	if (made.panels !== panels) {
		current = makeDraft(options, panels);
		setMade(current);
	}
	// the defaults last written, which the effect moves forward
	const written = useRef(current);
	const { room } = current;

	useEffect(() => {
		if (written.current.room !== room) written.current = current;
		const last = written.current;
		if (last.options === options) return;
		room.setChatOptions(options);
		const isNewDefault =
			options.newChat !== last.options.newChat ||
			options.isTemperatureEditable !==
				last.options.isTemperatureEditable;
		const { mcp, temperature } = room.options;
		const isUntouched =
			mcp === last.defaults.mcp &&
			temperature === last.defaults.temperature;
		const defaults =
			isNewDefault && isUntouched
				? readDraftDefaults(options)
				: last.defaults;
		if (defaults !== last.defaults) room.setOptions(defaults);
		written.current = { ...last, options, defaults };
	}, [room, options, current]);

	return room;
};
