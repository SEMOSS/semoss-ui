import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { Onboarding } from "./onboarding";
import { makeReview, reviewSession } from "./topic-review.test-fixtures";

beforeEach(() => {
	vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({ matches: false })),
	);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("onboarding start", () => {
	it("reads nothing until the owner presses Start setup", async () => {
		const run = vi.fn(async (statement: string) => ({
			pixelReturn: [
				{
					output:
						statement === "BrainGetTopicReview();"
							? { exists: false }
							: {},
					operationType: ["MAP"],
				},
			],
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

	it("resumes a saved topic draft without reading or importing the mailbox again", async () => {
		const session = reviewSession(async () =>
			makeReview("Recruiting UNC and VCU"),
		);
		await session.run("BrainStartTopicReview();");
		session.run.mockClear();
		const user = userEvent.setup();
		render(<Onboarding actions={session.actions} />);
		expect(session.run).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Start setup" }));
		expect(
			await screen.findByDisplayValue("Recruiting UNC and VCU"),
		).toBeEnabled();
		expect(session.run.mock.calls.map(([statement]) => statement)).toEqual([
			"BrainGetTopicReview();",
			"BrainStartTopicReview();",
		]);
	});

	it("keeps a failed resume check visible and does not begin mailbox work", async () => {
		const run = vi.fn(async () => {
			throw new Error("Unable to read saved setup");
		});
		const user = userEvent.setup();
		render(<Onboarding actions={{ run } as unknown as InsightActions} />);
		await user.click(screen.getByRole("button", { name: "Start setup" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Unable to read saved setup",
		);
		expect(run).toHaveBeenCalledExactlyOnceWith("BrainGetTopicReview();");
		expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
	});
});
