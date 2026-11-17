import { BlocksIcon, SettingsIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { useChatCustomization } from "../chat/config/use-chat-customization";
import { ConnectorsSettings } from "../connectors/settings/connectors-settings";
import { GeneralSettings } from "./general-settings";
import { SettingsVersionFooter } from "./settings-version-footer";
import type { UserSettingsSection } from "./user-settings-section";

/**
 * The pages of the user's settings dialog, in navigation order: the chat's
 * own (General, with the instance's version as its footer, then Connectors)
 * as the host's `ChatConfig.customize.settingsSections` leaves them, so a
 * host adds its own pages or removes one.
 *
 * @returns The dialog's pages.
 */
export const useUserSettingsSections = (): UserSettingsSection[] => {
	const { t } = useTranslation("sidebar");
	const customize = useChatCustomization().settingsSections;
	const sections: UserSettingsSection[] = [
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
	];
	return customize ? customize(sections) : sections;
};
