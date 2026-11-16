import { useEffect, useState } from "react";
import type { ServerConfig } from "../../../contract/server-connection";
import { getDesktopBridge } from "../desktop-bridge/desktop-bridge";

/**
 * The server the app is saved to sign in to, read once from the main process.
 *
 * @returns The server; null when none is saved, and undefined while it loads.
 */
export const useSavedServer = (): ServerConfig | null | undefined => {
	const [server, setServer] = useState<ServerConfig | null | undefined>();

	useEffect(() => {
		// a read that lands after unmount is dropped
		let isCurrent = true;
		void getDesktopBridge()
			.invoke("server-connection:get")
			.then((saved) => {
				if (isCurrent) setServer(saved);
			});
		return () => {
			isCurrent = false;
		};
	}, []);

	return server;
};
