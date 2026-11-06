import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { runPixel } from "../../../api/base";
import type { AgentRunSnapshot, AgentRunSubscription } from "../../../types";
import { AgentStore } from "../../agent/agent.store";
import { RoomEngine } from "../room-engine.store";
import { reconnectAgentRun } from "./agent-harness";
import { ResponseMessageStore } from "./response-message.store";

vi.mock("../../../api/base", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	getPixelJobStreaming: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
}));

const SPEND_LIMIT =
	"Your project has reached its configured enforced spend limit.";

/** Every room pixel succeeds with one output per statement. */
const pixelsSucceed = (outputs: unknown[]) =>
	vi.mocked(runPixel).mockResolvedValue({
		errors: [],
		insightId: "insight-test",
		pixelReturn: outputs.map((output) => ({
			output,
			isMeta: false,
			operationType: [],
			pixelExpression: "",
			pixelId: "",
			timeToRun: 0,
		})),
	});

/** An agent room with a model, ready to send a message. */
const createAgentRoom = async () => {
	const room = new RoomEngine({
		roomId: "agent-test",
		insightId: "insight-test",
	});
	pixelsSucceed([[], {}]);
	await room.initialize({ isNew: true });
	room.setModel({
		engine_id: "model-test",
		engine_name: "Model",
		engine_type: "MODEL",
	});
	room.setMode("agent");
	pixelsSucceed([true]);
	return room;
};

/** Every watched run settles at once with `snapshot`. */
const runsSettleWith = (snapshot: AgentRunSnapshot) =>
	vi
		.spyOn(AgentStore.prototype, "watch")
		.mockImplementation((handlers): AgentRunSubscription => {
			handlers.onReconcile(snapshot);
			return {
				stop: vi.fn(),
				getItems: () => ({ itemsById: {}, itemOrder: [] }),
				pokeNow: vi.fn(),
				done: Promise.resolve(snapshot),
			};
		});

const failedRun = (runId: string): AgentRunSnapshot => ({
	runId,
	roomId: "agent-test",
	status: "FAILED",
	errorMessage: SPEND_LIMIT,
	pendingActions: [],
});

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

test("a failed run shows its error on the room", async () => {
	const room = await createAgentRoom();
	vi.spyOn(AgentStore, "start").mockResolvedValue(
		new AgentStore("agent-test", "insight-test", "run-1"),
	);
	runsSettleWith(failedRun("run-1"));

	await expect(room.askMessage("Plan my week")).rejects.toThrow(SPEND_LIMIT);

	expect(room.error?.message).toBe(SPEND_LIMIT);
	expect(room.isLoading).toBe(false);
});

test("a run that cannot start shows its error on the room", async () => {
	const room = await createAgentRoom();
	vi.spyOn(AgentStore, "start").mockRejectedValue(
		new Error("RunAgent failed"),
	);

	await expect(room.askMessage("Plan my week")).rejects.toThrow(
		"RunAgent failed",
	);

	expect(room.error?.message).toBe("RunAgent failed");
});

test("a run that fails after a reload shows its error on the room", async () => {
	const room = await createAgentRoom();
	runsSettleWith(failedRun("run-2"));
	vi.spyOn(console, "error").mockImplementation(() => undefined);
	const response = new ResponseMessageStore(room, {
		io: "OUTPUT",
		messageId: "response-1",
		visible: true,
		platform_generated: true,
		modelId: "model-test",
		modelType: "",
		dateCreated: "",
		parts: [],
		tokens: 0,
		agentRun: { runId: "run-2" },
		ornaments: {},
		pruneToolsAbove: false,
	});

	reconnectAgentRun(response);

	await vi.waitFor(() => expect(room.error?.message).toBe(SPEND_LIMIT));
	expect(room.isLoading).toBe(false);
});
