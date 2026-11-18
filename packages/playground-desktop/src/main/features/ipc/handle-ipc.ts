import { type IpcMainInvokeEvent, ipcMain, type WebFrameMain } from "electron";
import type { IpcChannel, IpcContract } from "../../../contract/ipc-contract";
import { isAppPage } from "../app-window/window-security";

/**
 * Whether an IPC call comes from the app's own page: a top frame on the app's
 * page. A frame from anywhere else, such as a sign in window, a tool view, or
 * a server page on the app's origin, is refused.
 *
 * @param frame - The calling frame, or null once it is gone.
 * @param appOrigin - The app's origin.
 * @returns True for the app's own page.
 */
export const isTrustedSender = (
	frame: Pick<WebFrameMain, "url" | "parent"> | null | undefined,
	appOrigin: string,
): boolean =>
	!!frame && frame.parent === null && isAppPage(frame.url, appOrigin);

/** What a handler returns: its channel's response, or nothing for a call that answers none. */
type Reply<C extends IpcChannel> = IpcContract[C]["response"] extends undefined
	? // biome-ignore lint/suspicious/noConfusingVoidType: an async handler that returns nothing resolves to void
		void
	: IpcContract[C]["response"];

/**
 * Register one IPC handler. Arguments arrive as `unknown` because types do not
 * cross the process boundary; the handler validates them.
 *
 * @param channel - The channel.
 * @param appOrigin - The only origin allowed to call it.
 * @param handler - What the call does.
 */
export const handleIpc = <C extends IpcChannel>(
	channel: C,
	appOrigin: string,
	handler: (...args: unknown[]) => Reply<C> | Promise<Reply<C>>,
): void => {
	ipcMain.handle(channel, (event: IpcMainInvokeEvent, ...args: unknown[]) => {
		if (!isTrustedSender(event.senderFrame, appOrigin)) {
			throw new Error(`Refused ${channel} from an untrusted frame`);
		}
		return handler(...args);
	});
};
