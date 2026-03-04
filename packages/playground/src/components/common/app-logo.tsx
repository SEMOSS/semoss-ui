import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
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

	return (
		<div
			className={`flex h-full w-full select-none flex-row items-center gap-2 overflow-hidden transition-all duration-200 ease-in-out ${full ? "" : "justify-center"}`}
		>
			{full ? (
				<img
					alt={t("images.logoAlt")}
					src={root.theme.images.app || appImage}
				/>
			) : (
				<img
					alt={t("images.logoAlt")}
					src={root.theme.images.logo || logoImage}
				/>
			)}
		</div>
	);
});
