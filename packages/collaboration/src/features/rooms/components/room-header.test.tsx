import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { roomWorkbenchTriggerId } from "../room-workbench-trigger-id";
import { RoomHeader } from "./room-header";
import { RoomTopics } from "./room-topics";

const agent = {
	name: "Research agent",
	description: "",
	system_prompt: "",
	mcp: [],
	skills: [],
	prompts: [],
};
afterEach(cleanup);

it("keeps a room-specific focus destination when the workbench closes", () => {
	const id = roomWorkbenchTriggerId("room:one/two");
	const props = {
		agent,
		title: "Room",
		workbenchTriggerId: id,
		onToggleToolWorkbench: vi.fn(),
	};
	const view = render(<RoomHeader {...props} isToolWorkbenchOpen />);
	const toggle = screen.getByRole("button", { name: "Close workbench" });
	expect(toggle).toHaveAttribute("id", id);
	view.rerender(<RoomHeader {...props} isToolWorkbenchOpen={false} />);
	expect(screen.getByRole("button", { name: "Open workbench" })).toBe(toggle);
	act(() => document.getElementById(id)?.focus());
	expect(toggle).toHaveFocus();
	expect(roomWorkbenchTriggerId("another-room")).not.toBe(id);
});

it("exposes a long conversation title to keyboard users and returns focus", async () => {
	const title =
		"Planning the international customer renewal and implementation milestones for next quarter";
	render(
		<RoomHeader
			agent={agent}
			title={title}
			isToolWorkbenchOpen={false}
			onToggleToolWorkbench={vi.fn()}
		/>,
	);
	const user = userEvent.setup();
	const trigger = screen.getByRole("button", {
		name: `Conversation details: ${title}`,
	});
	expect(screen.getByRole("heading", { level: 1 })).toContainElement(trigger);
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	const details = screen.getByRole("dialog", {
		name: "Conversation details",
	});
	expect(within(details).getByText(title)).toBeVisible();
	expect(
		within(details).getByText("Research agent · AI agent"),
	).toBeVisible();
	await user.keyboard("{Escape}");
	await waitFor(() => expect(trigger).toHaveFocus());
});

it("preserves contextual and workbench actions without workspace navigation controls", async () => {
	const onToggle = vi.fn();
	const onAction = vi.fn();
	render(
		<RoomHeader
			agent={agent}
			title=""
			isToolWorkbenchOpen
			onToggleToolWorkbench={onToggle}
			actions={
				<button type="button" onClick={onAction}>
					Thread action
				</button>
			}
		/>,
	);
	const user = userEvent.setup();
	expect(
		screen.getByRole("button", {
			name: "Conversation details: Untitled conversation",
		}),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Thread action" }));
	await user.click(screen.getByRole("button", { name: "Close workbench" }));
	expect(onToggle).toHaveBeenCalledOnce();
	expect(onAction).toHaveBeenCalledOnce();
	expect(
		screen.queryByRole("button", { name: /navigation/ }),
	).not.toBeInTheDocument();
});

const roomScope = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: roomScope.actions }),
}));

