import { useCallback, useEffect, useState } from "react";
import type { SavedServers } from "../../../contract/ipc-contract";
import { getDesktopBridge } from "../desktop-bridge/desktop-bridge";

/** The saved servers, and a way to read them again. */
export interface UseSavedServersReturn {
	/** Every saved server and the one in use; undefined while it loads. */
	saved: SavedServers | undefined;
	/** Read the list again, such as after a server is forgotten. */
	refresh: () => Promise<void>;
}

/**
 * The servers the app keeps a sign in for, read from the main process.
 *
 * @returns The list and its refresh.
 */
export const useSavedServers = (): UseSavedServersReturn => {
	const [saved, setSaved] = useState<SavedServers | undefined>();

	const refresh = useCallback(async (): Promise<void> => {
		setSaved(await getDesktopBridge().invoke("server-connection:list"));
	}, []);

	useEffect(() => {
		// a read that lands after unmount is dropped
		let isCurrent = true;
		void getDesktopBridge()
			.invoke("server-connection:list")
			.then((list) => {
				if (isCurrent) setSaved(list);
			});
		return () => {
			isCurrent = false;
		};
	}, []);

	return { saved, refresh };
};
