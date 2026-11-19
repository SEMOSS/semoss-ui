import type { WebContents } from "electron";
import { originOf } from "./zones";

/**
 * Boundary: tool frames → the app page's renderer process.
 * Enforces: a tool view never runs in the process that holds the bridge.
 * Tool views are framed from another site (`tools.localhost`), which
 * Chromium's site isolation always puts in another process; this checks it
 * on every tool frame that loads, and fails closed. It detects and contains:
 * the check runs once a frame has loaded, so on a breach the tool frame
 * origin is switched off for the rest of the run and the window reloads once.
 * Exceptions: none.
 */

/** One frame that loaded, as the check reads it. */
export interface LoadedFrame {
	/** The frame's URL. */
	readonly url: string;
	/** Whether it is its window's top frame. */
	readonly isMainFrame: boolean;
	/** The renderer process it runs in. */
	readonly processId: number;
}

/**
 * Whether a loaded frame is a tool view in the app page's own process.
 *
 * @param frame - The frame that loaded.
 * @param appProcessId - The app page's renderer process.
 * @param toolFrameOrigin - The tool frame origin.
 * @returns True for a tool frame that shares the app page's process.
 */
export const sharesAppProcess = (
	{ url, isMainFrame, processId }: LoadedFrame,
	appProcessId: number,
	toolFrameOrigin: string,
): boolean =>
	!isMainFrame &&
	originOf(url) === toolFrameOrigin &&
	processId === appProcessId;

/**
 * Watch a window's tool frames, and call `onBreach` for one in the app page's
 * process.
 *
 * @param contents - The app's window's contents.
 * @param toolFrameOrigin - The tool frame origin.
 * @param onBreach - What to do: switch tool views off and reload.
 */
export const guardToolFrameIsolation = (
	contents: WebContents,
	toolFrameOrigin: string,
	onBreach: (frame: LoadedFrame) => void,
): void => {
	contents.on(
		"did-frame-navigate",
		(_event, url, _code, _status, isMainFrame, processId) => {
			const frame = { url, isMainFrame, processId };
			if (
				sharesAppProcess(
					frame,
					contents.mainFrame.processId,
					toolFrameOrigin,
				)
			) {
				onBreach(frame);
			}
		},
	);
};
