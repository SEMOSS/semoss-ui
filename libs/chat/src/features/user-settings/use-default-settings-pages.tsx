import { BlocksIcon, SettingsIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { ConnectorsSettings } from "../connectors/settings/connectors-settings";
import { GeneralSettings } from "./general-settings";
import { SettingsVersionFooter } from "./settings-version-footer";
import type { UserSettingsSection } from "./user-settings-section";

/**
 * The chat's own pages of the user's settings dialog, in navigation order:
 * General, with the instance's version as its footer, then Connectors. A
 * host hands them to `UserSettingsDialog` with its own pages around them.
 *
 * @returns The pages, the same list while the language is unchanged.
 */
export const useDefaultSettingsPages = (): UserSettingsSection[] => {
	const { t } = useTranslation("sidebar");
	return useMemo(
		() => [
			{
				id: "general",
				label: t("settings.sections.general"),
				icon: SettingsIcon,
				content: <GeneralSettings />,
				footer: <SettingsVersionFooter />,
			},
			{
				id: "connectors",
				label: t("settings.sections.connectors"),
				icon: BlocksIcon,
				content: <ConnectorsSettings />,
			},
		],
		[t],
	);
};
