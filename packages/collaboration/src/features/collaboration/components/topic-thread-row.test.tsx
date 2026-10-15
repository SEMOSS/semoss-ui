import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { TooltipProvider } from "@semoss/ui/next";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import type { Thread } from "../state/collaboration.types";
import {
	type CollaborationChange,
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { TopicThreadRow } from "./topic-thread-row";

const threadId = "th-geng-review";

function RowFixture({ topicId }: { topicId: string }) {
	const { state } = useCollaborationSession();
	const thread = state.threads.find((candidate) => candidate.id === threadId);
	if (!thread) throw new Error("Missing thread fixture");
	return (
		<ul aria-label="Topic threads">
			<TopicThreadRow
				thread={thread}
				topicId={topicId}
				items={state.items.filter((item) => item.threadId === threadId)}
			/>
		</ul>
	);
}

function setup(changes: Partial<Thread> = {}, isWaiting = false) {
	const state = createInitialCollaborationState();
	const thread = state.threads.find((candidate) => candidate.id === threadId);
	const item = state.items[0];
	const topicLink = thread?.topicLinks[0];
	if (!thread || !item || !topicLink)
		throw new Error("Missing topic thread fixture");
	Object.assign(thread, changes);
	thread.subject = "Launch review";
	thread.summary = "Review the launch schedule with the team.";
	state.items = [
		{
			...item,
			threadId,
			topicIds: [topicLink.topicId],
			status: isWaiting ? "waiting" : "open",
		},
	];
	const onChange = vi.fn<(change: CollaborationChange) => void>();
	const router = createMemoryRouter(
		[
			{
				path: "*",
				element: (
					<CollaborationSessionProvider
						initialState={state}
						onChange={onChange}
					>
						<RowFixture topicId={topicLink.topicId} />
					</CollaborationSessionProvider>
				),
			},
		],
		{ initialEntries: [`/topics/${topicLink.topicId}`] },
	);
	render(
		<TooltipProvider>
			<RouterProvider router={router} />
		</TooltipProvider>,
	);
	return {
		router,
		onChange,
		topicId: topicLink.topicId,
		user: userEvent.setup(),
	};
}

afterEach(cleanup);

it("opens the conversation and keeps source details in the thread menu", async () => {
	const { router, user } = setup();
	const subject = screen.getByRole("link", { name: "Launch review" });
	expect(subject).toHaveAttribute("href", `/thread/${threadId}`);
	expect(subject).toHaveAttribute("title", "Launch review · main topic");
	expect(screen.getByText("For you")).toBeVisible();
	expect(screen.getByText("Main topic")).toBeInTheDocument();
	expect(
		screen.getByText("Review the launch schedule with the team."),
	).toBeVisible();
	await user.click(subject);
	expect(router.state.location.pathname).toBe(`/thread/${threadId}`);
	await user.click(
		screen.getByRole("button", {
			name: "Thread actions for Launch review",
		}),
	);
	await user.click(screen.getByRole("button", { name: "View in Brain" }));
	expect(router.state.location.pathname).toBe(`/brain/threads/${threadId}`);
});

it("retains statuses, calendar details, resume, and topic unlinking", async () => {
	const state = createInitialCollaborationState();
	const link = state.threads.find((thread) => thread.id === threadId)
		?.topicLinks[0];
	if (!link) throw new Error("Missing topic link fixture");
	const { onChange, topicId, user } = setup(
		{
			channel: "calendar",
			when: "Tomorrow, 2:00–3:00 PM",
			conflict: "Overlaps the team meeting",
			muted: true,
			automated: true,
			isSample: true,
			topicLinks: [{ ...link, source: "suggested" }],
		},
		true,
	);
	for (const text of [
		"Suggested topic",
		"Ignored",
		"Automated",
		"Sample",
		"Waiting",
		"Tomorrow, 2:00–3:00 PM",
		"Overlaps the team meeting",
	])
		expect(screen.getByText(text)).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Resume thread" }));
	expect(screen.queryByText("Ignored")).not.toBeInTheDocument();
	expect(onChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			commands: [{ type: "thread.mute", threadId, muted: false }],
		}),
	);
	await user.click(
		screen.getByRole("button", {
			name: "Remove Launch review from this topic",
		}),
	);
	expect(onChange).toHaveBeenLastCalledWith(
		expect.objectContaining({
			commands: [
				{ type: "thread.link", threadId, topicId, operation: "remove" },
			],
		}),
	);
	const remainingThread = onChange.mock.lastCall?.[0].next.threads.find(
		(thread) => thread.id === threadId,
	);
	expect(remainingThread).toBeDefined();
	expect(
		remainingThread?.topicLinks.some((link) => link.topicId === topicId),
	).toBe(false);
});
