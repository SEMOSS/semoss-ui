import { useTranslation } from "@semoss/i18n";
import { cn, useTheme } from "@semoss/ui/next";
import appImage from "@/assets/img/app.svg";
import logoImage from "@/assets/img/logo.svg";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

interface AppLogoProps {
	/**
	 * Show the full logo
	 */
	full: boolean;
}

/** Renders the configured branding with a theme-aware default logo. */
export const AppLogo: React.FC<AppLogoProps> = ({ full = false }) => {
	const { t } = useTranslation("common");
	const theme = usePlaygroundTheme();
	const { resolvedTheme } = useTheme();
	const isDarkMode = resolvedTheme === "dark";

	const customLightSrc = full ? theme.images.app : theme.images.logo;
	const lightSrc = customLightSrc || (full ? appImage : logoImage);
	const darkSrc = full ? theme.images.appDark : theme.images.logoDark;
	const src = isDarkMode && darkSrc ? darkSrc : lightSrc;
	// The bundled artwork is monochrome; keep custom brand colors intact.
	const shouldInvert = isDarkMode && !darkSrc && !customLightSrc;

	return (
		<div
			className={cn(
				"flex h-full w-full select-none flex-row items-center gap-2 overflow-hidden transition-all duration-200 ease-in-out",
				!full && "justify-center",
			)}
		>
			<img
				alt={t("images.logoAlt")}
				src={src}
				className={cn(shouldInvert && "invert")}
			/>
		</div>
	);
};
