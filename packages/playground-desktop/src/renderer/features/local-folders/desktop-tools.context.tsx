import { createContext, useContext } from "react";
import type { DesktopToolsHost } from "./desktop-tools-host";

/** The window's tools host, which the app layout makes and hands the chat too. */
export const DesktopToolsContext = createContext<DesktopToolsHost | null>(null);

/**
 * Read the window's tools host, with each room's attached folders.
 *
 * @returns The tools host.
 * @throws When no `DesktopToolsContext` provider is above.
 */
export const useDesktopTools = (): DesktopToolsHost => {
	const tools = useContext(DesktopToolsContext);
	if (!tools) {
		throw new Error("useDesktopTools needs a DesktopToolsContext provider");
	}
	return tools;
};
