import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { WorkUpdatesStatus } from "@/features/collaboration/live/work-updates.context";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { RoomSourceAssociationsProvider } from "@/features/dashboard/room-source-associations-provider";
import type { useAgentAttention } from "@/features/dashboard/use-agent-attention";
import { readRoomSourceAssociation } from "@/features/rooms/api/read-room-source-association";
import { useAttention } from "./attention.context";
import { attentionPriorityStorageKey } from "./attention-priorities";
import { AttentionProvider } from "./attention-provider";

const mocks = vi.hoisted(() => ({
	attention: null as ReturnType<typeof useAgentAttention> | null,
	updates: null as WorkUpdatesStatus | null,
}));
vi.mock("@/features/dashboard/use-agent-attention", () => ({
	useAgentAttention: () => mocks.attention,
}));
vi.mock("@/features/collaboration/live/work-updates.context", () => ({
	useWorkUpdates: () => mocks.updates,
}));
vi.mock("@/features/rooms/api/read-room-source-association", () => ({
	readRoomSourceAssociation: vi.fn(),
}));

function Probe({ name }: { name: string }) {
	const queue = useAttention();
	return (
		<section aria-label={name}>
			<output>{queue.isComplete ? "Complete" : "Partial"}</output>
			{queue.errors.map((error) => (
				<p key={error}>{error}</p>
			))}
			{queue.items.map((item) => (
				<button
					key={item.id}
					type="button"
					onClick={() => {
						if (item.kind !== "work") queue.setPriority(item, "P0");
					}}
				>
					{item.id} {item.priority ?? "default"} {item.topicStatus}
				</button>
			))}
			<button type="button" onClick={queue.refresh}>
				Refresh {name}
			</button>
		</section>
	);
}

function state(): CollaborationState {
	const initial = createInitialCollaborationState();
	const thread = initial.threads[0];
	const item = initial.items.find(
		(candidate) => candidate.threadId === thread?.id,
	);
	if (!thread || !item)
		throw new Error("A connected source fixture is required");
	return {
		...initial,
		threads: [{ ...thread, muted: false, automated: false }],
		items: [
			{
				...item,
				id: "work",
				status: "open",
				askType: "reply",
				priority: "P2",
			},
		],
		reviews: [
			{
				id: "review",
				kind: "unassigned",
				refId: thread.id,
				status: "open",
				text: "Choose a topic",
				detail: "",
				actions: [],
			},
		],
		memories: [],
	};
}

function content(initial: CollaborationState, account = "owner") {
	return (
		<CollaborationSessionProvider initialState={initial}>
			<RoomSourceAssociationsProvider key={account} actions={{} as never}>
				<AttentionProvider
					account={account}
					deployment="deployment"
					refreshRevision={0}
				>
					<Probe name="Home" />
					<Probe name="Board" />
				</AttentionProvider>
			</RoomSourceAssociationsProvider>
		</CollaborationSessionProvider>
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.attention = {
		runs: [],
		scan: { checked: 0, complete: true, errors: [] },
		isLoading: false,
		refresh: vi.fn(),
		delegations: {
			data: [],
			error: "",
			isLoading: false,
			checkedAt: new Date(),
			refresh: vi.fn(),
		},
	};
	mocks.updates = null;
	vi.mocked(readRoomSourceAssociation).mockResolvedValue(null);
});
afterEach(() => localStorage.clear());

it("shares browser review priorities across consumers without resolving the records", async () => {
	const user = userEvent.setup();
	const view = render(content(state()));
	await user.click(
		screen.getAllByRole("button", {
			name: "review:review default ready",
		})[0],
	);
	expect(
		screen.getAllByRole("button", { name: "review:review P0 ready" }),
	).toHaveLength(2);
	expect(
		JSON.parse(
			localStorage.getItem(
				attentionPriorityStorageKey("owner", "deployment"),
			) ?? "null",
		),
	).toEqual({ version: 1, priorities: { "review:review": "P0" } });
	view.rerender(content(state(), "another-owner"));
	expect(
		screen.getAllByRole("button", { name: "review:review default ready" }),
	).toHaveLength(2);
});

it("retains incomplete coverage and retries the shared sources", async () => {
	const refresh = vi.fn();
	mocks.updates = {
		refresh,
		error: "Review refresh unavailable",
		isRefreshing: false,
		lastUpdated: null,
		lastMailCheck: null,
		isSyncing: false,
		lastSync: null,
		syncError: "",
		syncMail: vi.fn(),
		pendingCoverage: null,
	};
	if (!mocks.attention) throw new Error("Attention fixture missing");
	mocks.attention.scan = {
		checked: 1,
		complete: false,
		errors: ["Some pending runs could not be refreshed."],
	};
	render(content({ ...state(), items: [], reviews: [] }));
	expect(screen.getAllByText("Partial")).toHaveLength(2);
	expect(screen.getAllByText("Review refresh unavailable")).toHaveLength(2);
	expect(refresh).toHaveBeenCalledTimes(1);
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Refresh Home" }));
	expect(refresh).toHaveBeenCalledTimes(2);
	expect(mocks.attention.refresh).toHaveBeenCalledTimes(1);
});

it("does not report complete coverage when an explicit topic record is unavailable", () => {
	render(content({ ...state(), topics: [], reviews: [] }));
	expect(screen.getAllByText("Partial")).toHaveLength(2);
	expect(
		screen.getAllByRole("button", { name: "work:work P2 error" }),
	).toHaveLength(2);
	expect(
		screen.getAllByText(
			"Some topic links could not be checked. All pending items remain available.",
		),
	).toHaveLength(2);
});

it("loads one shared room association for duplicate action feeds and exposes unavailable topics", async () => {
	if (!mocks.attention) throw new Error("Attention fixture missing");
	mocks.attention.runs = [
		{
			runId: "run",
			roomId: "room",
			status: "INPUT_REQUIRED",
			pendingActions: [
				{ actionId: "action", runId: "run", toolName: "Review" },
			],
		},
	];
	mocks.attention.delegations.data = [
		{
			actionId: "action",
			roomId: "room",
			status: "PENDING",
			question: "Approval",
		},
	];
	vi.mocked(readRoomSourceAssociation).mockRejectedValue(
		new Error("Unavailable"),
	);
	render(content({ ...state(), items: [], reviews: [] }));
	await waitFor(() =>
		expect(
			screen.getAllByRole("button", {
				name: "action:action default error",
			}),
		).toHaveLength(2),
	);
	expect(readRoomSourceAssociation).toHaveBeenCalledTimes(1);
	expect(screen.getAllByText("Partial")).toHaveLength(2);
	vi.mocked(readRoomSourceAssociation).mockResolvedValue(null);
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Refresh Board" }));
	await waitFor(() =>
		expect(
			screen.getAllByRole("button", {
				name: "action:action default ready",
			}),
		).toHaveLength(2),
	);
	expect(readRoomSourceAssociation).toHaveBeenCalledTimes(2);
});
