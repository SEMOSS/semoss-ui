import { roomOptionsEnvelopeSchema } from "./room-schemas";

describe("roomOptionsEnvelopeSchema", () => {
	it("reads a new room with no stored options as empty options", () => {
		expect(roomOptionsEnvelopeSchema.parse({}).OPTIONS).toEqual({
			predefinedPrompts: [],
			instructions: "",
			mcp: [],
			modelId: "",
		});
		expect(
			roomOptionsEnvelopeSchema.parse({ ROOM_NAME: "Named" }).ROOM_NAME,
		).toBe("Named");
	});

	it("still rejects a raw options object without the envelope", () => {
		expect(
			roomOptionsEnvelopeSchema.safeParse({ modelId: "model-1", mcp: [] })
				.success,
		).toBe(false);
	});
});
