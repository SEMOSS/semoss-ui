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
import {
	CollaborationSessionProvider,
	useWorkChanged,
} from "../state/collaboration-session.context";
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

/** Titles in one of the two groups, top to bottom. */
const groupTitles = (name: string) =>
	within(screen.getByRole("list", { name }))
		.getAllByRole("listitem")
		.map((item) => within(item).getAllByRole("link")[0].textContent);

const listReads = () =>
	insight.actions.run.mock.calls.filter(([statement]) =>
		statement.startsWith("WorkListMyWork"),
	).length;

/** Two items that need the owner and two filed away, mixed in the owner's order. */
const groupedWork = () => [
	workItem("a"),
	workItem("b", { needsYou: false }),
	workItem("c", { needsYou: true }),
	workItem("d", { needsYou: false }),
];

it("puts items from filed-away conversations under 'Also asked of you', and counts both groups", async () => {
	insight.workItems = groupedWork();
	await renderWork();
	// an item with no needsYou (an older server) needs the owner
	expect(groupTitles("Your work items")).toEqual(["Item a", "Item c"]);
	expect(groupTitles("Also asked of you")).toEqual(["Item b", "Item d"]);
	const needs = within(screen.getByRole("region", { name: "Needs you" }));
	const also = within(
		screen.getByRole("region", { name: "Also asked of you" }),
	);
	expect(needs.getByRole("heading", { name: "Needs you" })).toBeVisible();
	expect(needs.getByText("2")).toBeVisible();
	expect(also.getByText("2")).toBeVisible();
	expect(
		also.getByText(
			"From conversations filed as for your information or waiting on someone else, or from people you have not worked with.",
		),
	).toBeVisible();
	// the items other people drive are not in either group
	expect(screen.queryByText("Nothing needs you right now.")).toBeNull();
});

it("says nothing needs the owner when every item was filed away, and hides an empty second group", async () => {
	insight.workItems = [workItem("a", { needsYou: false })];
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter>
				<WorkItems />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	expect(
		await screen.findByText("Nothing needs you right now."),
	).toBeVisible();
	expect(groupTitles("Also asked of you")).toEqual(["Item a"]);
	cleanup();
	insight.workItems = [workItem("a")];
	await renderWork();
	expect(
		screen.queryByRole("region", { name: "Also asked of you" }),
	).toBeNull();
});

it("narrows both groups by the chosen tab", async () => {
	insight.workItems = [
		workItem("a", {
			openSteps: [{ id: "s1", text: "Draft", status: "open" }],
		}),
		workItem("b", {
			needsYou: false,
			openSteps: [{ id: "s2", text: "Read it", status: "open" }],
		}),
		workItem("c", { needsYou: false }),
	];
	const user = userEvent.setup();
	await renderWork();
	await user.click(screen.getByRole("tab", { name: "Next steps 2" }));
	expect(groupTitles("Your work items")).toEqual(["Item a"]);
	expect(groupTitles("Also asked of you")).toEqual(["Item b"]);
});

it("moves a row inside its group and saves the order with every other item where it was", async () => {
	insight.workItems = groupedWork();
	const user = userEvent.setup();
	await renderWork();
	await user.click(
		screen.getByRole("button", { name: "More actions for Item d" }),
	);
	await user.click(screen.getByRole("menuitem", { name: "Move up" }));
	await waitFor(() =>
		expect(reorders()).toEqual([
			pixel("WorkReorderItems", { taskIds: ["a", "d", "b", "c"] }),
		]),
	);
	cleanup();
	// the top of a group has nowhere to go, even when the other group sits above it
	await renderWork();
	await user.click(
		screen.getByRole("button", { name: "More actions for Item b" }),
	);
	expect(screen.getByRole("menuitem", { name: "Move up" })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
});

it("reads the list again when another view changes work, but not for its own change", async () => {
	function Probe() {
		const { markWorkChanged } = useWorkChanged();
		return (
			<button type="button" onClick={() => markWorkChanged()}>
				Changed elsewhere
			</button>
		);
	}
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter>
				<Probe />
				<WorkItems />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	await screen.findByRole("list", { name: "Your work items" });
	expect(listReads()).toBe(1);
	insight.workItems = [workItem("z"), workItem("y")];
	await userEvent.click(
		screen.getByRole("button", { name: "Changed elsewhere" }),
	);
	await screen.findByRole("link", { name: "Item z" });
	expect(listReads()).toBe(2);
	// the list's own save reads once for itself, and does not read again for the signal it sent
	await userEvent.click(
		screen.getByRole("button", { name: "More actions for Item z" }),
	);
	await userEvent.click(screen.getByRole("menuitem", { name: "Move down" }));
	await waitFor(() => expect(listReads()).toBe(3));
	await new Promise((resolve) => setTimeout(resolve, 50));
	expect(listReads()).toBe(3);
});

it("does not move a row into the other group when it is dragged over one", async () => {
	insight.workItems = groupedWork();
	await renderWork();
	fireEvent.dragStart(row("Item a"));
	const other = within(
		screen.getByRole("list", { name: "Also asked of you" }),
	)
		.getByRole("link", { name: "Item b" })
		.closest("li");
	if (!other) throw new Error("No row for Item b");
	fireEvent.dragOver(other);
	fireEvent.dragEnd(row("Item a"));
	expect(groupTitles("Your work items")).toEqual(["Item a", "Item c"]);
	expect(groupTitles("Also asked of you")).toEqual(["Item b", "Item d"]);
	// the save, if there were one, goes out a moment after the drag ends
	await new Promise((resolve) => setTimeout(resolve, 50));
	expect(reorders()).toEqual([]);
});
