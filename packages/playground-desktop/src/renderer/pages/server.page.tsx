import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getDesktopBridge } from "@/features/desktop-bridge/desktop-bridge";
import { ServerConnectView } from "@/features/server-connection/server-connect-view";
import type { ServerConfig } from "../../contract/server-connection";

/** Change the server the app signs in to. */
export const ServerPage = () => {
	const bridge = getDesktopBridge();
	const navigate = useNavigate();
	// undefined while loading; null when no server is saved
	const [current, setCurrent] = useState<ServerConfig | null | undefined>();

	useEffect(() => {
		let isCurrent = true;
		void bridge.invoke("server-connection:get").then((server) => {
			if (isCurrent) setCurrent(server);
		});
		return () => {
			isCurrent = false;
		};
	}, [bridge]);

	if (current === undefined) {
		return null;
	}
	return (
		<ServerConnectView
			bridge={bridge}
			current={current}
			onCancel={() => navigate(-1)}
		/>
	);
};
