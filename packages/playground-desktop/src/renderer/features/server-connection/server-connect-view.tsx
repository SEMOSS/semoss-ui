import { useTranslation } from "@semoss/i18n";
import { H1, Muted } from "@semoss/ui/next";
import type {
	DesktopBridge,
	SavedServers,
} from "../../../contract/ipc-contract";
import { ServerSettings } from "./server-settings";

/** Props for {@link ServerConnectView}. */
interface ServerConnectViewProps {
	/** The bridge that checks, saves, switches, and forgets servers. */
	bridge: DesktopBridge;
	/** The saved servers, listed above the form; none on first launch. */
	saved?: SavedServers;
	/** Read the saved servers again, after one is forgotten. */
	onServersChange?: () => Promise<void>;
	/** Leave without changing the server; none on first launch. */
	onCancel?: () => void;
}

/**
 * The server screen: pick the SEMOSS server the app signs in to, as a page of
 * its own. It is what shows before a server is saved, when signed out, and
 * when the server cannot be read; signed in, the same `ServerSettings` is the
 * settings dialog's Server page.
 */
export const ServerConnectView = ({
	bridge,
	saved,
	onServersChange,
	onCancel,
}: ServerConnectViewProps) => {
	const { t } = useTranslation("desktop");
	const hasSaved = saved !== undefined && saved.servers.length > 0;

	return (
		<main className="h-full overflow-y-auto bg-muted/30">
			<div className="flex min-h-full items-center justify-center p-6">
				<div className="flex w-full max-w-lg flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
					<div className="flex flex-col gap-1">
						<H1 className="text-2xl">
							{hasSaved
								? t("connect.titleSaved")
								: t("connect.title")}
						</H1>
						<Muted>
							{hasSaved
								? t("connect.descriptionSaved")
								: t("connect.description")}
						</Muted>
					</div>
					<ServerSettings
						bridge={bridge}
						saved={saved}
						onServersChange={onServersChange}
						onCancel={onCancel}
					/>
				</div>
			</div>
		</main>
	);
};
