import { useChatConfig } from "@semoss/chat";
import type { DesktopToolsHost } from "./desktop-tools-host";

/**
 * Read the desktop's tools host from the chat's config.
 *
 * @returns The host, with each room's attached folders.
 * @throws When the chat's config has no desktop tools host.
 */
export const useDesktopTools = (): DesktopToolsHost => {
	const { tools } = useChatConfig();
	if (!tools || !("foldersFor" in tools)) {
		throw new Error("useDesktopTools needs the desktop's tools host");
	}
	return tools as DesktopToolsHost;
};
