import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useWorkChanged,
} from "@/features/collaboration/state/collaboration-session.context";
import { TopicWorkList } from "./topic-work-list";

/** A work item as WorkListMyWork returns it. */
const workItem = (id: string, extra: Record<string, unknown> = {}) => ({
	id,
	title: `Item ${id}`,
	state: "active",
	status: "active",
	mine: true,
	openSteps: [],
	...extra,
});

/** A date as the list shows it, in whatever locale the tests run in. */
const shown = (iso: string) =>
	new Date(iso).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});

// one actions object, since the read reruns when it changes
const insight = vi.hoisted(() => ({
	open: [] as Record<string, unknown>[],
	loose: [] as Record<string, unknown>[],
	done: [] as Record<string, unknown>[],
	failure: "",
	isPending: false,
	actions: {
		run: vi.fn(async (_statement: string) => {
			if (insight.isPending) return new Promise<never>(() => undefined);
			if (insight.failure)
				return {
					pixelReturn: [
						{ output: insight.failure, operationType: ["ERROR"] },
						{ output: {}, operationType: ["OPERATION"] },
					],
				};
			return {
				pixelReturn: [
					{
						output: {
							selfId: "me",
							workItems: insight.open,
							looseSteps: insight.loose,
						},
						operationType: ["OPERATION"],
					},
					{
						output: { workItems: insight.done },
						operationType: ["OPERATION"],
					},
				],
			};
		}),
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

beforeEach(() => {
	insight.open = [];
	insight.loose = [];
	insight.done = [];
	insight.failure = "";
	insight.isPending = false;
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const renderList = () =>
	render(
		<MemoryRouter>
			<TopicWorkList topicId="topic-1" />
		</MemoryRouter>,
	);

it("groups the topic's work, counts each group, and shows each item's next step, who it waits on since when, and its steps", async () => {
	insight.open = [
		workItem("a", {
			openSteps: [
				{
					id: "s1",
					text: "Draft the agenda",
					status: "open",
					threadId: "thread-1",
				},
				{
					id: "s2",
					text: "Send the policy",
					status: "open",
					kind: "waiting_on",
					assigneeId: "priya",
					assigneeName: "Shah, Priya",
					createdAt: "2026-10-30T12:00:00",
				},
			],
		}),
		workItem("b", {
			openSteps: [
				{
					id: "s3",
					text: "Check the freeze dates",
					status: "open",
					kind: "waiting_on",
					assigneeId: "priya",
				},
			],
		}),
		workItem("c", { mine: false, openSteps: [] }),
		workItem("d", { state: "proposed" }),
	];
	insight.done = [
		workItem("e", { status: "done", closedAt: "2026-11-10T12:00:00" }),
		workItem("f", { status: "dropped", closedAt: "2026-11-11T12:00:00" }),
	];
	renderList();

	const yours = await screen.findByRole("region", { name: "Yours to Do" });
	const waiting = screen.getByRole("region", { name: "Waiting on Others" });
	const done = screen.getByRole("region", { name: "Recently Done" });
	expect(within(yours).getByText("1")).toBeInTheDocument();
	expect(within(waiting).getByText("2")).toBeInTheDocument();
	expect(within(done).getByText("1")).toBeInTheDocument();

	expect(within(yours).getByRole("link", { name: "Item a" })).toHaveAttribute(
		"href",
		"/work/item/a",
	);
	expect(yours).toHaveTextContent("Next: Draft the agenda");
	expect(
		within(yours).getByRole("link", { name: "Draft the agenda" }),
	).toHaveAttribute("href", "/thread/thread-1");
	expect(waiting).toHaveTextContent(
		`Waiting on Priya Shah since ${shown("2026-10-30T12:00:00")}`,
	);
	expect(
		within(waiting).queryByRole("link", { name: "Check the freeze dates" }),
	).toBeNull();
	expect(done).toHaveTextContent(`Done ${shown("2026-11-10T12:00:00")}`);

	// not the owner's work, still in review, or dropped rather than done
	expect(screen.queryByRole("link", { name: "Item c" })).toBeNull();
	expect(screen.queryByRole("link", { name: "Item d" })).toBeNull();
	expect(screen.queryByRole("link", { name: "Item f" })).toBeNull();
});

it("asks for the topic's open work and its finished work, and nothing else", async () => {
	insight.open = [workItem("a")];
	renderList();
	await screen
		.findByRole("region", { name: "Waiting on Others" })
		.catch(() => undefined);
	const [statement] = insight.actions.run.mock.calls[0];
	expect(statement.match(/WorkListMyWork/g)).toHaveLength(2);
	expect(statement.match(/topic-1/g)).toHaveLength(2);
	expect(statement.match(/done/g)).toHaveLength(1);
	// the assistant's own single steps come with the open read, as on the Work page
	expect(statement.match(/includeSuggested/g)).toHaveLength(1);
});

/** A due day as the server stores it, and as the list shows it. */
const dueOn = (day: string) => `${day}T12:00:00.000Z`;
const shownDay = (day: string) =>
	new Date(`${day}T00:00`).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});

it("lists the steps under the topic that belong to no work item, each linking to its thread, with when it is due and since when", async () => {
	insight.loose = [
		{
			id: "l1",
			text: "Confirm the venue",
			status: "open",
			threadId: "thread-7",
			due: dueOn("2099-01-15"),
			createdAt: "2026-10-30T12:00:00",
		},
		{ id: "l2", text: "Book the caterer", status: "open" },
	];
	renderList();
	const single = await screen.findByRole("region", { name: "Single Steps" });
	await userEvent.click(
		within(single).getByRole("button", { name: /Single Steps/ }),
	);
	expect(within(single).getByText("2")).toBeInTheDocument();
	expect(
		within(single).getByRole("link", { name: "Confirm the venue" }),
	).toHaveAttribute("href", "/thread/thread-7");
	expect(single).toHaveTextContent(
		`Due ${shownDay("2099-01-15")} · Since ${shown("2026-10-30T12:00:00")}`,
	);
	expect(within(single).getByText("Book the caterer")).toBeVisible();
	expect(
		within(single).queryByRole("link", { name: "Book the caterer" }),
	).toBeNull();
	expect(screen.queryByText("No work on this topic yet.")).toBeNull();
	expect(screen.queryByRole("region", { name: "Yours to Do" })).toBeNull();
});

it("puts single steps after Yours to Do and before the groups for others", async () => {
	insight.open = [workItem("a", { openSteps: [yourStep] })];
	insight.loose = [{ id: "l1", text: "Confirm the venue", status: "open" }];
	insight.done = [
		workItem("e", { status: "done", closedAt: "2026-11-10T12:00:00" }),
	];
	renderList();
	await screen.findByRole("region", { name: "Single Steps" });
	const titles = screen
		.getAllByRole("region")
		.map((region) => region.getAttribute("aria-label"));
	expect(titles).toEqual(["Yours to Do", "Single Steps", "Recently Done"]);
});

it("titles every group with a level 3 heading, so a screen reader can move between them", async () => {
	insight.open = [workItem("a", { openSteps: [...bothKinds] })];
	insight.loose = [{ id: "l1", text: "Confirm the venue", status: "open" }];
	insight.done = [
		workItem("e", { status: "done", closedAt: "2026-11-10T12:00:00" }),
	];
	renderList();
	await screen.findByRole("region", { name: "Single Steps" });
	const headings = screen.getAllByRole("heading", { level: 3 });
	const titles = [
		"Yours to Do",
		"Single Steps",
		"Waiting on Others",
		"Recently Done",
	];
	expect(headings).toHaveLength(titles.length);
	headings.forEach((heading, index) => {
		expect(heading).toHaveTextContent(new RegExp(`^${titles[index]}`));
		expect(heading.closest("section")).toHaveAccessibleName(titles[index]);
	});
});

it("folds Single Steps away at first, still showing how many there are, and opens and closes it from the keyboard", async () => {
	insight.loose = [
		{ id: "l1", text: "Confirm the venue", status: "open" },
		{ id: "l2", text: "Book the caterer", status: "open" },
	];
	renderList();
	const toggle = await screen.findByRole("button", { name: /Single Steps/ });
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(toggle).toHaveTextContent("2");
	expect(screen.queryByText("Confirm the venue")).toBeNull();

	toggle.focus();
	await userEvent.keyboard("{Enter}");
	expect(toggle).toHaveAttribute("aria-expanded", "true");
	expect(screen.getByText("Confirm the venue")).toBeVisible();
	expect(screen.getByText("Book the caterer")).toBeVisible();

	await userEvent.keyboard(" ");
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(screen.queryByText("Confirm the venue")).toBeNull();
});

it("shows no Single Steps group when the topic has none", async () => {
	insight.open = [workItem("a", { openSteps: [yourStep] })];
	renderList();
	await screen.findByRole("region", { name: "Yours to Do" });
	expect(screen.queryByRole("region", { name: "Single Steps" })).toBeNull();
});

it("shows an item's due date on its card, in the warning colour when it is close, and not on a finished item", async () => {
	insight.open = [
		workItem("far", { due: dueOn("2099-01-15"), openSteps: [yourStep] }),
		workItem("late", { due: dueOn("2020-02-20"), openSteps: [yourStep] }),
		workItem("none", { openSteps: [yourStep] }),
	];
	insight.done = [
		workItem("fin", {
			status: "done",
			closedAt: "2026-11-10T12:00:00",
			due: dueOn("2099-01-15"),
		}),
	];
	renderList();
	const yours = await screen.findByRole("region", { name: "Yours to Do" });
	const far = within(yours).getByText(`Due ${shownDay("2099-01-15")}`);
	const late = within(yours).getByText(`Due ${shownDay("2020-02-20")}`);
	expect(far).not.toHaveClass("text-destructive");
	expect(late).toHaveClass("text-destructive");
	expect(within(yours).getAllByText(/^Due /)).toHaveLength(2);
	const done = screen.getByRole("region", { name: "Recently Done" });
	expect(within(done).queryByText(/^Due /)).toBeNull();
});

it("says so when the topic has no work", async () => {
	renderList();
	expect(
		await screen.findByText("No work on this topic yet."),
	).toBeInTheDocument();
});

it("shows a loading placeholder until the work arrives", () => {
	insight.isPending = true;
	renderList();
	expect(screen.getByRole("status")).toHaveTextContent("Loading topic work");
});

it("shows the error when the work cannot be read", async () => {
	insight.failure = "Could not read the topic's work";
	renderList();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Could not read the topic's work",
	);
});

/** The list beneath the session, with a button standing in for another view (the Task tab) that changed work. */
function renderWithWorkSignal() {
	function WorkChanger() {
		const { markWorkChanged } = useWorkChanged();
		return (
			<button type="button" onClick={() => markWorkChanged()}>
				Work changed elsewhere
			</button>
		);
	}
	const user = userEvent.setup();
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter>
				<WorkChanger />
				<TopicWorkList topicId="topic-1" />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	return user;
}

const yourStep = { id: "s1", text: "Draft the agenda", status: "open" };

it("reads the topic's work again when work changes elsewhere, so a finished item moves to Recently Done", async () => {
	insight.open = [workItem("a", { openSteps: [yourStep] })];
	const user = renderWithWorkSignal();
	expect(
		await screen.findByRole("region", { name: "Yours to Do" }),
	).toBeInTheDocument();
	expect(screen.queryByRole("region", { name: "Recently Done" })).toBeNull();
	expect(insight.actions.run).toHaveBeenCalledTimes(1);

	// the item is marked done in the Task tab
	insight.open = [];
	insight.done = [
		workItem("a", { status: "done", closedAt: "2026-11-19T12:00:00" }),
	];
	await user.click(
		screen.getByRole("button", { name: "Work changed elsewhere" }),
	);

	const done = await screen.findByRole("region", { name: "Recently Done" });
	expect(within(done).getByRole("link", { name: "Item a" })).toBeVisible();
	expect(screen.queryByRole("region", { name: "Yours to Do" })).toBeNull();
	expect(insight.actions.run).toHaveBeenCalledTimes(2);
});

it("keeps the list on screen while it reads again, and when that read fails", async () => {
	insight.open = [workItem("a", { openSteps: [yourStep] })];
	const user = renderWithWorkSignal();
	await screen.findByRole("region", { name: "Yours to Do" });

	// a slow re-read: no loading placeholder in place of the list
	insight.isPending = true;
	await user.click(
		screen.getByRole("button", { name: "Work changed elsewhere" }),
	);
	expect(insight.actions.run).toHaveBeenCalledTimes(2);
	expect(screen.getByRole("region", { name: "Yours to Do" })).toBeVisible();
	expect(screen.queryByRole("status")).toBeNull();

	// a failed re-read: the list stays and no error replaces it
	insight.isPending = false;
	insight.failure = "Could not read the topic's work";
	await user.click(
		screen.getByRole("button", { name: "Work changed elsewhere" }),
	);
	await vi.waitFor(() =>
		expect(insight.actions.run).toHaveBeenCalledTimes(3),
	);
	expect(screen.getByRole("region", { name: "Yours to Do" })).toBeVisible();
	expect(screen.queryByRole("alert")).toBeNull();
});

it("says how many items are done in all when Recently Done shows only the latest few", async () => {
	insight.done = Array.from({ length: 7 }, (_, i) =>
		workItem(`d${i}`, {
			status: "done",
			closedAt: `2026-11-0${i + 1}T12:00:00`,
		}),
	);
	renderList();
	const done = await screen.findByRole("region", { name: "Recently Done" });
	expect(within(done).getAllByRole("link")).toHaveLength(5);
	expect(within(done).getByText("5 of 7")).toBeInTheDocument();
	expect(within(done).getByRole("link", { name: "Item d6" })).toBeVisible();
	expect(within(done).queryByRole("link", { name: "Item d0" })).toBeNull();
});

it("shows a plain count when Recently Done is not cut", async () => {
	insight.done = [
		workItem("e", { status: "done", closedAt: "2026-11-10T12:00:00" }),
		workItem("f", { status: "done", closedAt: "2026-11-11T12:00:00" }),
	];
	renderList();
	const done = await screen.findByRole("region", { name: "Recently Done" });
	expect(within(done).getByText("2")).toBeInTheDocument();
	expect(within(done).queryByText(/ of /)).toBeNull();
});

const bothKinds = [
	{ id: "m", text: "Draft the agenda", status: "open" },
	{
		id: "o",
		text: "Send the policy",
		status: "open",
		kind: "waiting_on",
		assigneeId: "priya",
		assigneeName: "Shah, Priya",
		createdAt: "2026-10-30T12:00:00",
	},
];

it("lists an item with steps of the owner's and steps owed by others in both groups, each card saying only what belongs to its group", async () => {
	insight.open = [workItem("both", { openSteps: bothKinds })];
	renderList();
	const yours = await screen.findByRole("region", { name: "Yours to Do" });
	const waiting = screen.getByRole("region", { name: "Waiting on Others" });

	// the one item is in both groups, so each group counts it once
	expect(
		within(yours).getByRole("link", { name: "Item both" }),
	).toBeVisible();
	expect(
		within(waiting).getByRole("link", { name: "Item both" }),
	).toBeVisible();

	// yours: the owner's next step and step, nothing owed by anyone else
	expect(yours).toHaveTextContent("Next: Draft the agenda");
	expect(
		within(yours).getByRole("list", { name: "Your Steps for Item both" }),
	).toHaveTextContent("Draft the agenda");
	expect(within(yours).queryByText("Send the policy")).toBeNull();
	expect(within(yours).queryByText(/Waiting on/)).toBeNull();

	// waiting: who it waits on and their step, no next step of the owner's
	expect(waiting).toHaveTextContent(
		`Waiting on Priya Shah since ${shown("2026-10-30T12:00:00")}`,
	);
	expect(
		within(waiting).getByRole("list", {
			name: "Owed by Others for Item both",
		}),
	).toHaveTextContent("Send the policy");
	expect(within(waiting).queryByText("Draft the agenda")).toBeNull();
	expect(within(waiting).queryByText(/^Next:/)).toBeNull();

	// across the two cards every step is listed exactly once
	expect(screen.getAllByText("Draft the agenda")).toHaveLength(2); // the next-step line and the step
	expect(screen.getAllByText("Send the policy")).toHaveLength(1);
});

it("keeps a finished item's card whole: its next step, who it waited on, and all its steps", async () => {
	insight.done = [
		workItem("fin", {
			status: "done",
			closedAt: "2026-11-10T12:00:00",
			openSteps: bothKinds,
		}),
	];
	renderList();
	const done = await screen.findByRole("region", { name: "Recently Done" });
	expect(done).toHaveTextContent("Next: Draft the agenda");
	expect(done).toHaveTextContent("Waiting on Priya Shah since");
	expect(
		within(done).getByRole("list", { name: "Open Steps for Item fin" }),
	).toHaveTextContent("Send the policy");
});

it("has nothing to edit: it lists work and does not complete steps", async () => {
	insight.open = [
		workItem("a", {
			openSteps: [{ id: "s1", text: "Draft the agenda", status: "open" }],
		}),
	];
	renderList();
	await screen.findByRole("region", { name: "Yours to Do" });
	expect(screen.queryByRole("button")).toBeNull();
	expect(screen.queryByRole("checkbox")).toBeNull();
});
