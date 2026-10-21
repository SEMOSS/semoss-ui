import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
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
			await screen.findByRole("checkbox", {
				name: "Recruiting UNC and VCU",
			}),
		).toBeEnabled();
		expect(
			session.run.mock.calls
				.map(([statement]) => statement)
				.filter(
					(statement) => !statement.startsWith("BrainListPeople("),
				),
		).toEqual(["BrainGetTopicReview();", "BrainStartTopicReview();"]);
	});

	it("marks the current step in the progress bar and the step list", async () => {
		const session = reviewSession(async () =>
			makeReview("Recruiting UNC and VCU"),
		);
		await session.run("BrainStartTopicReview();");
		const user = userEvent.setup();
		render(<Onboarding actions={session.actions} />);
		expect(
			screen.getByRole("progressbar", {
				name: "Setup progress: step 1 of 8, Your mailbox",
			}),
		).toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Start setup" }));
		await screen.findByRole("checkbox", { name: "Recruiting UNC and VCU" });
		expect(
			screen.getByRole("progressbar", {
				name: "Setup progress: step 7 of 8, Topics",
			}),
		).toBeInTheDocument();
		const steps = within(
			screen.getByRole("list", { name: "Setup steps" }),
		).getAllByRole("listitem");
		expect(steps).toHaveLength(8);
		expect(steps[0]).toHaveTextContent("Your mailbox (done)");
		expect(steps[6]).toHaveTextContent("Topics");
		expect(steps[6]).toHaveAttribute("aria-current", "step");
		expect(steps[7]).not.toHaveAttribute("aria-current");
		expect(
			steps.filter((item) => item.hasAttribute("aria-current")),
		).toHaveLength(1);
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
