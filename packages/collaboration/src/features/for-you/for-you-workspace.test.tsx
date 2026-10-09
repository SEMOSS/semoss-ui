import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import type { Delegation } from "@/features/delegations/api/delegations";
import type { AgentRun } from "@/features/rooms/api/agent-run-api";
import { ForYouContext, type ForYouState } from "./for-you.context";
import { buildForYouItems, type Priority } from "./for-you.model";
import { ForYouWorkspace } from "./for-you-workspace";

const calls = vi.hoisted(() => ({ runPixel: vi.fn(), refresh: vi.fn() }));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: calls, insightId: "sample-review" }),
}));

const agent: AgentRun = {
	runId: "agent-run",
	roomId: "existing-room",
	status: "INPUT_REQUIRED",
	input: "Choose a launch date",
	workspaceName: "Launch assistant",
	pendingActions: [
		{
			actionId: "question",
			runId: "agent-run",
			toolName: "RequestUserInput",
			toolCallId: "question-tool",
		},
	],
};

/** Use real normalization and session commands while keeping external reads out of UI tests. */
function QueueFixture({
	complete = true,
	errors = [],
	runs = [],
	delegations = [],
}: {
	complete?: boolean;
	errors?: string[];
	runs?: AgentRun[];
	delegations?: Delegation[];
}) {
	const { state, dispatch } = useCollaborationSession();
	const [priorities, setPriorities] = useState<Record<string, Priority>>({});
	const location = useLocation();
	const items = buildForYouItems(state, {
		runs,
		delegations,
		roomSource: () => ({ status: "ready", threadId: null }),
		priorities,
	});
	const value: ForYouState = {
		items,
		isLoading: false,
		isComplete: complete,
		errors,
		refresh: calls.refresh,
		setPriority: (item, priority) =>
			item.kind === "work"
				? dispatch({
						type: "item.update",
						itemId: item.item.id,
						changes: { priority },
					})
				: setPriorities((current) => ({
						...current,
						[item.id]: priority,
					})),
		agentAttention: {
			runs,
			scan: { checked: 1, complete, errors },
			isLoading: false,
			refresh: calls.refresh,
			delegations: {
				data: [],
				error: "",
				isLoading: false,
				checkedAt: new Date(),
				refresh: calls.refresh,
			},
		},
	};
	return (
		<ForYouContext.Provider value={value}>
			<main tabIndex={-1}>
				<ForYouWorkspace />
			</main>
			<output aria-label="Location">
				{location.pathname}
				{location.search}
			</output>
		</ForYouContext.Provider>
	);
}

function fixtureState(): CollaborationState {
	const state = createInitialCollaborationState();
	state.items = state.items
		.filter((item) => item.status === "open" && item.askType !== "fyi")
		.slice(0, 2);
	state.reviews = [];
	state.memories = [];
	return state;
}

function show(
	state = fixtureState(),
	path = "/for-you?view=board",
	options: {
		complete?: boolean;
		errors?: string[];
		runs?: AgentRun[];
		delegations?: Delegation[];
	} = {},
) {
	const onChange = vi.fn();
	render(
		<MemoryRouter initialEntries={[path]}>
			<CollaborationSessionProvider
				initialState={state}
				onChange={onChange}
			>
				<QueueFixture {...options} />
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
	return { user: userEvent.setup(), onChange };
}

beforeEach(() => {
	vi.clearAllMocks();
	Object.defineProperty(Element.prototype, "hasPointerCapture", {
		configurable: true,
		value: () => false,
	});
	Object.defineProperty(Element.prototype, "setPointerCapture", {
		configurable: true,
		value: () => undefined,
	});
	Object.defineProperty(Element.prototype, "releasePointerCapture", {
		configurable: true,
		value: () => undefined,
	});
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	});
});
afterEach(cleanup);

