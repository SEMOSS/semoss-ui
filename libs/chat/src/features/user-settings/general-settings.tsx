import { type LucideIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useId } from "react";
import { LANGUAGES, useTranslation } from "@semoss/i18n";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ToggleGroup,
	ToggleGroupItem,
	useTheme,
} from "@semoss/ui/next";
import { NewChatSettings } from "./new-chat-settings";
import { SettingsRow } from "./settings-row";

/** A color mode the user can pick. */
export type ColorMode = "system" | "light" | "dark";

/** Every color mode, in the order the choice lists them. */
export const COLOR_MODES: readonly ColorMode[] = ["system", "light", "dark"];

/** The icon of each color mode. */
const COLOR_MODE_ICONS: Readonly<Record<ColorMode, LucideIcon>> = {
	system: MonitorIcon,
	light: SunIcon,
	dark: MoonIcon,
};

/**
 * Whether a toggle value is one of the color modes offered.
 *
 * @param value - The toggle group's value; "" when the active item is clicked again.
 * @param offered - The color modes the host offers.
 * @returns Whether it is one of them.
 */
const isOfferedColorMode = (
	value: string,
	offered: readonly ColorMode[],
): value is ColorMode => offered.some((mode) => mode === value);

/** Props for {@link GeneralSettings}. */
interface GeneralSettingsProps {
	/** The color modes the user picks from; with fewer than two, no choice shows. */
	colorModes: readonly ColorMode[];
}

/**
 * The General page of the settings dialog: the color theme, where the host
 * offers a choice of color modes, the language the app is shown in, and what
 * a new chat starts with.
 */
export const GeneralSettings = ({ colorModes }: GeneralSettingsProps) => {
	const { t, i18n } = useTranslation("sidebar");
	const { theme: colorMode, setTheme } = useTheme();
	const headingId = useId();
	const themeLabelId = useId();
	const languageId = useId();

	const selectedLanguage =
		LANGUAGES.find((lang) => lang.code === i18n.language)?.code ?? "";

	return (
		<>
			<section aria-labelledby={headingId} className="flex flex-col">
				<h3 id={headingId} className="font-semibold text-base">
					{t("settings.general.appearance")}
				</h3>
				{colorModes.length > 1 ? (
					<SettingsRow
						label={t("settings.general.theme")}
						labelId={themeLabelId}
						description={t("settings.general.themeDescription")}
					>
						<ToggleGroup
							type="single"
							variant="outline"
							size="sm"
							aria-labelledby={themeLabelId}
							value={colorMode}
							// radix clears a single group to "" when the active item is
							// clicked again; a theme is always chosen
							onValueChange={(value) => {
								if (isOfferedColorMode(value, colorModes)) {
									setTheme(value);
								}
							}}
						>
							{colorModes.map((value) => {
								const Icon = COLOR_MODE_ICONS[value];
								return (
									<ToggleGroupItem
										key={value}
										value={value}
										aria-label={t(
											`settings.general.themes.${value}`,
										)}
										title={t(
											`settings.general.themes.${value}`,
										)}
									>
										<Icon aria-hidden />
									</ToggleGroupItem>
								);
							})}
						</ToggleGroup>
					</SettingsRow>
				) : null}
				<SettingsRow
					label={t("settings.general.language")}
					controlId={languageId}
					description={t("settings.general.languageDescription")}
				>
					<Select
						value={selectedLanguage}
						onValueChange={(code) => void i18n.changeLanguage(code)}
					>
						<SelectTrigger
							id={languageId}
							size="sm"
							className="w-40"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LANGUAGES.map((lang) => (
								<SelectItem key={lang.code} value={lang.code}>
									{lang.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SettingsRow>
			</section>
			<NewChatSettings />
		</>
	);
};
