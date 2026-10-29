import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { BrainPage } from "./brain.page";

vi.mock("@/features/collaboration/components/brain-memory", () => ({
	BrainMemory: () => <h1>Memory content</h1>,
}));
vi.mock("@/features/collaboration/components/brain-review", () => ({
	BrainReview: () => <h1>Review content</h1>,
}));
vi.mock("@/features/collaboration/components/brain-thread", () => ({
	BrainThread: () => <h1>Thread detail</h1>,
}));
vi.mock("@/features/collaboration/components/people-directory", () => ({
	PeopleDirectory: () => <h1>People content</h1>,
}));
vi.mock("@/features/collaboration/components/person-detail", () => ({
	PersonDetail: () => <h1>Person detail</h1>,
}));
vi.mock("@/features/collaboration/components/sources-and-rules", () => ({
	SourcesAndRules: () => <h1>Sources content</h1>,
}));
vi.mock("@/features/collaboration/components/threads-directory", () => ({
	ThreadsDirectory: () => <h1>Threads content</h1>,
}));
vi.mock("@/features/collaboration/components/work-topics", () => ({
	WorkTopics: () => <h1>Topics content</h1>,
}));

afterEach(cleanup);

/** Exercises route selection and the shared Settings tabs while isolating domain reads. */
function renderBrain(path: string) {
	const router = createMemoryRouter(
		[
			"/brain",
			"/brain/topics",
			"/brain/memory",
			"/brain/people",
			"/brain/people/:personId",
			"/brain/threads",
			"/brain/threads/:threadId",
			"/brain/sources",
		].map((route) => ({ path: route, Component: BrainPage })),
		{ initialEntries: [path] },
	);
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return router;
}

it.each([
	["/brain", "Review content", "Review"],
	["/brain/topics", "Topics content", "Topics"],
	["/brain/memory", "Memory content", "Memory"],
	["/brain/people", "People content", "People"],
	["/brain/people/person-one", "Person detail", "People"],
	["/brain/threads", "Threads content", "Conversations"],
	["/brain/threads/thread-one", "Thread detail", "Conversations"],
	["/brain/sources", "Sources content", "Connections"],
] as const)(
	"keeps every setup destination available at %s",
	(path, heading, active) => {
		renderBrain(path);
		expect(screen.getByRole("heading", { name: heading })).toBeVisible();
		const navigation = within(
			screen.getByRole("navigation", { name: "Settings" }),
		);
		expect(navigation.getAllByRole("link")).toHaveLength(11);
		for (const label of [
			"About you",
			"Connections",
			"Email",
			"Topics",
			"Review",
			"Conversations",
			"People",
			"Memory",
			"Rules",
			"Appearance",
			"Data",
		]) {
			const link = navigation.getByRole("link", {
				name: new RegExp(`^${label}\\b`),
			});
			if (label === active)
				expect(link).toHaveAttribute("aria-current", "page");
			else expect(link).not.toHaveAttribute("aria-current");
		}
	},
);

it("opens a setup tab by keyboard from a nested detail route", async () => {
	const user = userEvent.setup();
	const router = renderBrain("/brain/threads/thread-one");
	screen.getByRole("link", { name: "People" }).focus();
	await user.keyboard("{Enter}");
	expect(router.state.location.pathname).toBe("/brain/people");
	expect(
		screen.getByRole("heading", { name: "People content" }),
	).toBeVisible();
	expect(screen.getByRole("link", { name: "People" })).toHaveAttribute(
		"aria-current",
		"page",
	);
});

// Route composition is exercised with isolated child views; hydration has its own integration coverage.
vi.mock("@/features/collaboration/components/saved-record-boundary", () => ({
	SavedRecordBoundary: ({ children }: { children: ReactNode }) => children,
}));
