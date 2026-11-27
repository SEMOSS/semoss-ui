import { useTranslation } from "@semoss/i18n";
import { Muted } from "@semoss/ui/next";
import { getDesktopBridge } from "@/features/desktop-bridge/desktop-bridge";
import { ServerSettings } from "./server-settings";
import { useSavedServers } from "./use-saved-servers";

/**
 * The Server page of the settings dialog: the saved servers and the form that
 * adds one. Switching or adding a server opens the window on it, which closes
 * this one.
 */
export const ServerSettingsSection = () => {
	const { t } = useTranslation("desktop");
	const { saved, refresh } = useSavedServers();

	if (saved === undefined) {
		return null;
	}
	return (
		<div className="flex flex-col gap-6">
			<Muted>{t("connect.descriptionSaved")}</Muted>
			<ServerSettings
				bridge={getDesktopBridge()}
				saved={saved}
				onServersChange={refresh}
				layout="section"
			/>
		</div>
	);
};
