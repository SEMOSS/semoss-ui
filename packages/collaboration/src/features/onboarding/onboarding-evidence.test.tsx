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
	deferred,
	makeAreaReview,
	nextStage,
	press,
	reviewSession,
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

async function openConversations(session: ReturnType<typeof evidenceSession>) {
	const user = userEvent.setup();
	const view = render(step(session.actions));
	await screen.findByRole("heading", { name: "Your main areas of work" });
	await nextStage(user, "people");
	await nextStage(user, "conversations");
	await screen.findByText("Topic 1 of 2");
	return { user, view };
}

const subjects = () =>
	screen
		.getAllByRole("checkbox")
		.map((box) => box.getAttribute("id"))
		.filter(Boolean).length;

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
		expect(screen.getByText(`${DOT} 1 conversation`)).toBeVisible();
		// nothing is previous on the first topic
		expect(
			screen.queryByRole("button", { name: "Previous topic" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Looks right, next topic" }),
		).toBeVisible();
	});

	it("moves a conversation to another topic at once and does not confirm it again", async () => {
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
				new RegExp(`Moved to Platform Operations ${DOT}`),
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
			name: /TLS certificate renewal/,
		});
		expect(box).toBeDisabled();
		expect(box).not.toBeChecked();
		expect(
			screen.queryByRole("button", { name: /^Move "/ }),
		).not.toBeInTheDocument();

		await press(user, "Looks right, next topic");
		expect(await screen.findByText("Topic 2 of 2")).toBeVisible();
		// the moved one is already decided, so nothing else goes out for topic 1
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
		await screen.findByRole("checkbox", { name: /Conversation 10/ });
		expect(subjects()).toBe(10);
		expect(
			screen.queryByRole("checkbox", { name: /Conversation 11/ }),
		).not.toBeInTheDocument();
		const evidenceReads = () =>
			session.run.mock.calls.filter(([statement]) =>
				statement.startsWith("BrainGetTopicReviewEvidence("),
			);
		expect(evidenceReads()).toHaveLength(2);

		// the first read held twenty, so this one is local
		await user.click(screen.getByRole("button", { name: /Show more/ }));
		await screen.findByRole("checkbox", { name: /Conversation 20/ });
		expect(subjects()).toBe(20);
		expect(evidenceReads()).toHaveLength(2);
		expect(
			screen.getByRole("button", { name: /Show more/ }),
		).toHaveTextContent("(5 left)");

		await user.click(screen.getByRole("button", { name: /Show more/ }));
		await screen.findByRole("checkbox", { name: /Conversation 25/ });
		expect(subjects()).toBe(25);
		expect(evidenceReads()).toHaveLength(3);
		expect(evidenceReads()[2][0]).toContain("offset=[20]");
		expect(
			screen.queryByRole("button", { name: /Show more/ }),
		).not.toBeInTheDocument();
	});

	it("records only the conversations that were on screen", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(async (review, key, offset) =>
			makeEvidence(review, key, { total: 25, offset }),
		);
		const { user } = await openConversations(session);
		await screen.findByRole("checkbox", { name: /Conversation 10/ });
		await press(user, "Looks right, next topic");
		await screen.findByText("Topic 2 of 2");
		const [only] = changesSent(session);
		expect(changesSent(session)).toHaveLength(1);
		expect(only.change).toMatchObject({
			type: "confirm",
			topicKey: "topic-1",
		});
		expect("threadIds" in only.change && only.change.threadIds).toEqual(
			Array.from({ length: 10 }, (_, index) => `thread-${index + 1}`),
		);
	});

	it("leaves a Teams chat alone: it cannot be unchecked, moved or confirmed", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(async (review, key) => {
			const page = makeEvidence(review, key, { total: 2 });
			page.items[0].source = "teams";
			page.items[0].canCorrect = false;
			return page;
		});
		const { user } = await openConversations(session);
		const chat = await screen.findByRole("checkbox", {
			name: /TLS certificate renewal/,
		});
		expect(chat).toBeDisabled();
		expect(screen.getByText("Teams")).toBeVisible();
		expect(
			screen.queryByRole("button", {
				name: 'Move "TLS certificate renewal" to another topic',
			}),
		).not.toBeInTheDocument();
		expect(
			await screen.findByRole("button", {
				name: 'Move "Conversation 2" to another topic',
			}),
		).toBeVisible();
		await press(user, "Looks right, next topic");
		await screen.findByText("Topic 2 of 2");
		const [only] = changesSent(session);
		expect(changesSent(session)).toHaveLength(1);
		expect("threadIds" in only.change && only.change.threadIds).toEqual([
			"thread-2",
		]);
	});

	it("retries an uncertain correction with the same operation ID", async () => {
		const session = evidenceSession();
		session.afterChange.mockRejectedValueOnce(
			new Error("Connection lost after the correction was saved"),
		);
		const { user } = await openConversations(session);
		await user.click(
			await screen.findByRole("checkbox", {
				name: /TLS certificate renewal/,
			}),
		);
		await press(user, "Looks right, next topic");
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Connection lost",
		);
		// still on the first topic
		expect(screen.getByText("Topic 1 of 2")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Retry" }));
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
		const sent = changesSent(session);
		expect(sent).toHaveLength(2);
		expect(sent[1]).toEqual(sent[0]);
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
		await press(user, "Looks right, next topic");
		expect(await screen.findByText("Topic 2 of 2")).toBeVisible();
		expect(changesSent(session)).toEqual([]);
	});

	it("ignores a correction response that arrives after switching to another insight", async () => {
		const old = evidenceSession();
		const current = reviewSession(async () => makeAreaReview());
		const pending = deferred<void>();
		old.afterChange.mockImplementationOnce(() => pending.promise);
		const view = render(step(old.actions));
		const user = userEvent.setup();
		await screen.findByRole("heading", { name: "Your main areas of work" });
		await nextStage(user, "people");
		await nextStage(user, "conversations");
		await user.click(
			await screen.findByRole("checkbox", {
				name: /TLS certificate renewal/,
			}),
		);
		await press(user, "Looks right, next topic");
		await waitFor(() => expect(old.afterChange).toHaveBeenCalled());
		view.rerender(step(current.actions));
		const heading = await screen.findByRole("heading", {
			name: "Your main areas of work",
		});
		await act(async () => pending.resolve());
		expect(heading).toBeVisible();
		expect(screen.queryByText(/Topic \d of \d/)).not.toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(current.saved?.draft.corrections).toBeUndefined();
	});
});
