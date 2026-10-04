import { roomOptionsEnvelopeSchema } from "@/features/rooms/api/room-schemas";
import {
	LEGACY_THREAD_ASSISTANT_INSTRUCTIONS,
	PREVIOUS_THREAD_ASSISTANT_INSTRUCTIONS,
	threadInstructions,
} from "./thread-context";
import { settingsFromRoom, workInstructions } from "./thread-settings";

it.each([
	LEGACY_THREAD_ASSISTANT_INSTRUCTIONS,
	PREVIOUS_THREAD_ASSISTANT_INSTRUCTIONS,
])(
	"recognizes old built-in instructions without turning them into user settings",
	(prefix) => {
		expect(workInstructions(prefix)).toBe("");
		expect(workInstructions(`${prefix}\n\nUse concise replies.`)).toBe(
			"Use concise replies.",
		);
		const options = roomOptionsEnvelopeSchema.parse({
			OPTIONS: {
				modelId: "model-1",
				instructions: `${prefix}\n\nUse concise replies.`,
			},
		}).OPTIONS;
		expect(settingsFromRoom(options).instructions).toBe(
			"Use concise replies.",
		);
	},
);

it("preserves custom text, including whitespace and a legacy phrase inside it", () => {
	for (const text of [
		"  Keep this spacing.  ",
		`My own instructions:\n${LEGACY_THREAD_ASSISTANT_INSTRUCTIONS}`,
		`${LEGACY_THREAD_ASSISTANT_INSTRUCTIONS} Additional custom sentence.`,
	]) {
		expect(workInstructions(text)).toBe(text);
	}
	expect(threadInstructions()).toBe("");
	expect(threadInstructions("agent-1")).toBe("");
});
