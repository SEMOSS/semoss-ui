import {
	type ClientToolProvider,
	isAskExecutionMode,
	type RoomToolCall,
} from "@semoss/sdk";
import { getConnectorToolService } from "./connector-tools";

/**
 * The connectors' part of a room's client tools: no tools of its own (the
 * connectors' tools are in the room's own toolbox, which the backend sends),
 * only how their calls show — one that asks opens inline, in its approval
 * card; one that runs on its own opens in the Workspace.
 *
 * @returns The provider.
 */
export const createConnectorToolProvider = (): ClientToolProvider => ({
	id: "connectors",
	getTools: () => [],
	canHandle: () => false,
	execute: () =>
		Promise.reject(
			new Error("Connector calls run through the room's toolbox"),
		),
	decorateToolCall: (call: RoomToolCall): RoomToolCall => {
		if (!call._meta || !getConnectorToolService(call)) {
			return call;
		}
		const isAsk = isAskExecutionMode(call._meta.SMSS_MCP_EXECUTION);
		return {
			...call,
			_meta: {
				...call._meta,
				SMSS_MCP_UI: {
					...call._meta.SMSS_MCP_UI,
					displayLocation: isAsk ? "inline" : "sidebar",
					autoOpen: isAsk,
				},
			},
		};
	},
});
