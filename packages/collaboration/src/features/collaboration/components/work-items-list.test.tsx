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
import { quietLabel, WorkItems } from "./work-items-list";

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
	looseSteps: [] as Record<string, unknown>[],
	totals: {} as Record<string, number>,
	done: [] as Record<string, unknown>[],
	// WorkGetWork results by task id
	works: {} as Record<string, Record<string, unknown>>,
	actions: {
		// one result per statement, as a batch gets
		run: vi.fn(async (statement: string) => ({
			pixelReturn: statement
				.split(");")
				.filter((part) => part.trim())
				.map((part) => ({
					output: part.startsWith("WorkListMyWork")
						? {
								selfId: "me",
								workItems: part.includes('status=["done"]')
									? insight.done
									: insight.workItems,
								looseSteps: insight.looseSteps,
								...insight.totals,
							}
						: part.startsWith("WorkGetWork")
							? (insight.works[
									/taskId=\["([^"]*)"\]/.exec(part)?.[1] ?? ""
								] ?? {})
							: true,
					operationType: ["OPERATION"],
				})),
		})),
	},
}));
const toastMock = vi.hoisted(() => vi.fn());
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	toast: toastMock,
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

beforeAll(() => {
	// JSDOM does not provide the pointer-capture APIs used by the shared Select.
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.setPointerCapture = () => undefined;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

beforeEach(() => {
	insight.workItems = ["a", "b", "c"].map((id) => workItem(id));
	insight.looseSteps = [];
	insight.totals = {};
	insight.done = [];
	insight.works = {};
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
	expect(card.getByRole("link", { name: "Send the policy" })).toHaveAttribute(
		"href",
		"/work/item/b",
	);
	expect(card.getByText("Item b")).toBeVisible();

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

it("closes an item from its row and offers to put it back", async () => {
	insight.workItems = groupedWork();
	const user = userEvent.setup();
	await renderWork();
	await user.click(
		screen.getByRole("button", { name: "More actions for Item d" }),
	);
	await user.click(screen.getByRole("menuitem", { name: "Mark done" }));
	const saves = () =>
		insight.actions.run.mock.calls
			.map(([statement]) => statement)
			.filter((statement) => statement.startsWith("WorkSaveWork"));
	await waitFor(() =>
		expect(saves()).toEqual([
			pixel("WorkSaveWork", { taskId: "d", status: "done" }),
		]),
	);
	await waitFor(() =>
		expect(toastMock).toHaveBeenCalledWith(
			'"Item d" marked done.',
			expect.anything(),
		),
	);
});

it("says how long an item has been quiet, only once it has been a while", () => {
	const now = new Date("2026-11-16T12:00:00Z").getTime();
	expect(quietLabel("2026-11-10 09:00:00", now)).toBeNull();
	expect(quietLabel("2026-10-20 09:00:00", now)).toBe("Quiet for 3 weeks");
	expect(quietLabel("2026-08-01 09:00:00", now)).toBe("Quiet for 3 months");
	expect(quietLabel(undefined, now)).toBeNull();
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

const ran = () =>
	insight.actions.run.mock.calls.map(([statement]) => statement);

it("shows single steps under Needs you and Also asked of you, with their topic and controls", async () => {
	insight.workItems = [];
	insight.looseSteps = [
		{ id: "l1", text: "Send Kira the deck", kind: "task", status: "open" },
		{
			id: "l2",
			text: "Read the memo",
			kind: "task",
			status: "open",
			inbox: "fyi",
		},
	];
	insight.totals = { workItemTotal: 0, looseStepTotal: 5 };
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter>
				<WorkItems />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	await userEvent.click(
		await screen.findByRole("button", { name: /^Single steps/ }),
	);
	const needs = within(
		await screen.findByRole("list", {
			name: "Single steps: Needs you",
		}),
	);
	expect(needs.getByText("Send Kira the deck")).toBeVisible();
	const aside = within(
		screen.getByRole("list", { name: "Single steps: Also asked of you" }),
	);
	expect(aside.getByText("Read the memo")).toBeVisible();
	expect(screen.getByText("Showing the first 2 of 5.")).toBeVisible();
	// the list asks for the assistant's own loose steps too
	expect(ran()).toContain(
		pixel("WorkListMyWork", { includeSuggested: true }),
	);
	await userEvent.click(
		needs.getByRole("button", { name: "Mark done: Send Kira the deck" }),
	);
	await waitFor(() =>
		expect(ran()).toContain(
			pixel("WorkUpdateStep", { stepId: "l1", status: "done" }),
		),
	);
});

it("offers Undo after a single step is taken off the list", async () => {
	insight.workItems = [];
	insight.looseSteps = [
		{ id: "l1", text: "Send Kira the deck", kind: "task", status: "open" },
	];
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter>
				<WorkItems />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	await userEvent.click(
		await screen.findByRole("button", { name: /^Single steps/ }),
	);
	await userEvent.click(
		await screen.findByRole("button", {
			name: "More for: Send Kira the deck",
		}),
	);
	await userEvent.click(screen.getByRole("menuitem", { name: "Not mine" }));
	await waitFor(() => expect(toastMock).toHaveBeenCalled());
	const options = toastMock.mock.calls[0][1] as {
		action: { onClick: () => void };
	};
	options.action.onClick();
	await waitFor(() =>
		expect(ran()).toContain(
			pixel("WorkUpdateStep", { stepId: "l1", status: "open", note: "" }),
		),
	);
});

it("adds every proposed item as one batch after a confirmation, and one topic's items", async () => {
	insight.workItems = [
		workItem("n1", {
			state: "proposed",
			topics: [{ id: "alpha", name: "Alpha", primary: true }],
		}),
		workItem("n2", {
			state: "proposed",
			topics: [{ id: "beta", name: "Beta", primary: true }],
		}),
		workItem("n3", {
			state: "proposed",
			topics: [{ id: "beta", name: "Beta", primary: true }],
		}),
	];
	const user = userEvent.setup();
	await renderWork(true);
	await user.click(screen.getByRole("combobox", { name: "Filter by topic" }));
	await user.click(screen.getByRole("option", { name: "Beta" }));
	await user.click(
		screen.getByRole("button", { name: "Add all in this topic" }),
	);
	expect(screen.getByText("Add 2 work items to your list?")).toBeVisible();
	// nothing is sent until the owner confirms
	expect(ran().some((s) => s.includes("accept"))).toBe(false);
	insight.workItems = insight.workItems.filter((i) => i.id === "n1");
	await user.click(screen.getByRole("button", { name: "Add to my work" }));
	await waitFor(() =>
		expect(ran()).toContain(
			`${pixel("WorkSaveWork", { taskId: "n2", accept: true })} ${pixel("WorkSaveWork", { taskId: "n3", accept: true })}`,
		),
	);
});

it("offers Undo after a new item is dismissed, which makes it active again", async () => {
	insight.workItems = [workItem("n1", { state: "proposed" })];
	const list = await renderWork(true);
	await userEvent.click(list.getByRole("button", { name: "Dismiss" }));
	await waitFor(() => expect(toastMock).toHaveBeenCalled());
	const options = toastMock.mock.calls[0][1] as {
		action: { onClick: () => void };
	};
	options.action.onClick();
	await waitFor(() =>
		expect(ran()).toContain(
			pixel("WorkSaveWork", { taskId: "n1", status: "active" }),
		),
	);
});

it("loads finished work only when opened, leaves out dismissed items, and reopens one", async () => {
	insight.done = [
		workItem("d1", { status: "done" }),
		workItem("d2", { status: "dropped" }),
	];
	await renderWork();
	expect(ran().some((s) => s.includes('status=["done"]'))).toBe(false);
	await userEvent.click(screen.getByRole("button", { name: "Done" }));
	const done = within(
		await screen.findByRole("list", { name: "Done work items" }),
	);
	expect(done.getByText("Item d1")).toBeVisible();
	expect(done.queryByText("Item d2")).toBeNull();
	await userEvent.click(done.getByRole("button", { name: "Reopen Item d1" }));
	await waitFor(() =>
		expect(ran()).toContain(
			pixel("WorkSaveWork", { taskId: "d1", status: "active" }),
		),
	);
});

const recent = () =>
	new Date(Date.now() - 86_400_000)
		.toISOString()
		.slice(0, 19)
		.replace("T", " ");

it("lists steps a message closed only when opened, and reopens one", async () => {
	insight.workItems = [
		workItem("w1", {
			stepCount: 2,
			updatedAt: recent(),
			openSteps: [{ id: "s0", text: "Still open", status: "open" }],
		}),
		workItem("w2", { stepCount: 1, updatedAt: "2020-01-01 00:00:00" }),
	];
	insight.works = {
		w1: {
			steps: [
				{
					id: "s1",
					text: "Send Kira the deck",
					status: "done",
					closedBy: "c-1",
					closedText: "Sent the deck over",
					closedSubject: "Deck for Friday",
				},
				{ id: "s2", text: "Mine", status: "done", closedBy: "owner" },
			],
		},
	};
	await renderWork();
	expect(ran().some((s) => s.startsWith("WorkGetWork"))).toBe(false);
	await userEvent.click(
		screen.getByRole("button", { name: "Closed for you" }),
	);
	const closed = within(
		await screen.findByRole("list", { name: "Steps closed for you" }),
	);
	expect(closed.getByText("Send Kira the deck")).toBeVisible();
	expect(closed.getByText(/Deck for Friday/)).toBeVisible();
	expect(closed.getByText("Sent the deck over")).toBeVisible();
	expect(closed.queryByText("Mine")).toBeNull();
	// the stale item is never read in full
	expect(ran()).not.toContain(pixel("WorkGetWork", { taskId: "w2" }));
	await userEvent.click(
		closed.getByRole("button", { name: "Reopen step Send Kira the deck" }),
	);
	await waitFor(() =>
		expect(ran()).toContain(
			pixel("WorkUpdateStep", { stepId: "s1", status: "open" }),
		),
	);
});

it("says so when no message closed a step", async () => {
	await renderWork();
	await userEvent.click(
		screen.getByRole("button", { name: "Closed for you" }),
	);
	expect(
		await screen.findByText(/No messages closed a step for you/),
	).toBeVisible();
});

const twoChats = [
	{
		id: "newest-room",
		title: "Newest chat",
		lastActivity: "2026-11-11T00:00:00Z",
	},
	{
		id: "older-room",
		title: "Earlier chat",
		lastActivity: "2026-11-10T00:00:00Z",
	},
];

/** Opens the row menu of an item. */
async function openMenu(
	user: ReturnType<typeof userEvent.setup>,
	title: string,
) {
	await user.click(
		screen.getByRole("button", { name: `More actions for ${title}` }),
	);
}

it("opens the newest chat from Open room and the title, and lists every chat and a new chat in the menu", async () => {
	insight.workItems = [workItem("a", { rooms: twoChats })];
	const user = userEvent.setup();
	await renderWork();
	expect(row("Item a")).toContainElement(
		screen.getByRole("link", { name: "Item a" }),
	);
	expect(screen.getByRole("link", { name: "Item a" })).toHaveAttribute(
		"href",
		"/thread/room%3Anewest-room",
	);

	await openMenu(user, "Item a");
	expect(screen.getByRole("menuitem", { name: "Open room" })).toHaveAttribute(
		"href",
		"/thread/room%3Anewest-room",
	);
	expect(screen.getByRole("menuitem", { name: "New chat" })).toHaveAttribute(
		"href",
		"/work/item/a",
	);
	expect(
		screen.getByRole("menuitem", { name: "Newest chat" }),
	).toHaveAttribute("href", "/thread/room%3Anewest-room");
	expect(
		screen.getByRole("menuitem", { name: "Earlier chat" }),
	).toHaveAttribute("href", "/thread/room%3Aolder-room");
	// the reorder items stay beside the chats
	expect(screen.getByRole("menuitem", { name: "Move down" })).toBeVisible();
});

it("opens the chat an item had before it could have several", async () => {
	insight.workItems = [workItem("a", { roomId: "legacy-room", rooms: [] })];
	const user = userEvent.setup();
	await renderWork();
	await openMenu(user, "Item a");
	expect(screen.getByRole("menuitem", { name: "Open room" })).toHaveAttribute(
		"href",
		"/thread/room%3Alegacy-room",
	);
	expect(screen.getByRole("menuitem", { name: "Chat 1" })).toHaveAttribute(
		"href",
		"/thread/room%3Alegacy-room",
	);
});

it("offers no new chat until an item has one, since its page already starts one", async () => {
	const user = userEvent.setup();
	await renderWork();
	await openMenu(user, "Item a");
	expect(screen.getByRole("menuitem", { name: "Open room" })).toHaveAttribute(
		"href",
		"/work/item/a",
	);
	expect(
		screen.queryByRole("menuitem", { name: "New chat" }),
	).not.toBeInTheDocument();
});

it("numbers chats without a title from the oldest, so a new chat does not rename the others", async () => {
	const chat = (id: string) => ({ id, lastActivity: "" });
	insight.workItems = [
		workItem("a", { rooms: [chat("r3"), chat("r2"), chat("r1")] }),
	];
	const user = userEvent.setup();
	await renderWork();
	await openMenu(user, "Item a");
	expect(screen.getByRole("menuitem", { name: "Chat 3" })).toHaveAttribute(
		"href",
		"/thread/room%3Ar3",
	);
	expect(screen.getByRole("menuitem", { name: "Chat 1" })).toHaveAttribute(
		"href",
		"/thread/room%3Ar1",
	);
});

it("gives a row someone else drives the chat menu, without the reorder items", async () => {
	insight.workItems = [
		workItem("a"),
		workItem("x", { mine: false, rooms: twoChats }),
	];
	const user = userEvent.setup();
	await renderWork();
	await user.click(
		screen.getByRole("button", { name: /other people are driving/ }),
	);
	await openMenu(user, "Item x");
	expect(screen.getByRole("menuitem", { name: "New chat" })).toHaveAttribute(
		"href",
		"/work/item/x",
	);
	expect(
		screen.queryByRole("menuitem", { name: "Move up" }),
	).not.toBeInTheDocument();
});

it("merges one chat of an item into another of its chats", async () => {
	insight.workItems = [workItem("a", { rooms: twoChats })];
	const user = userEvent.setup();
	await renderWork();
	await openMenu(user, "Item a");
	await user.click(
		await screen.findByRole("menuitem", { name: "Merge chats..." }),
	);

	await user.click(screen.getByRole("combobox", { name: "Chat to merge" }));
	await user.click(
		await screen.findByRole("option", { name: "Earlier chat" }),
	);
	await user.click(screen.getByRole("combobox", { name: "Merge into" }));
	await user.click(
		await screen.findByRole("option", { name: "Newest chat" }),
	);
	await user.click(screen.getByRole("button", { name: "Merge chats" }));

	await waitFor(() =>
		expect(insight.actions.run).toHaveBeenCalledWith(
			pixel("WorkMergeRooms", {
				taskId: "a",
				roomId: "older-room",
				intoRoomId: "newest-room",
			}),
		),
	);
});
