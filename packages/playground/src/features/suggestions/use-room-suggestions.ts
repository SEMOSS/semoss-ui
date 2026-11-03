import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";
import { CONNECTOR_SERVICES } from "@/features/connectors/connector.catalog";
import type { RoomStore } from "@/stores/room/room.store";

/** Validate the default suggestion response before rendering clickable messages. */
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
	const unavailableReactors = CONNECTOR_SERVICES.filter(
		(service) =>
			!connectors.isProviderOffered(service.provider) ||
			!connectors.isServiceCovered(service.id) ||
			(connectors.connectedProviders !== null &&
				!connectors.connectedProviders.includes(service.provider)),
	).flatMap((service) => service.tools.map((tool) => tool.reactor));
	const suggestionContext = {
		mcp: room.options.mcp,
		tools: room.chatTools.chatToolDefinitions.map((tool) => ({
			name: tool.name,
			description: tool.description,
		})),
		unavailableReactors,
	};
	const pixel = isReady
		? `GenerateFollowUpQuestions(engine=${JSON.stringify([room.model.engine_id])}, roomId=${JSON.stringify([room.roomId])}, parentMessageId=${JSON.stringify([room.tail.id])}, suggestionContext=[${JSON.stringify(suggestionContext)}]);`
		: "";
	const requestKey = JSON.stringify([room.insightId, pixel]);
	const [completedRequest, setCompletedRequest] = useState("");
	const query = usePixel<unknown>(
		pixel,
		{
			data: null,
			onSuccess: () => setCompletedRequest(requestKey),
		},
		room.insightId,
	);

	return pixel &&
		query.status === "SUCCESS" &&
		completedRequest === requestKey
		? readSuggestions(query.data)
		: [];
};
