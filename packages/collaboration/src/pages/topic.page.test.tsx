import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import {
	createMemoryRouter,
	matchRoutes,
	RouterProvider,
	useParams,
} from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { routes } from "./route-config";

vi.mock("@/features/collaboration/components/topic-detail", () => ({
	TopicDetail: () => {
		const { topicId } = useParams();
		const [draft, setDraft] = useState("");
		return (
			<>
				<h1>Topic {topicId}</h1>
				<input
					aria-label="Topic draft"
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
				/>
			</>
		);
	},
}));

afterEach(cleanup);

/** Exercises the production topic routes without authentication or live reads. */
function renderTopic(path: string) {
	const topicRoutes = [
		"/topics/client",
		"/work/topic/client",
		"/brain/topics/client",
	].map((entry) => {
		const route = matchRoutes(routes, entry)?.at(-1)?.route;
		if (!route) throw new Error(`Missing topic route: ${entry}`);
		return route;
	});
	const router = createMemoryRouter(
		[
			{ path: "/previous", element: <h1>Previous page</h1> },
			...topicRoutes,
		],
		{ initialEntries: ["/previous", path] },
	);
	render(<RouterProvider router={router} />);
	return router;
}

it.each(["/work/topic", "/brain/topics"])(
	"redirects %s links with their query and fragment without adding history",
	async (prefix) => {
		const router = renderTopic(`${prefix}/client%2Fone?view=actions#notes`);
		expect(
			await screen.findByRole("heading", { name: "Topic client/one" }),
		).toBeVisible();
		expect(router.state.location).toMatchObject({
			pathname: "/topics/client%2Fone",
			search: "?view=actions",
			hash: "#notes",
		});
		expect(
			screen.queryByRole("navigation", { name: "Brain" }),
		).not.toBeInTheDocument();
		await act(() => router.navigate(-1));
		expect(
			await screen.findByRole("heading", { name: "Previous page" }),
		).toBeVisible();
	},
);

it("starts fresh topic-local state when changing the canonical topic", async () => {
	const user = userEvent.setup();
	const router = renderTopic("/topics/first");
	await user.type(
		await screen.findByRole("textbox", { name: "Topic draft" }),
		"Draft",
	);
	await act(() => router.navigate("/topics/second"));
	expect(screen.getByRole("heading", { name: "Topic second" })).toBeVisible();
	expect(screen.getByRole("textbox", { name: "Topic draft" })).toHaveValue(
		"",
	);
});
