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
	const { resolvedTheme } = useTheme();
	const isDarkMode = resolvedTheme === "dark";

	const lightSrc = full
		? root.theme.images.app || appImage
		: root.theme.images.logo || logoImage;
	const darkSrc = full
		? root.theme.images.appDark
		: root.theme.images.logoDark;
	const src = isDarkMode && darkSrc ? darkSrc : lightSrc;
	const imgClass = isDarkMode && !darkSrc ? "brightness-0 invert" : "";

	return (
		<div
			className={`flex h-full w-full select-none flex-row items-center gap-2 overflow-hidden transition-all duration-200 ease-in-out ${full ? "" : "justify-center"}`}
		>
			<img alt={t("images.logoAlt")} src={src} className={imgClass} />
		</div>
	);
});
