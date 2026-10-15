import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import type { TopicGoal } from "../state/collaboration.types";
import {
	type CollaborationChange,
	CollaborationSessionProvider,
} from "../state/collaboration-session.context";
import { TopicDetail } from "./topic-detail";

vi.mock("@/features/dashboard/topic-sessions", () => ({
	TopicSessions: () => null,
}));

const completedGoal = {
	noteId: "goal-booking",
	text: "Get booking details for Nevada",
	status: "done",
	resolution:
		"Booking confirmed: flight 4884 arrives at Dulles on November 1.",
} satisfies TopicGoal;
const openGoal: TopicGoal = {
	noteId: "goal-room",
	text: "Get the room code for Florida",
	status: "open",
};

/** Exercises goal presentation and commands with the real session reducer. */
function setup(goals: TopicGoal[]) {
	const state = createInitialCollaborationState();
	const [topic] = state.topics;
	if (!topic) throw new Error("Missing topic fixture");
	topic.goals = goals;
	const onChange = vi.fn<(change: CollaborationChange) => void>();
	const router = createMemoryRouter(
		[{ path: "/topics/:topicId", element: <TopicDetail /> }],
		{ initialEntries: [`/topics/${topic.id}`] },
	);
	render(
		<CollaborationSessionProvider initialState={state} onChange={onChange}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return {
		goals: within(screen.getByRole("region", { name: "Goals" })),
		onChange,
		topicId: topic.id,
		user: userEvent.setup(),
	};
}

afterEach(cleanup);

it("keeps the goal readable and names the AI accomplishment separately", () => {
	const { goals } = setup([completedGoal, openGoal]);
	expect(
		goals.getByRole("checkbox", { name: completedGoal.text }),
	).toBeChecked();
	expect(goals.getByText(completedGoal.text)).not.toHaveClass("line-through");
	expect(goals.getByText("AI accomplishment")).toBeVisible();
	expect(goals.getByText(completedGoal.resolution)).toBeVisible();
	expect(goals.getByText("Completed")).toBeVisible();
	expect(goals.getByText("Open")).toBeVisible();
	expect(goals.getByRole("status")).toHaveTextContent("1 of 2 complete");
	expect(
		goals.getByRole("progressbar", { name: "Goals completed" }),
	).toHaveAttribute("aria-valuenow", "50");
});

it("reopens and completes a goal by keyboard without losing its accomplishment", async () => {
	const { goals, onChange, topicId, user } = setup([completedGoal, openGoal]);
	const checkbox = goals.getByRole("checkbox", { name: completedGoal.text });
	checkbox.focus();
	await user.keyboard(" ");
	expect(checkbox).not.toBeChecked();
	expect(checkbox).toHaveFocus();
	expect(goals.getByRole("status")).toHaveTextContent("0 of 2 complete");
	expect(onChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			commands: [
				{
					type: "topic.note",
					topicId,
					kind: "goal",
					operation: "save",
					noteId: completedGoal.noteId,
					status: "open",
				},
			],
		}),
	);
	expect(
		onChange.mock.lastCall?.[0].next.topics
			.find((topic) => topic.id === topicId)
			?.goals.find((goal) => goal.noteId === completedGoal.noteId),
	).toMatchObject({ ...completedGoal, status: "open" });
	await user.keyboard(" ");
	expect(checkbox).toBeChecked();
	expect(goals.getByRole("status")).toHaveTextContent("1 of 2 complete");
	expect(goals.getByText(completedGoal.resolution)).toBeVisible();
});

it("does not invent an accomplishment for a completed goal without one", () => {
	const { goals } = setup([{ ...openGoal, status: "done" }]);
	expect(goals.getByRole("checkbox", { name: openGoal.text })).toBeChecked();
	expect(goals.queryByText("AI accomplishment")).not.toBeInTheDocument();
	expect(goals.getByRole("status")).toHaveTextContent("1 of 1 complete");
	expect(
		goals.getByRole("progressbar", { name: "Goals completed" }),
	).toHaveAttribute("aria-valuenow", "100");
});

it("explains an empty goals section and preserves add-goal validation and focus", async () => {
	const { goals, onChange, user } = setup([]);
	expect(goals.getByText("Give this topic a direction")).toBeVisible();
	expect(
		goals.getByText(
			"Add a goal for you and your assistant to work toward.",
		),
	).toBeVisible();
	expect(goals.queryByRole("checkbox")).not.toBeInTheDocument();
	expect(goals.queryByRole("progressbar")).not.toBeInTheDocument();
	const trigger = goals.getByRole("button", { name: "Add goal" });
	await user.click(trigger);
	const popover = within(screen.getByRole("dialog", { name: "Add goal" }));
	const input = popover.getByRole("textbox", { name: "New goal" });
	expect(popover.getByRole("heading", { name: "New goal" })).toBeVisible();
	expect(input).toHaveFocus();
	expect(input).toHaveAccessibleDescription(
		"Describe the outcome you want to achieve.",
	);
	await user.type(input, "   ");
	await user.click(popover.getByRole("button", { name: "Add goal" }));
	expect(input).toBeInvalid();
	expect(input).toHaveAccessibleDescription(/Enter a goal\./);
	expect(input).toHaveValue("   ");
	expect(onChange).not.toHaveBeenCalled();
	await user.keyboard("{Escape}");
	expect(trigger).toHaveFocus();
});

it("adds a multiline goal, closes the form, and returns focus to its trigger", async () => {
	const { goals, onChange, topicId, user } = setup([]);
	const trigger = goals.getByRole("button", { name: "Add goal" });
	await user.click(trigger);
	const popover = within(screen.getByRole("dialog", { name: "Add goal" }));
	await user.type(
		popover.getByRole("textbox", { name: "New goal" }),
		"  Confirm the flight details.{Enter}Include the arrival time.  ",
	);
	expect(onChange).not.toHaveBeenCalled();
	await user.click(popover.getByRole("button", { name: "Add goal" }));
	expect(
		screen.queryByRole("dialog", { name: "Add goal" }),
	).not.toBeInTheDocument();
	expect(trigger).toHaveFocus();
	expect(onChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			commands: [
				{
					type: "topic.note",
					topicId,
					kind: "goal",
					operation: "save",
					text: "Confirm the flight details.\nInclude the arrival time.",
					status: "open",
				},
			],
		}),
	);
	expect(
		goals.getByRole("checkbox", {
			name: /Confirm the flight details\.\s+Include the arrival time\./,
		}),
	).not.toBeChecked();
	await user.click(trigger);
	expect(screen.getByRole("textbox", { name: "New goal" })).toHaveValue("");
});

it("cancels a goal draft without changing goals and restores focus", async () => {
	const { goals, onChange, user } = setup([openGoal]);
	const trigger = goals.getByRole("button", { name: "Add goal" });
	await user.click(trigger);
	const popover = within(screen.getByRole("dialog", { name: "Add goal" }));
	await user.type(
		popover.getByRole("textbox", { name: "New goal" }),
		"An unfinished goal",
	);
	await user.click(popover.getByRole("button", { name: "Cancel" }));
	expect(
		screen.queryByRole("dialog", { name: "Add goal" }),
	).not.toBeInTheDocument();
	expect(trigger).toHaveFocus();
	expect(onChange).not.toHaveBeenCalled();
	expect(goals.getAllByRole("checkbox")).toHaveLength(1);
	await user.click(trigger);
	expect(screen.getByRole("textbox", { name: "New goal" })).toHaveValue("");
});
