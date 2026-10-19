import { expect, test } from "vitest";
import type { RoomStore } from "@/stores/room/room.store";
import type { ResponsePixelMessage } from "@/types";
import { AbstractMessageStore } from "./abstract-message.store";

class MessageStore extends AbstractMessageStore {
	readonly type = "OUTPUT";
	parts: ResponsePixelMessage["parts"] = [];
}

/** Supplies a settled router response without changing the selected engine identity. */
const response = (routedEngineId: string): ResponsePixelMessage => ({
	io: "OUTPUT",
	messageId: "response",
	visible: true,
	platform_generated: false,
	modelId: "router",
	modelType: "MODEL_ROUTER",
	dateCreated: "2026-10-19T10:00:00Z",
	parts: [],
	tokens: 1,
	ornaments: {
		modelName: "Selected Router",
		routing: {
			routed_engine_id: routedEngineId,
			routed_engine_name: `Model ${routedEngineId}`,
		},
	},
	pruneToolsAbove: false,
});

test("keeps per-message routing on construction and updates it when a streamed response settles", () => {
	const room = { roomId: "room" } as RoomStore;
	const message = new MessageStore(room, response("first"));
	expect(message.ornaments.routing?.routed_engine_id).toBe("first");
	message.sync(response("fallback"));
	expect(message.ornaments.routing?.routed_engine_name).toBe(
		"Model fallback",
	);
	expect(message.modelId).toBe("router");
	expect(message.ornaments.modelName).toBe("Selected Router");
});

test("reloads persisted routing independently for each response and clears absent metadata", () => {
	const room = { roomId: "room" } as RoomStore;
	const first = new MessageStore(room, response("first"));
	const second = new MessageStore(room, response("second"));
	expect(first.ornaments.routing?.routed_engine_id).toBe("first");
	expect(second.ornaments.routing?.routed_engine_id).toBe("second");
	second.sync({
		...response("second"),
		ornaments: { modelName: "Direct Model" },
	});
	expect(second.ornaments.routing).toBeUndefined();
});
