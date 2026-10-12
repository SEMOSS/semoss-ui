import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { ThreadsDirectory } from "./threads-directory";

/** Imported mail need not have an action or a confirmed topic. */
function directoryState() {
	const state = createInitialCollaborationState();
	const thread = state.threads[0];
	state.items = [];
	state.threads = [
		{
			...thread,
			id: "older",
			subject: "Earlier conversation",
			topicLinks: [],
			needsTopicChoice: false,
			lastAt: "2026-10-10T12:00:00Z",
			isSample: false,
		},
		{
			...thread,
			id: "reply",
			subject: "Latest reply without an action",
			topicLinks: [],
			needsTopicChoice: false,
			lastAt: "2026-10-11T12:00:00Z",
			participants: [
				{
					personId: "new-person",
					name: "Approved Sender",
					email: "approved@example.com",
					role: "sender",
					included: true,
				},
			],
			isSample: false,
		},
		{
			...thread,
			id: "suggested",
			subject: "Suggested topic only",
			topicLinks: [
				{
					topicId: "t-geng",
					source: "suggested" as const,
					primary: false,
					confidence: 65,
				},
			],
			needsTopicChoice: false,
			isSample: false,
		},
		{
			...thread,
			id: "filed",
			subject: "Already filed conversation",
			topicLinks: [
				{
					topicId: "t-geng",
					source: "you" as const,
					primary: true,
					confidence: null,
				},
			],
			needsTopicChoice: false,
			isSample: false,
		},
	];
	return state;
}

function renderDirectory(state = directoryState()) {
	const router = createMemoryRouter(
		[
			{ path: "/brain/threads", Component: ThreadsDirectory },
			{
				path: "/brain/threads/:threadId",
				element: <p>Opened conversation</p>,
			},
		],
		{ initialEntries: ["/brain/threads?filter=needs"] },
	);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return { router, user: userEvent.setup() };
}

afterEach(cleanup);

describe("unassigned conversations", () => {
	it("shows imported mail with no action and suggested-only topics, newest first", () => {
		renderDirectory();
		expect(
			screen.getByRole("heading", { name: "Unassigned" }),
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Suggested topic only" }),
		).toBeVisible();
		expect(
			screen.queryByRole("link", { name: "Already filed conversation" }),
		).not.toBeInTheDocument();
		const subjects = screen
			.getAllByRole("link")
			.map((link) => link.textContent);
		expect(subjects.indexOf("Latest reply without an action")).toBeLessThan(
			subjects.indexOf("Earlier conversation"),
		);
	});

	it("finds a reply by sender email and opens the existing conversation", async () => {
		const { user, router } = renderDirectory();
		await user.type(
			screen.getByRole("textbox", { name: "Search threads" }),
			"APPROVED@example.com",
		);
		expect(
			screen.queryByRole("link", { name: "Earlier conversation" }),
		).not.toBeInTheDocument();
		await user.click(
			screen.getByRole("link", {
				name: "Latest reply without an action",
			}),
		);
		expect(router.state.location.pathname).toBe("/brain/threads/reply");
	});

	it("distinguishes an empty queue from an empty search and offers recovery", async () => {
		const { user } = renderDirectory();
		await user.type(
			screen.getByRole("textbox", { name: "Search threads" }),
			"missing subject",
		);
		expect(screen.getByText(/No matching threads\. Try/)).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Clear search" }));
		expect(
			screen.getByRole("link", {
				name: "Latest reply without an action",
			}),
		).toBeVisible();
	});

	it("explains where unassigned mail appears and can reveal already filed threads", async () => {
		const state = directoryState();
		state.threads = state.threads.filter((thread) => thread.id === "filed");
		const { user, router } = renderDirectory(state);
		expect(screen.getByText(/No unassigned conversations/)).toBeVisible();
		await user.click(
			screen.getByRole("button", { name: "View all threads" }),
		);
		expect(router.state.location.search).toBe("");
		expect(
			screen.getByRole("link", { name: "Already filed conversation" }),
		).toBeVisible();
	});
});
