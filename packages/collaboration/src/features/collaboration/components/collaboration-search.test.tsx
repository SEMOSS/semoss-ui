import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { CollaborationSearch } from "./collaboration-search";

const actions = vi.hoisted(() => ({}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions }),
}));

afterEach(cleanup);

function Location() {
	const location = useLocation();
	return <output aria-label="Current path">{location.pathname}</output>;
}

it("keeps a source-less task in search and opens its details without changing routes", async () => {
	const state = createInitialCollaborationState();
	const first = state.items[0];
	if (!first) throw new Error("Missing task fixture");
	state.items = [
		{
			...first,
			id: "solo",
			title: "Standalone launch task",
			threadId: "",
			roomId: undefined,
			topicIds: [],
			status: "open",
		},
	];
	const user = userEvent.setup();
	render(
		<MemoryRouter initialEntries={["/"]}>
			<CollaborationSessionProvider initialState={state}>
				<main>
					<CollaborationSearch />
					<Location />
				</main>
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
	const trigger = screen.getByRole("button", {
		name: "Search your workspace",
	});
	await user.click(trigger);
	await user.type(
		screen.getByRole("combobox", { name: "Search" }),
		"Standalone launch",
	);
	await user.click(
		screen.getByRole("option", { name: /Standalone launch task/ }),
	);
	expect(
		screen.getByRole("dialog", { name: "Standalone launch task" }),
	).toBeVisible();
	expect(
		screen.getByText("This task has no linked source conversation."),
	).toBeVisible();
	expect(screen.getByLabelText("Current path")).toHaveTextContent("/");
	await user.click(screen.getByRole("button", { name: "Close review" }));
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
