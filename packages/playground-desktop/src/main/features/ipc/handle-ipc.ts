import { type IpcMainInvokeEvent, ipcMain } from "electron";
import type { IpcChannel, IpcContract } from "../../../contract/ipc-contract";

/**
 * Whether an IPC call comes from the app's own page. A frame from anywhere
 * else, such as a sign in window or an embedded tool view, is refused.
 *
 * @param senderUrl - The calling frame's URL.
 * @param appOrigin - The app's origin.
 * @returns True for the app's own page.
 */
export const isTrustedSender = (
	senderUrl: string | undefined,
	appOrigin: string,
): boolean => {
	if (!senderUrl) return false;
	try {
		return new URL(senderUrl).origin === appOrigin;
	} catch {
		return false;
	}
};

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
		if (!isTrustedSender(event.senderFrame?.url, appOrigin)) {
			throw new Error(`Refused ${channel} from an untrusted frame`);
		}
		return handler(...args);
	});
};
