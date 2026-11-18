import { contextBridge, type IpcRendererEvent, ipcRenderer } from "electron";
import {
	COMMAND_CHANNEL,
	type DesktopBridge,
	type DesktopCommand,
	IPC_CHANNELS,
	type IpcChannel,
	TOOL_FRAME_ORIGIN_ARG,
} from "../contract/ipc-contract";

/** The channels the page may call; anything else is refused before it reaches main. */
const allowedChannels = new Set<string>(IPC_CHANNELS);

/** The tool frame origin main gave the window, or empty when it gave none. */
const toolFrameOrigin =
	process.argv
		.find((arg) => arg.startsWith(TOOL_FRAME_ORIGIN_ARG))
		?.slice(TOOL_FRAME_ORIGIN_ARG.length) ?? "";

/**
 * The bridge the page sees as `window.semossDesktop`. The preload holds no
 * logic: an allowlisted invoke, the menu's commands, and the tool frame origin.
 */
const bridge: DesktopBridge = {
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
};

contextBridge.exposeInMainWorld("semossDesktop", bridge);
