import { act, renderHook } from "@testing-library/react";
import type { Engine } from "@semoss/shared";
import { useRoomModelSelection } from "./use-room-model-selection";
import type { PlaygroundRoom } from "./use-room-store";

const nextEngine: Engine = {
	engine_id: "model-2",
	engine_name: "model-two",
	engine_display_name: "Model Two",
	engine_type: "MODEL",
};

function roomWith(updateOptions: PlaygroundRoom["updateOptions"]) {
	return {
		roomId: "room-1",
		options: { modelId: "model-1" },
		updateOptions,
	} as PlaygroundRoom;
}

describe("useRoomModelSelection", () => {
	it("commits a model only after room persistence succeeds", async () => {
		const updateOptions = vi.fn(async () => undefined);
		const { result } = renderHook(() =>
			useRoomModelSelection("room-1", roomWith(updateOptions)),
		);

		await act(() => result.current.selectModel(nextEngine));

		expect(updateOptions).toHaveBeenCalledWith({ modelId: "model-2" });
		expect(result.current.modelId).toBe("model-2");
		expect(result.current.selectedEngine?.engine_display_name).toBe(
			"Model Two",
		);
	});

	it("rolls back to the persisted model when saving fails", async () => {
		const updateOptions = vi.fn(async () => {
			throw new Error("Save failed");
		});
		const { result } = renderHook(() =>
			useRoomModelSelection("room-1", roomWith(updateOptions)),
		);

		let failure: unknown;
		await act(async () => {
			try {
				await result.current.selectModel(nextEngine);
			} catch (cause) {
				failure = cause;
			}
		});

		expect(failure).toEqual(new Error("Save failed"));
		expect(result.current.modelId).toBe("model-1");
		expect(result.current.selectedEngine).toBeNull();
		expect(result.current.isSaving).toBe(false);
	});
});
