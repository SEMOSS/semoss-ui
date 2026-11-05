import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";

/**
 * The instance's version and when it was built, as `/api/config` reports
 * them, in a bar along the bottom of a settings page: stacked on narrow
 * screens, side by side from `sm` up. Renders nothing when the server reports
 * neither.
 */
export const SettingsVersionFooter = () => {
	const { t } = useTranslation("sidebar");
	const { system } = useInsight();

	const versionInfo = system?.config.version;
	const version =
		isRecord(versionInfo) && typeof versionInfo.version === "string"
			? versionInfo.version
			: "";
	const builtAt =
		isRecord(versionInfo) && typeof versionInfo.datetime === "string"
			? versionInfo.datetime
			: "";
	if (!version && !builtAt) {
		return null;
	}

	return (
		<footer className="flex shrink-0 flex-col gap-0.5 border-border border-t px-6 py-2 text-muted-foreground text-xs sm:h-10 sm:flex-row sm:items-center sm:gap-3 sm:py-0">
			{version ? (
				<span className="truncate">
					{t("settings.general.version", { version })}
				</span>
			) : null}
			{version && builtAt ? (
				<span
					aria-hidden
					className="hidden h-3 w-px shrink-0 bg-border sm:block"
				/>
			) : null}
			{builtAt ? <span className="truncate">{builtAt}</span> : null}
		</footer>
	);
};
