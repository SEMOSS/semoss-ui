import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { pixel } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { WorkItems } from "./work-items-list";

// one actions object, since the list's load reruns when it changes
const insight = vi.hoisted(() => ({
	actions: {
		run: vi.fn(async (statement: string) => ({
			pixelReturn: [
				{
					output: statement.startsWith("WorkListMyWork")
						? {
								selfId: "me",
								workItems: ["a", "b", "c"].map((id) => ({
									id,
									title: `Item ${id}`,
									state: "active",
									mine: true,
									openSteps: [],
								})),
							}
						: true,
					operationType: ["OPERATION"],
				},
			],
		})),
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

vi.mock("./work-item-details", () => ({
	WorkItemDetails: ({ taskId }: { taskId: string }) => (
		<section aria-label={`Details for ${taskId}`} />
	),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

async function renderWork() {
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter>
				<WorkItems />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	await screen.findByRole("button", { name: "Item a" });
}

/** The list row that holds an item's title. */
function row(title: string): HTMLElement {
	const item = screen.getByRole("button", { name: title }).closest("li");
	if (!item) throw new Error(`No row for ${title}`);
	return item;
}

const reorders = () =>
	insight.actions.run.mock.calls
		.map(([statement]) => statement)
		.filter((statement) => statement.startsWith("WorkReorderItems"));

it("saves a reorder when the drag ends without a drop on a row", async () => {
	await renderWork();
	fireEvent.dragStart(row("Item a"));
	fireEvent.dragOver(row("Item c"));
	// released past the list: no row gets the drop, only the dragged row hears the end
	fireEvent.dragEnd(row("Item a"));
	await waitFor(() =>
		expect(reorders()).toEqual([
			pixel("WorkReorderItems", { taskIds: ["b", "c", "a"] }),
		]),
	);
});

it("saves a drop on a row once, and a drag that moved nothing not at all", async () => {
	await renderWork();
	fireEvent.dragStart(row("Item a"));
	fireEvent.dragEnd(row("Item a"));
	fireEvent.dragStart(row("Item a"));
	fireEvent.dragOver(row("Item b"));
	fireEvent.drop(row("Item a"));
	fireEvent.dragEnd(row("Item a"));
	await waitFor(() =>
		expect(reorders()).toEqual([
			pixel("WorkReorderItems", { taskIds: ["b", "a", "c"] }),
		]),
	);
});

it("keeps expanded details with their work item after a reorder", async () => {
	await renderWork();
	const title = screen.getByRole("button", { name: "Item a" });
	expect(title).toHaveAttribute("aria-expanded", "false");
	fireEvent.click(title);
	expect(title).toHaveAttribute("aria-expanded", "true");
	expect(screen.getByRole("region", { name: "Details for a" })).toBeVisible();
	fireEvent.dragStart(row("Item a"));
	fireEvent.dragOver(row("Item c"));
	fireEvent.dragEnd(row("Item a"));
	await waitFor(() => expect(reorders()).toHaveLength(1));
	expect(screen.getByRole("button", { name: "Item a" })).toHaveAttribute(
		"aria-expanded",
		"true",
	);
	expect(screen.getByRole("button", { name: "Item b" })).toHaveAttribute(
		"aria-expanded",
		"false",
	);
	expect(screen.getByRole("region", { name: "Details for a" })).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Item a" }));
	expect(screen.queryByRole("region", { name: "Details for a" })).toBeNull();
});
