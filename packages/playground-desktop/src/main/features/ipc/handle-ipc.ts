import { type IpcMainInvokeEvent, ipcMain, type WebContents } from "electron";
import type { IpcChannel, IpcContract } from "../../../contract/ipc-contract";
import { isAppMainFrame } from "../trust-boundaries/ipc-sender";

/** Who may call: the app page, in the app's own window. */
export interface IpcCaller {
	/** The app's origin. */
	readonly appOrigin: string;
	/** The app's window's contents, or undefined while it is closed. */
	readonly getAppWebContents: () => WebContents | undefined;
}

/** What a handler returns: its channel's response, or nothing for a call that answers none. */
type Reply<C extends IpcChannel> = IpcContract[C]["response"] extends undefined
	? // biome-ignore lint/suspicious/noConfusingVoidType: an async handler that returns nothing resolves to void
		void
	: IpcContract[C]["response"];

/**
 * Register one IPC handler. A call from anywhere but the app page is refused
 * before the handler runs (`isAppMainFrame`). Arguments arrive as `unknown`
 * because types do not cross the process boundary; the handler validates them.
 *
 * @param channel - The channel.
 * @param caller - Who may call it.
 * @param handler - What the call does.
 */
export const handleIpc = <C extends IpcChannel>(
	channel: C,
	caller: IpcCaller,
	handler: (...args: unknown[]) => Reply<C> | Promise<Reply<C>>,
): void => {
	ipcMain.handle(channel, (event: IpcMainInvokeEvent, ...args: unknown[]) => {
		if (
			!isAppMainFrame(event, caller.getAppWebContents(), caller.appOrigin)
		) {
			throw new Error(`Refused ${channel} from an untrusted frame`);
		}
		return handler(...args);
	});
};
