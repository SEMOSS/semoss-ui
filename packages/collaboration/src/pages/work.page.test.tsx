import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { WorkPage } from "./work.page";

vi.mock("@/features/collaboration/components/topic-work", () => ({
	TopicWork: ({ topicId }: { topicId: string }) => <h1>Topic {topicId}</h1>,
}));
vi.mock("@/features/collaboration/components/work-topics", () => ({
	WorkTopics: () => <h1>My topics</h1>,
}));
vi.mock("@/features/collaboration/components/work-feed", () => ({
	WorkFeed: (props: {
		initialFilter: string;
		topicId?: string;
		search?: string;
	}) => <output aria-label="Status view">{JSON.stringify(props)}</output>,
}));
afterEach(cleanup);

/** Exercise compatibility redirects independently of the topic workspace's own UI tests. */
function renderWork(path: string) {
	const paths = [
		"/for-you",
		"/tasks",
		"/tasks/all",
		"/tasks/topics",
		"/tasks/topic/:topicId",
		"/tasks/waiting",
		"/tasks/done",
		"/work",
		"/work/all",
		"/work/topics",
		"/work/topic/:topicId",
		"/work/waiting",
		"/work/done",
	];
	const router = createMemoryRouter(
		paths.map((path) => ({ path, Component: WorkPage })),
		{ initialEntries: [path] },
	);
	render(<RouterProvider router={router} />);
	return router;
}

it.each(["/for-you", "/tasks", "/tasks/", "/tasks/all", "/work", "/work/all"])(
	"redirects %s to topics and keeps applicable query filters",
	async (path) => {
		const router = renderWork(`${path}?q=launch#saved`);
		await screen.findByRole("heading", { name: "My topics" });
		expect(router.state.location).toMatchObject({
			pathname: "/tasks/topics",
			search: "?q=launch",
			hash: "#saved",
		});
	},
);

it.each(["/for-you", "/tasks", "/work/all"])(
	"opens the selected topic from %s",
	async (path) => {
		const router = renderWork(`${path}?topic=topic%20one&q=launch#saved`);
		await screen.findByRole("heading", { name: "Topic topic one" });
		expect(router.state.location).toMatchObject({
			pathname: "/tasks/topic/topic%20one",
			search: "?q=launch",
			hash: "#saved",
		});
	},
);

it.each(["/tasks/topic/alpha", "/work/topic/alpha"])(
	"keeps the topic workspace at %s",
	(path) => {
		renderWork(path);
		expect(
			screen.getByRole("heading", { name: "Topic alpha" }),
		).toBeVisible();
	},
);

it.each(["waiting", "done"])(
	"retains %s bookmarks and topic/search filters",
	async (status) => {
		const router = renderWork(
			`/work/all?status=${status}&topic=alpha&q=launch#saved`,
		);
		await screen.findByRole("status", { name: "Status view" });
		expect(router.state.location).toMatchObject({
			pathname: `/tasks/${status}`,
			search: "?topic=alpha&q=launch",
			hash: "#saved",
		});
		expect(screen.getByRole("status")).toHaveTextContent(
			JSON.stringify({
				initialFilter: status,
				topicId: "alpha",
				search: "launch",
			}),
		);
	},
);

it("lets explicit status routes take precedence over a stale status query", async () => {
	const router = renderWork("/work/waiting?status=done&topic=alpha");
	await screen.findByRole("status");
	expect(router.state.location.pathname).toBe("/tasks/waiting");
	expect(screen.getByRole("status")).toHaveTextContent(
		'"initialFilter":"waiting"',
	);
});
