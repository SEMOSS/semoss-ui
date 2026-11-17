import { useNavigate } from "react-router";
import { getDesktopBridge } from "@/features/desktop-bridge/desktop-bridge";
import { ServerConnectView } from "@/features/server-connection/server-connect-view";
import { useSavedServers } from "@/features/server-connection/use-saved-servers";

/** The saved servers: switch, remove, or add one; Cancel goes back where it came from. */
export const ServerPage = () => {
	const navigate = useNavigate();
	const { saved, refresh } = useSavedServers();

	if (saved === undefined) {
		return null;
	}
	return (
		<ServerConnectView
			bridge={getDesktopBridge()}
			saved={saved}
			onServersChange={refresh}
			// with nothing left there is nowhere to go back to
			onCancel={saved.active ? () => navigate(-1) : undefined}
		/>
	);
};
