import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { pixel } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { WorkItems } from "./work-items-list";

function roomsFor(itemId: string) {
	if (itemId !== "a") return [];
	return [
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
}

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
									rooms: roomsFor(id),
									roomId:
										id === "b" ? "legacy-room" : undefined,
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

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

beforeAll(() => {
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.setPointerCapture = () => undefined;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

function LocationProbe() {
	const { pathname, search } = useLocation();
	return <output data-testid="current-location">{pathname + search}</output>;
}

async function renderWork() {
	const user = userEvent.setup();
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter>
				<WorkItems />
				<LocationProbe />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	await screen.findByRole("button", { name: "Item a" });
	return user;
}

it("offers a new item chat and lists every chat by name", async () => {
	const user = await renderWork();
	const itemRow = row("Item a");
	await user.click(
		within(itemRow).getByRole("button", { name: "More chats for Item a" }),
	);

	expect(
		await screen.findByRole("menuitem", { name: "New chat" }),
	).toBeInTheDocument();
	expect(
		screen.getByRole("menuitem", { name: "Newest chat" }),
	).toBeInTheDocument();
	expect(
		screen.getByRole("menuitem", { name: "Earlier chat" }),
	).toBeInTheDocument();
});

it("opens a new chat for the item from its chat menu", async () => {
	const user = await renderWork();
	const itemRow = row("Item a");
	await user.click(
		within(itemRow).getByRole("button", { name: "More chats for Item a" }),
	);
	await user.click(await screen.findByRole("menuitem", { name: "New chat" }));

	expect(screen.getByTestId("current-location")).toHaveTextContent(
		"/work/item/a",
	);
});

it("opens an earlier chat from the item chat menu", async () => {
	const user = await renderWork();
	const itemRow = row("Item a");
	await user.click(
		within(itemRow).getByRole("button", { name: "More chats for Item a" }),
	);
	await user.click(
		await screen.findByRole("menuitem", { name: "Earlier chat" }),
	);

	expect(screen.getByTestId("current-location")).toHaveTextContent(
		"/thread/room%3Aolder-room",
	);
});

it("merges one chat of an item into another of its chats", async () => {
	const user = await renderWork();
	const itemRow = row("Item a");
	await user.click(
		within(itemRow).getByRole("button", { name: "More chats for Item a" }),
	);
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

it("Open room navigates to the newest chat for an item with multiple rooms", async () => {
	const user = await renderWork();
	await user.click(
		within(row("Item a")).getByRole("button", { name: "Open room" }),
	);
	expect(screen.getByTestId("current-location")).toHaveTextContent(
		"/thread/room%3Anewest-room",
	);
});

it("Open room falls back to the legacy roomId when rooms is empty", async () => {
	const user = await renderWork();
	await user.click(
		within(row("Item b")).getByRole("button", { name: "Open room" }),
	);
	expect(screen.getByTestId("current-location")).toHaveTextContent(
		"/thread/room%3Alegacy-room",
	);
});
