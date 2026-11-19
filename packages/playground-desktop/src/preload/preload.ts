import { contextBridge, type IpcRendererEvent, ipcRenderer } from "electron";
import {
	COMMAND_CHANNEL,
	type DesktopBridge,
	type DesktopCommand,
	IPC_CHANNELS,
	type IpcChannel,
	isToolFrameOrigin,
	TOOL_FRAME_ORIGIN_ARG,
} from "../contract/ipc-contract";

/** The channels the page may call; anything else is refused before it reaches main. */
const allowedChannels = new Set<string>(IPC_CHANNELS);

/**
 * The tool frame origin main gave the window. Anything but
 * `http://tools.localhost:<port>` is dropped, so the chat shows its form
 * rather than framing a tool where it could share this page's process.
 */
const givenToolFrameOrigin = process.argv
	.find((arg) => arg.startsWith(TOOL_FRAME_ORIGIN_ARG))
	?.slice(TOOL_FRAME_ORIGIN_ARG.length);
const toolFrameOrigin =
	givenToolFrameOrigin && isToolFrameOrigin(givenToolFrameOrigin)
		? givenToolFrameOrigin
		: undefined;

/**
 * The bridge the page sees as `window.semossDesktop`, the only way from a
 * page to the main process (AGENTS.md, Trust boundaries). The preload runs in
 * the app window's top frame only and holds no logic: an allowlisted invoke,
 * the menu's commands, and the tool frame origin. Main checks every call's
 * sender again, so the allowlist here is only a first gate. Frozen, so the
 * page cannot swap a function after the fact.
 */
const bridge: DesktopBridge = Object.freeze<DesktopBridge>({
	invoke: (channel: IpcChannel, ...args: unknown[]) => {
		if (!allowedChannels.has(channel)) {
			return Promise.reject(new Error(`Unknown IPC channel: ${channel}`));
		}
		return ipcRenderer.invoke(channel, ...args);
	},
	onCommand: (listener) => {
		const handleCommand = (
			_event: IpcRendererEvent,
			command: DesktopCommand,
		) => listener(command);
		ipcRenderer.on(COMMAND_CHANNEL, handleCommand);
		return () => {
			ipcRenderer.off(COMMAND_CHANNEL, handleCommand);
		};
	},
	toolFrameOrigin,
});

contextBridge.exposeInMainWorld("semossDesktop", bridge);
