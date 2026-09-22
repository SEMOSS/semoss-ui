import { act, renderHook, waitFor } from "@testing-library/react";
import { useRoomStore } from "./use-room-store";

const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const run = insight.actions.run;

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => insight,
}));

function pixelResponse(output: unknown) {
	return { pixelReturn: [{ output, operationType: [] }] };
}

describe("useRoomStore", () => {
	beforeEach(() => run.mockReset());

	it("loads the room options envelope, binds the room, and merges updates", async () => {
		run.mockResolvedValueOnce(
			pixelResponse({
				ROOM_NAME: "Research",
				OPTIONS: {
					predefinedPrompts: [],
					instructions: "Check sources.",
					mcp: [],
					modelId: "model-1",
					workspace: {
						workspace_id: "workspace-1",
						name: "Research",
					},
				},
			}),
		).mockResolvedValue(pixelResponse(true));

		const { result } = renderHook(() =>
			useRoomStore("insight-1", "room-1"),
		);
		await waitFor(() => expect(result.current.room).not.toBeNull());

		expect(result.current.room).toMatchObject({
			roomId: "room-1",
			insightId: "insight-1",
			name: "Research",
		});
		expect(result.current.room?.options).toMatchObject({
			instructions: "Check sources.",
			modelId: "model-1",
		});
		expect(run.mock.calls.map(([statement]) => statement)).toEqual([
			'GetRoomOptions(roomId=["room-1"]);',
			'SetRoomForInsight(roomId=["room-1"]);',
		]);

		await act(() =>
			result.current.room?.updateOptions({ modelId: "model-2" }),
		);
		const updateStatement = String(run.mock.calls[2]?.[0]);
		expect(updateStatement).toContain("UpdateRoomOptions");
		expect(updateStatement).toContain('"instructions":"Check sources."');
		expect(updateStatement).toContain('"modelId":"model-2"');
		expect(result.current.room?.options.modelId).toBe("model-2");
	});

	it("rejects a raw options object instead of silently accepting the wrong envelope", async () => {
		run.mockResolvedValueOnce(
			pixelResponse({
				predefinedPrompts: [],
				instructions: "Wrong shape",
				mcp: [],
				modelId: "model-1",
			}),
		);

		const { result } = renderHook(() =>
			useRoomStore("insight-1", "room-1"),
		);
		await waitFor(() => expect(result.current.isLoading).toBe(false));

		expect(result.current.room).toBeNull();
		expect(result.current.error?.message).toContain("unexpected shape");
		expect(run).toHaveBeenCalledOnce();
	});
});
