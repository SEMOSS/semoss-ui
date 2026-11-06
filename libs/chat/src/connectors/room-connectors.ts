import type { RoomEngine } from "@semoss/sdk";
import { toRoomUiStore } from "../features/workbench/room-ui.store";
import type { RoomIntegration } from "../host/room-integration";
import type { ConnectorsStore } from "./connectors.store";

/** The connectors integration's id, as a room finds it. */
export const CONNECTORS_INTEGRATION_ID = "connectors";

/** A room's connectors integration, holding the room's connector state. */
export interface ConnectorsIntegration extends RoomIntegration {
	/** The connectors switched on for the room and the accounts they sign in with. */
	readonly store: ConnectorsStore;
}

/** The id of the settings page where the user switches connectors on. */
export const CONNECTORS_SETTINGS_PAGE_ID = "connectors";

/**
 * A room's connector state, when the host runs the connectors integration.
 *
 * @param room - The room.
 * @returns The room's connectors, or undefined without the integration.
 */
export const getRoomConnectors = (
	room: RoomEngine,
): ConnectorsStore | undefined =>
	toRoomUiStore(room).getIntegration<ConnectorsIntegration>(
		CONNECTORS_INTEGRATION_ID,
	)?.store;

/**
 * A room's connector state, for the integration's own views, which only a
 * room with the integration renders.
 *
 * @param room - The room.
 * @returns The room's connectors.
 * @throws Error when the room has no connectors integration.
 */
export const requireRoomConnectors = (room: RoomEngine): ConnectorsStore => {
	const connectors = getRoomConnectors(room);
	if (!connectors) {
		throw new Error("The room has no connectors integration");
	}
	return connectors;
};