it("shows uncached room links and exposes explicit refresh to keyboard users", async () => {
	const run = vi.fn(async () => ({
		pixelReturn: [
			{
				output: {
					roomId: "room",
					topics: [
						{
							topicId: "outside-directory",
							name: "Externally linked topic",
							state: "linked",
						},
					],
				},
				operationType: [],
			},
		],
	}));
	roomScope.actions = { run };
	const state = createInitialCollaborationState();
	state.topics = [];
	render(
		<MemoryRouter>
			<CollaborationSessionProvider initialState={state}>
				<RoomTopics roomId="room" isRunning={false} />
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
	expect(
		await screen.findByRole("link", { name: "Externally linked topic" }),
	).toHaveAttribute("href", "/brain/topics/outside-directory");
	const user = userEvent.setup();
	const picker = screen.getByRole("button", {
		name: "Add a topic to this chat",
	});
	act(() => picker.focus());
	await user.keyboard("{Enter}");
	await user.click(
		screen.getByRole("button", { name: "Refresh room topics" }),
	);
	await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
	await user.keyboard("{Escape}");
	await waitFor(() => expect(picker).toHaveFocus());
});

it("keeps the picker reachable after failure and restores dismissed topics with the direct reactor", async () => {
	const state = createInitialCollaborationState();
	const active = {
		...state.topics[0],
		id: "restore-me",
		name: "Delivery",
		short: "Delivery",
		status: "active" as const,
	};
	state.topics = [
		active,
		{
			...active,
			id: "suggested-topic",
			name: "New idea",
			status: "suggested",
		},
	];
	let reads = 0;
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("BrainListRoomTopics") && reads++ === 0)
			throw new Error("Room topics temporarily unavailable");
		return {
			pixelReturn: [
				{
					output: {
						roomId: "room",
						topics: [
							{
								topicId: "restore-me",
								name: "Delivery",
								state: statement.startsWith(
									"BrainLinkRoomTopic",
								)
									? "linked"
									: "dismissed",
							},
						],
					},
					operationType: [],
				},
			],
		};
	});
	roomScope.actions = { run };
	render(
		<MemoryRouter>
			<CollaborationSessionProvider initialState={state}>
				<RoomTopics roomId="room" isRunning={false} />
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
	const user = userEvent.setup();
	await user.click(
		screen.getByRole("button", { name: "Add a topic to this chat" }),
	);
	await screen.findByText("Room topics temporarily unavailable");
	await user.click(
		screen.getByRole("button", { name: "Refresh room topics" }),
	);
	await screen.findByRole("button", { name: "Restore Delivery" });
	expect(
		screen.getByRole("button", {
			name: /New idea.*accept in My topics first/,
		}),
	).toBeDisabled();
	await user.click(screen.getByRole("button", { name: "Restore Delivery" }));
	await screen.findByRole("link", { name: "Delivery" });
	expect(run).toHaveBeenCalledWith(
		'BrainLinkRoomTopic(roomId=["room"], topicId=["restore-me"], remove=[false]);',
	);
});

it("restores an uncached dismissed association while an earlier refresh is pending", async () => {
	const result = (state: string) => ({
		pixelReturn: [
			{
				output: {
					roomId: "room",
					topics: [
						{
							topicId: "missing",
							name: "Known by the room",
							state,
						},
					],
				},
				operationType: [],
			},
		],
	});
	let finishRead: (value: ReturnType<typeof result>) => void = () =>
		undefined;
	const pending = new Promise<ReturnType<typeof result>>((resolve) => {
		finishRead = resolve;
	});
	let reads = 0;
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("BrainLinkRoomTopic")) return result("linked");
		return reads++ === 0 ? result("dismissed") : pending;
	});
	roomScope.actions = { run };
	const state = createInitialCollaborationState();
	state.topics = [];
	render(
		<MemoryRouter>
			<CollaborationSessionProvider initialState={state}>
				<RoomTopics roomId="room" isRunning={false} />
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
	const user = userEvent.setup();
	await user.click(
		screen.getByRole("button", { name: "Add a topic to this chat" }),
	);
	await screen.findByRole("button", { name: "Restore Known by the room" });
	await user.click(
		screen.getByRole("button", { name: "Refresh room topics" }),
	);
	await user.click(
		screen.getByRole("button", { name: "Restore Known by the room" }),
	);
	await screen.findByRole("link", { name: "Known by the room" });
	await user.click(
		screen.getByRole("button", { name: "Add a topic to this chat" }),
	);
	expect(
		screen.getByRole("button", { name: "Refresh room topics" }),
	).toBeEnabled();
	await act(async () => finishRead(result("dismissed")));
	expect(
		screen.getByRole("link", { name: "Known by the room" }),
	).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "Restore Known by the room" }),
	).not.toBeInTheDocument();
});
