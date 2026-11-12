import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { pixel } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { WorkItems } from "./work-items-list";

/** A work item as WorkListMyWork returns it. */
const workItem = (id: string, extra: Record<string, unknown> = {}) => ({
	id,
	title: `Item ${id}`,
	state: "active",
	mine: true,
	openSteps: [],
	...extra,
});

// one actions object, since the list's load reruns when it changes
const insight = vi.hoisted(() => ({
	workItems: [] as Record<string, unknown>[],
	actions: {
		run: vi.fn(async (statement: string) => ({
			pixelReturn: [
				{
					output: statement.startsWith("WorkListMyWork")
						? { selfId: "me", workItems: insight.workItems }
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

beforeAll(() => {
	// JSDOM does not provide the pointer-capture APIs used by the shared Select.
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

beforeEach(() => {
	insight.workItems = ["a", "b", "c"].map((id) => workItem(id));
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

async function renderWork(review = false) {
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter>
				<WorkItems review={review} />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	return within(
		await screen.findByRole("list", {
			name: review ? "New work items" : "Your work items",
		}),
	);
}

/** The titles in the owner's list, top to bottom. */
const titles = () =>
	within(screen.getByRole("list", { name: "Your work items" }))
		.getAllByRole("listitem")
		.map((item) => within(item).getAllByRole("link")[0].textContent);

/** The list row that holds an item's title. */
function row(title: string): HTMLElement {
	const item = within(screen.getByRole("list", { name: "Your work items" }))
		.getByRole("link", { name: title })
		.closest("li");
	if (!item) throw new Error(`No row for ${title}`);
	return item;
}

const reorders = () =>
	insight.actions.run.mock.calls
		.map(([statement]) => statement)
		.filter((statement) => statement.startsWith("WorkReorderItems"));

/** One step the owner does, one somebody else owes, and an item with neither. */
const mixedWork = () => [
	workItem("a", {
		openSteps: [{ id: "s1", text: "Draft the agenda", status: "open" }],
	}),
	workItem("b", {
		openSteps: [
			{
				id: "s2",
				text: "Send the policy",
				status: "open",
				kind: "waiting_on",
				assigneeId: "priya",
				assigneeName: "Shah, Priya",
			},
		],
	}),
	workItem("c"),
];

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

it("moves a row from its menu without dragging, and not past the end of the list", async () => {
	const user = userEvent.setup();
	await renderWork();
	await user.click(
		screen.getByRole("button", { name: "More actions for Item a" }),
	);
	expect(screen.getByRole("menuitem", { name: "Move up" })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
	expect(screen.getByRole("menuitem", { name: "Open room" })).toHaveAttribute(
		"href",
		"/work/item/a",
	);
	await user.click(screen.getByRole("menuitem", { name: "Move down" }));
	await waitFor(() =>
		expect(reorders()).toEqual([
			pixel("WorkReorderItems", { taskIds: ["b", "a", "c"] }),
		]),
	);
});

it("narrows the list to the owner's next steps or to what waits on someone, counted on each tab", async () => {
	insight.workItems = mixedWork();
	const user = userEvent.setup();
	const list = await renderWork();
	expect(titles()).toEqual(["Item a", "Item b", "Item c"]);
	expect(list.getByText("Next:")).toBeVisible();
	expect(list.getByText("Waiting on Priya Shah:")).toBeVisible();
	expect(list.getByText("1 dependency")).toBeVisible();
	expect(list.getByText("No open steps")).toBeVisible();

	await user.click(screen.getByRole("tab", { name: "Next steps 1" }));
	expect(titles()).toEqual(["Item a"]);
	await user.click(screen.getByRole("tab", { name: "Waiting 1" }));
	expect(titles()).toEqual(["Item b"]);
	await user.click(screen.getByRole("tab", { name: "All work 3" }));
	expect(titles()).toEqual(["Item a", "Item b", "Item c"]);
});

it("lists each handoff with its person, item and ask, and opens the Waiting view from the card", async () => {
	insight.workItems = mixedWork();
	const user = userEvent.setup();
	await renderWork();
	const card = within(screen.getByRole("region", { name: "Waiting on" }));
	expect(card.getByText("Priya Shah")).toBeVisible();
	expect(card.getByRole("link", { name: "Item b" })).toHaveAttribute(
		"href",
		"/work/item/b",
	);
	expect(card.getByText("Send the policy")).toBeVisible();

	await user.click(card.getByRole("button", { name: "View waiting items" }));
	const tab = screen.getByRole("tab", { name: "Waiting 1" });
	expect(tab).toHaveAttribute("aria-selected", "true");
	expect(tab).toHaveFocus();
	expect(titles()).toEqual(["Item b"]);
});

it("says so when nobody owes the owner a step", async () => {
	await renderWork();
	const card = within(screen.getByRole("region", { name: "Waiting on" }));
	expect(card.getByText("Nobody owes you a step right now.")).toBeVisible();
	expect(
		card.queryByRole("button", { name: "View waiting items" }),
	).not.toBeInTheDocument();
});

it("reviews new items: opens them all at once, filters by topic, and counts the handled ones", async () => {
	insight.workItems = [
		workItem("n1", {
			state: "proposed",
			topics: [{ id: "alpha", name: "Alpha", primary: true }],
		}),
		workItem("n2", {
			state: "proposed",
			topics: [{ id: "beta", name: "Beta", primary: true }],
		}),
		workItem("n3", { state: "proposed", mine: false }),
	];
	const user = userEvent.setup();
	const list = await renderWork(true);
	const progress = () =>
		screen.getByRole("progressbar", { name: "Items reviewed" });
	expect(list.getAllByRole("listitem")).toHaveLength(3);
	expect(list.getByText("None assigned to you")).toBeVisible();
	expect(progress()).toHaveAttribute("aria-valuetext", "0 of 3");

	await user.click(screen.getByRole("button", { name: "Expand all" }));
	for (const title of ["Item n1", "Item n2", "Item n3"])
		expect(list.getByRole("button", { name: title })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
	await user.click(screen.getByRole("button", { name: "Collapse all" }));
	expect(list.getByRole("button", { name: "Item n1" })).toHaveAttribute(
		"aria-expanded",
		"false",
	);

	await user.click(screen.getByRole("combobox", { name: "Filter by topic" }));
	await user.click(screen.getByRole("option", { name: "Beta" }));
	expect(list.getAllByRole("listitem")).toHaveLength(1);

	// the server no longer lists an item the owner accepted
	insight.workItems = insight.workItems.filter((item) => item.id !== "n2");
	await user.click(list.getByRole("button", { name: "Add to my work" }));
	// its topic has nothing left, so the list goes back to every topic
	await waitFor(() => expect(list.getAllByRole("listitem")).toHaveLength(2));
	expect(insight.actions.run).toHaveBeenCalledWith(
		pixel("WorkSaveWork", { taskId: "n2", accept: true }),
	);
	expect(progress()).toHaveAttribute("aria-valuetext", "1 of 3");
	expect(screen.getByText("1 of 3")).toBeVisible();
});

it("keeps the count of what was reviewed once nothing is left", async () => {
	insight.workItems = [workItem("n1", { state: "proposed" })];
	const user = userEvent.setup();
	const list = await renderWork(true);
	insight.workItems = [];
	await user.click(list.getByRole("button", { name: "Dismiss" }));
	expect(await screen.findByText("Nothing new to review.")).toBeVisible();
	expect(
		screen.getByRole("progressbar", { name: "Items reviewed" }),
	).toHaveAttribute("aria-valuetext", "1 of 1");
});
