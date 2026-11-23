import { useState } from "react";
import { getFollowUpQuestionsPixel } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";
import { CONNECTOR_SERVICES } from "../../connectors/store/connector-catalog";
import { useConnectors } from "../../connectors/store/use-connectors";
import type { RoomStore } from "../../room/store/room.store";
import { useRoomSelector } from "../../room/store/use-room-selector";
import { listRoomTools } from "../../tools/mcp/mcp-utils";

/**
 * Validate the default suggestion response before rendering clickable messages.
 * Anything but exactly three distinct, short strings shows no suggestions at
 * all, rather than a partial or oversized set.
 *
 * @param data - The pixel's output.
 * @returns The suggestions, or none when the response is not usable.
 */
const readSuggestions = (data: unknown): string[] => {
	if (
		!isRecord(data) ||
		!Array.isArray(data.suggestions) ||
		data.suggestions.length !== 3
	) {
		return [];
	}
	const suggestions: string[] = [];
	for (const value of data.suggestions) {
		if (typeof value !== "string") return [];
		const suggestion = value.trim();
		if (
			!suggestion ||
			suggestion.length > 240 ||
			suggestion.split(/\s+/u).length > 24 ||
			suggestions.some(
				(previous) =>
					previous.replace(/\s+/gu, " ").toLowerCase() ===
					suggestion.replace(/\s+/gu, " ").toLowerCase(),
			)
		) {
			return [];
		}
		suggestions.push(suggestion);
	}
	return suggestions;
};

/**
 * The pixel that asks for follow-ups, once the conversation has settled.
 *
 * @param room - The room.
 * @returns The pixel, or an empty string while the room is busy or empty.
 */
const buildSuggestionsPixel = (room: RoomStore): string => {
	const { connectors } = room;
	const response = room.latestResponseMessage;
	const isReady = Boolean(
		room.model?.engine_id &&
			room.roomId &&
			room.history.length > 0 &&
			!room.isLoading &&
			!room.error &&
			!room.isCancelling &&
			!response?.isThinking &&
			!response?.hasUnfinishedTools &&
			!connectors.isSavingConnectors,
	);
	if (!isReady) {
		return "";
	}
	// tools the server should not suggest: their account is not offered, not
	// covered, or not signed in
	const unavailableReactors = CONNECTOR_SERVICES.filter(
		(service) =>
			!connectors.isProviderOffered(service.provider) ||
			!connectors.isServiceCovered(service.id) ||
			(connectors.connectedProviders !== null &&
				!connectors.connectedProviders.includes(service.provider)),
	).flatMap((service) => service.tools.map((tool) => tool.reactor));
	const suggestionContext = {
		mcp: listRoomTools(room.options.mcp, room.agentTools),
		tools: room.chatTools.chatToolDefinitions.map((tool) => ({
			name: tool.name,
			description: tool.description,
		})),
		unavailableReactors,
	};
	return getFollowUpQuestionsPixel({
		engineId: room.model.engine_id,
		roomId: room.roomId,
		parentMessageId: room.tail.id,
		suggestionContext,
	});
};

/**
 * Generate follow-ups for the settled conversation and current tool selection.
 * Capability descriptions are context only; the server resolves attached MCPs.
 * The SDK discards cancelled responses, and the completed request key also hides
 * the previous result immediately when its inputs change, before effects run.
 *
 * @param room - The conversation and capabilities to suggest follow-ups for.
 * @returns Valid suggestions for the current request, or none while unavailable.
 */
export const useRoomSuggestions = (room: RoomStore): string[] => {
	const { connectors } = room;
	// the connectors render this hook again when they change; the room's
	// selector reads them then
	useConnectors(connectors);
	const { pixel, insightId } = useRoomSelector(room, (current) => ({
		pixel: buildSuggestionsPixel(current),
		insightId: current.insightId,
	}));
	const requestKey = JSON.stringify([insightId, pixel]);
	const [completedRequest, setCompletedRequest] = useState("");
	const query = usePixel<unknown>(
		pixel,
		{
			data: null,
			onSuccess: () => setCompletedRequest(requestKey),
		},
		insightId,
	);

	return pixel &&
		query.status === "SUCCESS" &&
		completedRequest === requestKey
		? readSuggestions(query.data)
		: [];
};
