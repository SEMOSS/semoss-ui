import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { BrainPage } from "./brain.page";

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
vi.mock("@/features/collaboration/components/topic-detail", () => ({
	TopicDetail: () => <h1>Topic detail</h1>,
}));

afterEach(cleanup);

/** Exercises route selection and Brain navigation while isolating domain reads. */
function renderBrain(path: string) {
	const router = createMemoryRouter(
		[
			"/brain",
			"/brain/people",
			"/brain/people/:personId",
			"/brain/threads",
			"/brain/threads/:threadId",
			"/brain/sources",
			"/brain/topics/:topicId",
		].map((route) => ({ path: route, Component: BrainPage })),
		{ initialEntries: [path] },
	);
	render(<RouterProvider router={router} />);
	return router;
}

it.each([
	["/brain", "Review content", "Review"],
	["/brain/people", "People content", "People"],
	["/brain/people/person-one", "Person detail", "People"],
	["/brain/threads", "Threads content", "Threads"],
	["/brain/threads/thread-one", "Thread detail", "Threads"],
	["/brain/sources", "Sources content", "Sources"],
	["/brain/topics/topic-one", "Topic detail", null],
] as const)(
	"keeps every Brain destination available at %s",
	(path, heading, active) => {
		renderBrain(path);
		expect(screen.getByRole("heading", { name: heading })).toBeVisible();
		const navigation = within(
			screen.getByRole("navigation", { name: "Brain" }),
		);
		expect(navigation.getAllByRole("link")).toHaveLength(4);
		for (const label of ["Review", "People", "Threads", "Sources"]) {
			const link = navigation.getByRole("link", { name: label });
			if (label === active)
				expect(link).toHaveAttribute("aria-current", "page");
			else expect(link).not.toHaveAttribute("aria-current");
		}
	},
);

it("opens a Brain directory by keyboard from a nested detail route", async () => {
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
