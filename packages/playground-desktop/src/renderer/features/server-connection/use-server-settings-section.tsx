import { ServerIcon } from "lucide-react";
import { useMemo } from "react";
import type { UserSettingsSection } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { ServerSettingsSection } from "./server-settings-section";

/**
 * The desktop app's own page of the settings dialog: Server, after the
 * chat's pages.
 *
 * @returns The page, the same object while the language is unchanged.
 */
export const useServerSettingsSection = (): UserSettingsSection => {
	const { t } = useTranslation("desktop");
	const label = t("connect.titleSaved");
	return useMemo(
		() => ({
			id: "server",
			label,
			icon: ServerIcon,
			content: <ServerSettingsSection />,
		}),
		[label],
	);
};
