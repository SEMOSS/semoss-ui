import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { Onboarding } from "./onboarding";

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("onboarding start", () => {
	it("reads nothing until the owner presses Start setup", async () => {
		vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
		const run = vi.fn(async () => ({
			pixelReturn: [{ output: {}, operationType: ["MAP"] }],
		}));
		const actions = { run } as unknown as InsightActions;
		const user = userEvent.setup();
		render(<Onboarding actions={actions} />);

		expect(
			screen.getByRole("heading", { name: "Set up with your mail" }),
		).toBeInTheDocument();
		expect(run).not.toHaveBeenCalled();
		expect(screen.queryByText(/headers only/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/two minutes/i)).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Start setup" }));
		await waitFor(() => expect(run).toHaveBeenCalled());
		expect(
			screen.queryByRole("button", { name: "Start setup" }),
		).not.toBeInTheDocument();
	});
});
