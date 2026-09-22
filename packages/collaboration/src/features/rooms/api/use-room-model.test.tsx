import { renderHook } from "@testing-library/react";

const usePixelMock = vi.hoisted(() => vi.fn());

vi.mock("@semoss/sdk/react", () => ({
	usePixel: usePixelMock,
}));

import { useRoomModel } from "./use-room-model";

describe("useRoomModel", () => {
	beforeEach(() => {
		usePixelMock.mockReset();
	});

	it("resolves a persisted model id to its reload display name", () => {
		usePixelMock.mockReturnValue({
			data: [
				{
					engine_id: "model-1",
					engine_name: "internal-name",
					engine_display_name: "Display model",
					engine_type: "MODEL",
				},
			],
			status: "SUCCESS",
			error: null,
		});

		const { result } = renderHook(() => useRoomModel("model-1"));

		expect(usePixelMock).toHaveBeenCalledWith(
			'META | MyEngines(engine=["model-1"], engineTypes=["MODEL"], limit=[1], offset=[0]);',
		);
		expect(result.current.engine).toMatchObject({
			engine_id: "model-1",
			engine_display_name: "Display model",
		});
	});

	it("rejects malformed engine responses instead of displaying them", () => {
		usePixelMock.mockReturnValue({
			data: [{ engine_id: "model-1" }],
			status: "SUCCESS",
			error: null,
		});

		const { result } = renderHook(() => useRoomModel("model-1"));

		expect(result.current.engine).toBeNull();
		expect(result.current.error?.message).toBe(
			"The saved model returned an unexpected response.",
		);
	});
});
