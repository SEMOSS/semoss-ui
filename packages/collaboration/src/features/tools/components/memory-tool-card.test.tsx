import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import type { ConversationTool } from "@/features/messages/types/message";
import { MemoryToolCard, parseMemoryResult } from "./memory-tool-card";

const run = vi.fn();
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: { run }, insightId: "app" }),
}));

afterEach(() => {
	cleanup();
	run.mockReset();
});

const saved = {
	id: "mem-1",
	kind: "preference",
	text: "Always cc Dana on Acme emails",
	state: "active",
	origin: "assistant",
	confirmed: false,
	pinned: false,
	about: [{ type: "person", id: "p-ava", name: "Ava" }],
	expiresAt: null,
	replacesId: null,
	source: { kind: "chat", roomId: "room-1" },
	createdAt: "2026-10-06T12:00:00Z",
	updatedAt: "2026-10-06T12:00:00Z",
};

function tool(id: string, output: unknown): ConversationTool {
	return {
		id,
		parentMessageId: "message-1",
		name: "Remember",
		title: "Remember",
		arguments: {},
		status: "COMPLETED",
		output: JSON.stringify(output),
	};
}

function MemoryIds() {
	const { state } = useCollaborationSession();
	return (
		<output aria-label="Memory ids">
			{state.memories
				.filter((memory) => !memory.isSample)
				.map((memory) => `${memory.id}:${memory.state}`)
				.join(",")}
		</output>
	);
}

function renderCard(card: ConversationTool, isLive: boolean) {
	const result = parseMemoryResult(card.output);
	if (!result) throw new Error("not a memory result");
	render(
		<MemoryRouter>
			<CollaborationSessionProvider
				initialState={createInitialCollaborationState()}
			>
				<MemoryToolCard tool={card} result={result} isLive={isLive} />
				<MemoryIds />
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
}

describe("MemoryToolCard", () => {
	it("reads only the memory tools' results", () => {
		expect(
			parseMemoryResult(
				JSON.stringify({ status: "saved", memory: saved }),
			),
		).toMatchObject({ status: "saved", memory: { id: "mem-1" } });
		expect(
			parseMemoryResult(JSON.stringify({ status: "sent" })),
		).toBeNull();
		expect(parseMemoryResult("not json")).toBeNull();
		expect(parseMemoryResult(undefined)).toBeNull();
	});

	it("puts a live save in the session and undoes it on the server", async () => {
		const user = userEvent.setup();
		run.mockResolvedValue({
			pixelReturn: [
				{
					operationType: ["OPERATION"],
					output: {
						memory: { ...saved, state: "dismissed" },
						restored: null,
					},
				},
			],
		});
		renderCard(tool("live-save", { status: "saved", memory: saved }), true);
		expect(screen.getByText("Saved to memory")).toBeVisible();
		expect(screen.getByLabelText("Memory ids")).toHaveTextContent(
			"mem-1:active",
		);
		await user.click(screen.getByRole("button", { name: "Undo" }));
		expect(run).toHaveBeenCalledWith(
			'BrainResolveMemory(memoryId=["mem-1"], action=["dismiss"]);',
		);
		expect(await screen.findByText("Undone.")).toBeVisible();
		expect(screen.getByLabelText("Memory ids")).toBeEmptyDOMElement();
	});

	it("leaves an old card from history out of the session, with no actions", () => {
		renderCard(
			tool("history-save", { status: "saved", memory: saved }),
			false,
		);
		expect(screen.getByText("Always cc Dana on Acme emails")).toBeVisible();
		expect(screen.getByLabelText("Memory ids")).toBeEmptyDOMElement();
		expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
	});

	it("asks before changing a memory the owner wrote, and applies the change as theirs", async () => {
		const user = userEvent.setup();
		const owned = {
			...saved,
			id: "m-sample-pref-1",
			origin: "you",
			confirmed: true,
		};
		run.mockResolvedValue({
			pixelReturn: [
				{
					operationType: ["OPERATION"],
					output: {
						...owned,
						text: "Keep Northwind emails to one paragraph.",
					},
				},
			],
		});
		renderCard(
			tool("needs-owner", {
				status: "needs_owner",
				memory: owned,
				proposed: {
					kind: "preference",
					text: "Keep Northwind emails to one paragraph.",
					about: [],
					expiresAt: null,
				},
			}),
			true,
		);
		expect(screen.getByText("Update this memory?")).toBeVisible();
		expect(
			screen.getByText("Keep Northwind emails to one paragraph."),
		).toBeVisible();
		expect(
			screen.getByText("You wrote: Always cc Dana on Acme emails"),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Update" }));
		expect(run.mock.calls[0][0]).toMatch(
			/^BrainSaveMemory\(memory=\[\{"id":"m-sample-pref-1","kind":"preference","text":"Keep Northwind emails to one paragraph\."/,
		);
		expect(await screen.findByText("Updated.")).toBeVisible();
	});
});