describe("For you review workspace", () => {
	it("opens source context without a backend request or room creation and resolves only the reviewed item", async () => {
		const state = fixtureState();
		const first = state.items[0];
		if (!first) throw new Error("Expected sample work");
		const { user, onChange } = show(state);
		await user.click(
			within(
				screen.getByRole("article", { name: first.title }),
			).getByRole("button", { name: "Review" }),
		);
		const dialog = await screen.findByRole("dialog", { name: first.title });
		expect(
			within(dialog).getByRole("heading", { name: first.title }),
		).toHaveFocus();
		await waitFor(() =>
			expect(
				within(dialog).queryByLabelText("Loading source"),
			).not.toBeInTheDocument(),
		);
		expect(calls.runPixel).not.toHaveBeenCalled();
		expect(onChange).not.toHaveBeenCalled();
		expect(
			screen.queryByRole("button", { name: "New task" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Done" }),
		).not.toBeInTheDocument();
		await user.click(
			within(dialog).getByRole("button", { name: "Mark reviewed" }),
		);
		await waitFor(() =>
			expect(
				screen.queryByRole("article", { name: first.title }),
			).not.toBeInTheDocument(),
		);
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				commands: [
					expect.objectContaining({
						type: "item.update",
						itemId: first.id,
						changes: expect.objectContaining({ status: "done" }),
					}),
				],
			}),
		);
		await waitFor(() =>
			expect(
				document.querySelector("[data-for-you-heading]"),
			).toHaveFocus(),
		);
	});

	it("changes priority through the menu without completing work and restores focus after moving columns", async () => {
		const state = fixtureState();
		const first = state.items[0];
		if (!first) throw new Error("Expected sample work");
		first.priority = "P2";
		const { user, onChange } = show(state);
		await user.click(
			screen.getByRole("button", {
				name: `Priority for ${first.title}: Normal`,
			}),
		);
		await user.click(screen.getByRole("menuitemradio", { name: "Urgent" }));
		expect(
			within(
				screen.getByRole("region", { name: "Urgent priority" }),
			).getByRole("article", { name: first.title }),
		).toBeVisible();
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				commands: [
					{
						type: "item.update",
						itemId: first.id,
						changes: { priority: "P0" },
					},
				],
			}),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", {
					name: `Priority for ${first.title}: Urgent`,
				}),
			).toHaveFocus(),
		);
	});

	it("filters with the colored topic dropdown and preserves filters when switching views", async () => {
		const state = fixtureState();
		const first = state.items[0];
		const topic = state.topics.find(({ id }) =>
			first?.topicIds.includes(id),
		);
		if (!topic || !first) throw new Error("Expected linked sample topic");
		const { user } = show(state);
		await user.click(
			screen.getByRole("combobox", { name: "Filter by topic" }),
		);
		await user.click(screen.getByRole("option", { name: topic.name }));
		expect(screen.getByLabelText("Location")).toHaveTextContent(
			`topic=${topic.id}`,
		);
		expect(
			screen
				.getByRole("combobox", { name: "Filter by topic" })
				.querySelector("[aria-hidden=true]"),
		).toBeInTheDocument();
		await user.click(screen.getByRole("tab", { name: "List" }));
		expect(screen.getByLabelText("Location")).toHaveTextContent(
			"view=list",
		);
		expect(screen.getByLabelText("Location")).toHaveTextContent(
			`topic=${topic.id}`,
		);
		await user.type(
			screen.getByRole("textbox", { name: "Search reviews" }),
			"no-matching-review",
		);
		expect(
			screen.getByRole("heading", { name: "No matching reviews" }),
		).toBeVisible();
		await user.click(
			screen.getAllByRole("button", { name: "Clear filters" })[0],
		);
		expect(screen.getByLabelText("Location")).toHaveTextContent(
			"/for-you?view=list",
		);
	});

	it("opens agent questions in the owning room with the exact pending tool", () => {
		show(fixtureState(), "/for-you?view=list", { runs: [agent] });
		const respond = screen.getByRole("link", {
			name: "Respond",
		});
		expect(respond).toHaveAttribute(
			"href",
			"/thread/room%3Aexisting-room?item=question-tool",
		);
		expect(screen.getByText("Question for you")).toBeVisible();
		expect(calls.runPixel).not.toHaveBeenCalled();
	});

	it("uses the action ID when the pending tool has no separate call ID", () => {
		show(fixtureState(), "/for-you?view=list", {
			runs: [
				{
					...agent,
					pendingActions: [
						{
							actionId: "question",
							runId: "agent-run",
							toolName: "RequestUserInput",
						},
					],
				},
			],
		});
		expect(screen.getByRole("link", { name: "Respond" })).toHaveAttribute(
			"href",
			"/thread/room%3Aexisting-room?item=question",
		);
	});

	it("deduplicates delegation actions and opens the assignee response room", () => {
		show(fixtureState(), "/for-you?view=list", {
			runs: [agent],
			delegations: [
				{
					actionId: "question",
					status: "PENDING",
					roomId: "assignee-room",
					question: "Choose a launch date",
				},
			],
		});
		expect(screen.getAllByRole("link", { name: "Respond" })).toHaveLength(
			1,
		);
		expect(screen.getByRole("link", { name: "Respond" })).toHaveAttribute(
			"href",
			"/thread/room%3Aassignee-room",
		);
	});

	it("keeps suggested memories through existing commands and removes accepted suggestions", async () => {
		const state = fixtureState();
		state.items = [];
		state.memories = [
			{
				id: "suggestion",
				kind: "preference",
				text: "Use a concise meeting summary.",
				state: "suggested",
				origin: "brain",
				confirmed: false,
				pinned: false,
				about: [],
				expiresAt: null,
				replacesId: null,
				source: {},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				isSample: true,
			},
		];
		const { user, onChange } = show(state);
		await user.click(
			screen.getByRole("button", { name: "Review suggestion" }),
		);
		await user.click(screen.getByRole("button", { name: "Keep memory" }));
		expect(
			screen.getByRole("heading", { name: "You’re all caught up" }),
		).toBeVisible();
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				commands: [
					{
						type: "memory.resolve",
						memoryId: "suggestion",
						action: "accept",
					},
				],
			}),
		);
	});

	it("never claims all caught up when sources are incomplete and exposes retry", async () => {
		const state = fixtureState();
		state.items = [];
		const { user } = show(state, "/for-you", {
			complete: false,
			errors: ["Agent activity is unavailable."],
		});
		expect(
			screen.queryByRole("heading", { name: "You’re all caught up" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Agent activity is unavailable.",
		);
		await user.click(screen.getByRole("button", { name: "Retry" }));
		expect(calls.refresh).toHaveBeenCalledOnce();
	});

	it("preserves keyboard focus and validates memory edits before keeping a suggestion", async () => {
		const state = fixtureState();
		state.items = [];
		state.memories = [
			{
				id: "suggestion",
				kind: "preference",
				text: "Use a concise meeting summary.",
				state: "suggested",
				origin: "brain",
				confirmed: false,
				pinned: false,
				about: [],
				expiresAt: null,
				replacesId: null,
				source: {},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				isSample: true,
			},
		];
		const { user, onChange } = show(state);
		await user.click(
			screen.getByRole("button", { name: "Review suggestion" }),
		);
		await user.click(screen.getByRole("button", { name: "Edit" }));
		expect(screen.getByRole("textbox", { name: "Memory" })).toHaveFocus();
		await user.type(
			screen.getByRole("textbox", { name: "Memory" }),
			" draft",
		);
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus();
		expect(onChange).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Edit" }));
		const input = screen.getByRole("textbox", { name: "Memory" });
		expect(input).toHaveValue("Use a concise meeting summary.");
		await user.clear(input);
		await user.click(screen.getByRole("button", { name: "Save and keep" }));
		expect(await screen.findByText("Enter a memory.")).toBeVisible();
		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(input).toHaveAccessibleDescription("Enter a memory.");
		expect(onChange).not.toHaveBeenCalled();
		await user.type(input, "Lead with decisions.");
		await user.click(screen.getByRole("button", { name: "Save and keep" }));
		expect(
			screen.getByRole("heading", { name: "You’re all caught up" }),
		).toBeVisible();
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				commands: [
					{
						type: "memory.save",
						memory: {
							id: "suggestion",
							text: "Lead with decisions.",
							kind: "preference",
						},
					},
				],
			}),
		);
	});
});
