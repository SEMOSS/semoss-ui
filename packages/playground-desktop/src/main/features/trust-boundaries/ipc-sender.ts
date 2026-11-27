import type { WebContents, WebFrameMain } from "electron";
import { isAppPage } from "./zones";

/**
 * Boundary: a page → the main process (every `IpcContract` channel).
 * Enforces: a call is answered only when it comes from the app page itself,
 * the top frame of the app's own window. A frame from anywhere else (a tool
 * view, a sign in popup, a server page, another window) is refused, even if
 * it is on the app's origin.
 * Exceptions: none.
 */

/** Where an IPC call came from, as Electron reports it. */
export interface IpcSender {
	/** The web contents that sent it. */
	readonly sender: Pick<WebContents, "mainFrame">;
	/** The frame that sent it, or null once it is gone. */
	readonly senderFrame: Pick<WebFrameMain, "url" | "parent"> | null;
}

/**
 * Whether an IPC call comes from the app page: the app's window, its top
 * frame, on the app's page.
 *
 * @param event - Where the call came from.
 * @param appWebContents - The app's window's contents, or undefined while it is closed.
 * @param appOrigin - The app's origin.
 * @returns True only for the app page.
 */
export const isAppMainFrame = (
	{ sender, senderFrame }: IpcSender,
	appWebContents: Pick<WebContents, "mainFrame"> | undefined,
	appOrigin: string,
): boolean =>
	!!appWebContents &&
	!!senderFrame &&
	sender === appWebContents &&
	senderFrame === appWebContents.mainFrame &&
	senderFrame.parent === null &&
	isAppPage(senderFrame.url, appOrigin);
