import { BlocksIcon, SettingsIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { ConnectorsSettings } from "../connectors/settings/connectors-settings";
import {
	COLOR_MODES,
	type ColorMode,
	GeneralSettings,
} from "./general-settings";
import { SettingsVersionFooter } from "./settings-version-footer";
import type { UserSettingsSection } from "./user-settings-dialog";

/** What a host chooses about the chat's settings sections. */
interface DefaultUserSettingsSectionsOptions {
	/**
	 * The color modes General offers; with fewer than two, it offers no choice.
	 * Default: system, light, and dark.
	 */
	colorModes?: readonly ColorMode[];
}

/**
 * The chat's own sections of the user's settings dialog, in navigation order:
 * General, with the instance's version as its footer, then Connectors. A
 * host hands them to `UserSettingsDialog` with its own sections around them.
 *
 * @param options - What the host chooses about the sections.
 * @returns The sections, the same list while the language and color modes are unchanged.
 */
export const useDefaultUserSettingsSections = ({
	colorModes = COLOR_MODES,
}: DefaultUserSettingsSectionsOptions = {}): UserSettingsSection[] => {
	const { t } = useTranslation("sidebar");
	return useMemo(
		() => [
			{
				id: "general",
				label: t("settings.sections.general"),
				icon: SettingsIcon,
				content: <GeneralSettings colorModes={colorModes} />,
				footer: <SettingsVersionFooter />,
			},
			{
				id: "connectors",
				label: t("settings.sections.connectors"),
				icon: BlocksIcon,
				content: <ConnectorsSettings />,
			},
		],
		[t, colorModes],
	);
};
