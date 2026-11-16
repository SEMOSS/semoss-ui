import { useNavigate } from "react-router";
import { getDesktopBridge } from "@/features/desktop-bridge/desktop-bridge";
import { ServerConnectView } from "@/features/server-connection/server-connect-view";
import { useSavedServer } from "@/features/server-connection/use-saved-server";

/** Change the server the app signs in to; Cancel goes back where it came from. */
export const ServerPage = () => {
	const navigate = useNavigate();
	const current = useSavedServer();

	if (current === undefined) {
		return null;
	}
	return (
		<ServerConnectView
			bridge={getDesktopBridge()}
			current={current}
			onCancel={() => navigate(-1)}
		/>
	);
};
