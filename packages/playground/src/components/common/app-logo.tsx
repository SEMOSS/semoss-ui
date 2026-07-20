import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { useTheme } from "@semoss/ui/next";
import appImage from "@/assets/img/app.svg";
import logoImage from "@/assets/img/logo.svg";
import { useRoot } from "@/hooks";

interface AppLogoProps {
	/**
	 * Show the full logo
	 */
	full: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = observer(({ full = false }) => {
	const { t } = useTranslation("common");
	const { root } = useRoot();
	const { theme: colorMode } = useTheme();
	const isDark =
		colorMode === "dark" ||
		(colorMode === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);

	return (
		<div
			className={`flex h-full w-full select-none flex-row items-center gap-2 overflow-hidden transition-all duration-200 ease-in-out ${full ? "" : "justify-center"}`}
		>
			{full ? (
				<img
					alt={t("images.logoAlt")}
					src={
						(isDark && root.theme.images.appDark) ||
						root.theme.images.app ||
						appImage
					}
					className={
						root.theme.images.app
							? undefined
							: "dark:brightness-0 dark:invert"
					}
				/>
			) : (
				<img
					alt={t("images.logoAlt")}
					src={
						(isDark && root.theme.images.logoDark) ||
						root.theme.images.logo ||
						logoImage
					}
					className={
						root.theme.images.logo
							? undefined
							: "dark:brightness-0 dark:invert"
					}
				/>
			)}
		</div>
	);
});
