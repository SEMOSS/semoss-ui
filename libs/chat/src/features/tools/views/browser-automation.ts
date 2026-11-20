import { getBrowserAutomationScript } from "@semoss/sdk";
import type { RoomStore } from "../../room/store/room.store";

/** How long the browser extension has to answer a ping, in milliseconds. */
const PING_TIMEOUT_MS = 2000;

/**
 * Whether the browser extension's panel is open, by pinging it through the
 * window: it answers `SMSS_EXTENSION_PONG` from this page's origin. A
 * Playwright script can only run there.
 *
 * @param timeoutMs - How long to wait for the answer.
 * @returns Whether it answered in time.
 */
export const pingBrowserExtension = (
	timeoutMs: number = PING_TIMEOUT_MS,
): Promise<boolean> =>
	new Promise((resolve) => {
		/**
		 * Stop listening and settle the ping.
		 *
		 * @param isAvailable - Whether the extension answered.
		 */
		const finish = (isAvailable: boolean): void => {
			window.clearTimeout(timer);
			window.removeEventListener("message", handleMessage);
			resolve(isAvailable);
		};
		/**
		 * Settle on the extension's answer, ignoring every other message.
		 *
		 * @param event - A message posted to the window.
		 */
		const handleMessage = (event: MessageEvent): void => {
			if (
				event.origin === window.location.origin &&
				event.data?.type === "SMSS_EXTENSION_PONG"
			) {
				finish(true);
			}
		};
		window.addEventListener("message", handleMessage);
		const timer = window.setTimeout(() => finish(false), timeoutMs);
		window.postMessage(
			{ type: "SMSS_EXTENSION_PING", timestamp: Date.now() },
			"*",
		);
	});

/**
 * Hands a recorded Playwright script to the browser extension: reads the
 * whole script in the room's insight, then posts it to the window for the
 * extension to load (not run).
 *
 * @param room - The room whose insight reads the script.
 * @param project - The project the script was recorded in.
 * @param fileName - The recorded script's file.
 * @returns The call's output, saying the script was fetched.
 * @throws When the script cannot be read.
 */
export const sendPlaywrightScript = async (
	room: Pick<RoomStore, "runRoomRequest">,
	project: string,
	fileName: string,
): Promise<string> => {
	const scriptContent = await room.runRoomRequest(
		(insightId) =>
			getBrowserAutomationScript(insightId, {
				project: project,
				fileName: fileName,
			}),
		{ showLoading: false, setErrorOnFail: false },
	);
	window.postMessage(
		{
			type: "SMSS_EXEC_PLAYWRIGHT_SCRIPT",
			script: {
				projectId: project,
				name: fileName,
				autoExecute: false,
				scriptContent: scriptContent,
			},
		},
		"*",
	);
	return `Successfully fetched Playwright script: ${fileName}`;
};
