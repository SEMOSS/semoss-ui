import { act, renderHook } from "@testing-library/react";
import type { RoomStore } from "@semoss/sdk";
import type { Engine } from "@semoss/shared";
import { useRoomModelSelection } from "./use-room-model-selection";

const nextEngine: Engine = {
	engine_id: "model-2",
	engine_name: "model-two",
	engine_display_name: "Model Two",
	engine_type: "MODEL",
};

function roomWith(updateOptions: RoomStore["updateOptions"]) {
	return {
		roomId: "room-1",
		options: { modelId: "model-1" },
		updateOptions,
	} as RoomStore;
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
