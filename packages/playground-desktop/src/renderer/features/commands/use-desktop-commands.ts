import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { DesktopBridge } from "../../../contract/ipc-contract";

/**
 * Route the app menu's commands into the app.
 *
 * @param bridge - The preload's bridge.
 */
export const useDesktopCommands = (bridge: DesktopBridge): void => {
	const navigate = useNavigate();

	useEffect(
		() =>
			bridge.onCommand((command) => {
				switch (command.type) {
					case "new-chat":
						navigate("/new");
						return;
					case "change-server":
						navigate("/server");
						return;
				}
			}),
		[bridge, navigate],
	);
};
