import { MonitorIcon } from "lucide-react";
import type { RoomIntegrationFactory } from "@semoss/chat";
import { getI18n } from "@semoss/i18n";
import { isDesktopToolName } from "./desktop-tool.provider";

/**
 * How the chat shows the desktop tools' calls: the chat tool card, marked as
 * running on this computer, rather than the generic tool view, which cannot
 * read a client tool's schema.
 *
 * @returns The integration's factory.
 */
export const createDesktopToolsIntegration =
	(): RoomIntegrationFactory => () => ({
		id: "desktop-tools",
		ownsToolCall: (call) => isDesktopToolName(call.name),
		describeToolCall: (call) =>
			isDesktopToolName(call.name)
				? {
						icon: <MonitorIcon aria-hidden className="size-4" />,
						source: getI18n().t("desktop:tools.source"),
						approvalNote: getI18n().t("desktop:tools.approval"),
					}
				: undefined,
	});
