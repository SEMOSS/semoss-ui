import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import {
	changesSent,
	evidenceSession,
	makeEvidence,
} from "./topic-evidence.test-fixtures";
import { DOT } from "./topic-flow-utils";
import {
	checkTopics,
	deferred,
	makeAreaReview,
	nextStage,
	press,
	reviewSession,
	setUpInBuilder,
} from "./topic-review.test-fixtures";
import { TopicsStep } from "./topics-step";

function step(actions: InsightActions, onNext = vi.fn()) {
	return (
		<StrictMode>
			<TopicsStep
				actions={actions}
				onNext={onNext}
				onBack={vi.fn()}
				eyebrow="Step 7 of 8"
			/>
		</StrictMode>
	);
}

/** Opens the Check stage, where the first kept topic's conversations load. */
async function openConversations(session: ReturnType<typeof evidenceSession>) {
	const user = userEvent.setup();
	const view = render(step(session.actions));
	await screen.findByRole("heading", { name: "Your main areas of work" });
	await checkTopics(user);
	return { user, view };
}

/** The conversations listed, by their selection boxes. */
const conversations = () =>
	screen.queryAllByRole("checkbox", { name: /^Select "/ });

const evidenceReads = (session: ReturnType<typeof evidenceSession>) =>
	session.run.mock.calls
		.map(([statement]) => String(statement))
		.filter((statement) =>
			statement.startsWith("BrainGetTopicReviewEvidence("),
		);

beforeEach(() => {
	vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("onboarding conversation check", () => {
	it("shows each conversation with its date, size and people", async () => {
		const session = evidenceSession();
		await openConversations(session);
		expect(
			await screen.findByText("TLS certificate renewal"),
		).toBeVisible();
		expect(screen.getByText(/3 messages/)).toHaveTextContent(
			`${DOT} 3 messages ${DOT} Ana Lima`,
		);
		expect(screen.getByText("Conversations (1)")).toBeVisible();
		expect(screen.getByText("1 worth a look, shown first")).toBeVisible();
		expect(
			screen.getByRole("button", {
				name: 'Take "TLS certificate renewal" off this topic',
			}),
		).toBeVisible();
	});

	it("moves a conversation to another topic at once and does not put it back here", async () => {
		const session = evidenceSession();
		const { user } = await openConversations(session);
		const trigger = await screen.findByRole("button", {
			name: 'Move "TLS certificate renewal" to another topic',
		});
		await waitFor(() => expect(trigger).toBeEnabled());
		await user.click(trigger);
		await user.click(
			await screen.findByRole("menuitem", {
				name: "Platform Operations",
			}),
		);
		expect(
			await screen.findByText(
				new RegExp(`^Moved to Platform Operations ${DOT}`),
			),
		).toBeVisible();
		expect(changesSent(session)).toEqual([
			{
				revision: 1,
				operationId: expect.any(String),
				change: {
					type: "move",
					topicKey: "topic-1",
					targetKey: "topic-2",
					threadIds: ["thread-1"],
					versions: { "thread-1": "relationship-version-1" },
				},
			},
		]);
		const box = screen.getByRole("checkbox", {
			name: 'Select "TLS certificate renewal"',
		});
		expect(box).toBeDisabled();
		expect(box).not.toBeChecked();
		expect(
			screen.queryByRole("button", { name: /^Move "/ }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Put back" })).toBeDisabled();
		expect(changesSent(session)).toHaveLength(1);
		expect(session.saved?.draft.corrections).toEqual([
			{
				threadId: "thread-1",
				topicKey: "topic-1",
				state: "exclude",
				primary: false,
			},
			{
				threadId: "thread-1",
				topicKey: "topic-2",
				state: "include",
				primary: true,
			},
		]);
	});

	it("shows ten at a time and loads the next page only when the first is used up", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(async (review, key, offset) =>
			makeEvidence(review, key, { total: 25, offset }),
		);
		const { user } = await openConversations(session);
		await screen.findByRole("checkbox", {
			name: 'Select "Conversation 10"',
		});
		expect(conversations()).toHaveLength(10);
		expect(
			screen.queryByRole("checkbox", {
				name: 'Select "Conversation 11"',
			}),
		).not.toBeInTheDocument();
		const reads = evidenceReads(session).length;

		// the first read held twenty, so this one is local
		await user.click(screen.getByRole("button", { name: /Show more/ }));
		await screen.findByRole("checkbox", {
			name: 'Select "Conversation 20"',
		});
		expect(conversations()).toHaveLength(20);
		expect(evidenceReads(session)).toHaveLength(reads);
		expect(
			screen.getByRole("button", { name: /Show more/ }),
		).toHaveTextContent("(5 left)");

		await user.click(screen.getByRole("button", { name: /Show more/ }));
		await screen.findByRole("checkbox", {
			name: 'Select "Conversation 25"',
		});
		expect(conversations()).toHaveLength(25);
		expect(evidenceReads(session)).toHaveLength(reads + 1);
		expect(evidenceReads(session).at(-1)).toContain("offset=[20]");
		expect(
			screen.queryByRole("button", { name: /Show more/ }),
		).not.toBeInTheDocument();
	});

	it("takes off only the conversations you picked", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(async (review, key, offset) =>
			makeEvidence(review, key, { total: 25, offset }),
		);
		const { user } = await openConversations(session);
		await screen.findByRole("checkbox", {
			name: 'Select "Conversation 10"',
		});
		for (const name of ["Conversation 2", "Conversation 3"])
			await user.click(
				screen.getByRole("checkbox", { name: `Select "${name}"` }),
			);
		expect(screen.getByText("2 selected")).toBeVisible();
		await press(user, "Not this topic");
		await waitFor(() => expect(changesSent(session)).toHaveLength(1));
		const [only] = changesSent(session);
		expect(only.change).toMatchObject({
			type: "reject",
			topicKey: "topic-1",
		});
		expect("threadIds" in only.change && only.change.threadIds).toEqual([
			"thread-2",
			"thread-3",
		]);
		await waitFor(() =>
			expect(screen.queryByText("2 selected")).not.toBeInTheDocument(),
		);
	});

	it("leaves a Teams chat alone: it cannot be picked, moved or taken off", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(async (review, key) => {
			const page = makeEvidence(review, key, { total: 2 });
			page.items[0].source = "teams";
			page.items[0].canCorrect = false;
			return page;
		});
		const { user } = await openConversations(session);
		const chat = await screen.findByRole("checkbox", {
			name: 'Select "TLS certificate renewal"',
		});
		expect(chat).toBeDisabled();
		expect(screen.getByText("Teams")).toBeVisible();
		expect(
			screen.queryByRole("button", {
				name: 'Move "TLS certificate renewal" to another topic',
			}),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: 'Take "TLS certificate renewal" off this topic',
			}),
		).not.toBeInTheDocument();
		expect(
			await screen.findByRole("button", {
				name: 'Move "Conversation 2" to another topic',
			}),
		).toBeVisible();
		await user.click(
			screen.getByRole("checkbox", { name: 'Select "Conversation 2"' }),
		);
		await press(user, "Not this topic");
		await waitFor(() => expect(changesSent(session)).toHaveLength(1));
		const [only] = changesSent(session);
		expect("threadIds" in only.change && only.change.threadIds).toEqual([
			"thread-2",
		]);
	});

	it("explains an uncertain correction beside the list and records it once", async () => {
		const session = evidenceSession();
		session.afterChange.mockRejectedValueOnce(
			new Error("Connection lost after the correction was saved"),
		);
		const { user } = await openConversations(session);
		await press(user, 'Take "TLS certificate renewal" off this topic');
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Connection lost after the correction was saved. The list is refreshed; try again.",
		);
		expect(await screen.findByText(/^Taken off this topic/)).toBeVisible();
		expect(changesSent(session)).toHaveLength(1);
		expect(session.saved?.revision).toBe(2);
		expect(session.saved?.draft.corrections).toHaveLength(1);
	});

	it("shows a failed read, and still lets you move on", async () => {
		const session = evidenceSession();
		session.evidence.mockRejectedValue(
			new Error("Conversations are unavailable"),
		);
		const { user } = await openConversations(session);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Conversations are unavailable",
		);
		await nextStage(user, "done");
		expect(
			await screen.findByRole("heading", { name: "Ready to file" }),
		).toBeVisible();
		expect(changesSent(session)).toEqual([]);
	});

	it("ignores a correction response that arrives after switching to another insight", async () => {
		const old = evidenceSession();
		const current = reviewSession(async () =>
			setUpInBuilder(makeAreaReview()),
		);
		const pending = deferred<void>();
		old.afterChange.mockImplementationOnce(() => pending.promise);
		const { user, view } = await openConversations(old);
		await press(user, 'Take "TLS certificate renewal" off this topic');
		await waitFor(() => expect(old.afterChange).toHaveBeenCalled());
		view.rerender(step(current.actions));
		const heading = await screen.findByRole("heading", {
			name: "Your main areas of work",
		});
		await act(async () => pending.resolve());
		expect(heading).toBeVisible();
		expect(
			screen.queryByText(/^Taken off this topic/),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(current.saved?.draft.corrections).toBeUndefined();
	});
});
