import type { RoomIntegrationSlotProps } from "../../host/room-integration";
import { requireRoomConnectors } from "../room-connectors";
import { useUserConnectorsSync } from "../use-user-connectors-sync";
import { ConnectorSignInNotice } from "./connector-sign-in-notice";

/**
 * Above a room's composer: connectors switched on or off in settings reach
 * the chat at once, and a notice says when some of them cannot run.
 *
 * @component
 */
export const ConnectorsComposerNotice = ({
	room,
}: RoomIntegrationSlotProps) => {
	const connectors = requireRoomConnectors(room);
	useUserConnectorsSync(connectors);
	return <ConnectorSignInNotice connectors={connectors} />;
};
