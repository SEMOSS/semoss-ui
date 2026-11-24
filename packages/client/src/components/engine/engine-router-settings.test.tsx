import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EngineRouterSettings } from "./engine-router-settings";

const mocks = vi.hoisted(() => ({ usePixel: vi.fn() }));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	usePixel: mocks.usePixel,
	useSessionInsight: () => ({ run: vi.fn(), insightId: "i" }),
}));

afterEach(cleanup);

describe("EngineRouterSettings", () => {
	it("does not offer the plain editor for a subtask router, whose subtasks it would drop", () => {
		mocks.usePixel.mockReturnValue({
			status: "SUCCESS",
			data: JSON.stringify({
				mode: "subtask",
				subtasks: [{ id: "a" }],
				improvement: { enabled: true },
			}),
			refresh: vi.fn(),
		});
		render(<EngineRouterSettings engineId="rt" permission="OWNER" />);
		expect(
			screen.getByText(/This router uses subtask routing/),
		).toBeInTheDocument();
		expect(screen.queryByText("Save")).not.toBeInTheDocument();
	});
});
