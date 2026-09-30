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
import { useRoot } from "@/hooks";
import { SettingsRow } from "./settings-row";

type ThemeMode = ReturnType<typeof useTheme>["theme"];

/** The theme choices, in display order. */
const THEME_OPTIONS: readonly { value: ThemeMode; icon: LucideIcon }[] = [
	{ value: "system", icon: MonitorIcon },
	{ value: "light", icon: SunIcon },
	{ value: "dark", icon: MoonIcon },
];

const isThemeMode = (value: string): value is ThemeMode =>
	THEME_OPTIONS.some((option) => option.value === value);

/**
 * The General page of the settings dialog: the color theme, when the
 * deployment turns dark mode on, and the language the app is shown in.
 */
export const GeneralSettings = () => {
	const { t, i18n } = useTranslation("sidebar");
	const { theme, setTheme } = useTheme();
	const { root } = useRoot();
	const headingId = useId();
	const themeLabelId = useId();
	const languageId = useId();

	const selectedLanguage =
		LANGUAGES.find((lang) => lang.code === i18n.language)?.code ?? "";

	return (
		<section aria-labelledby={headingId} className="flex flex-col">
			<h3 id={headingId} className="font-semibold text-base">
				{t("settings.general.appearance")}
			</h3>
			{root.theme.featureFlags?.enableDarkMode ? (
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
						value={theme}
						// radix clears a single group to "" when the active item is
						// clicked again; a theme is always chosen
						onValueChange={(value) => {
							if (isThemeMode(value)) {
								setTheme(value);
							}
						}}
					>
						{THEME_OPTIONS.map(({ value, icon: Icon }) => (
							<ToggleGroupItem
								key={value}
								value={value}
								aria-label={t(
									`settings.general.themes.${value}`,
								)}
								title={t(`settings.general.themes.${value}`)}
							>
								<Icon aria-hidden />
							</ToggleGroupItem>
						))}
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
					<SelectTrigger id={languageId} size="sm" className="w-40">
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
	);
};
