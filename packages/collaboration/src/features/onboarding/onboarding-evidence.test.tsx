import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { TopicConversationContext } from "./topic-conversation-context";
import {
	evidenceSession,
	makeEvidence,
	wire,
} from "./topic-evidence.test-fixtures";
import { deferred, reviewSession } from "./topic-review.test-fixtures";
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

async function inspect(user: ReturnType<typeof userEvent.setup>) {
	const trigger = await screen.findByRole("button", {
		name: "Inspect conversations for Northwind Migration",
	});
	await user.click(trigger);
	const dialog = await screen.findByRole("dialog");
	await within(dialog).findByRole("heading", {
		name: "TLS certificate renewal",
	});
	return { trigger, dialog };
}

afterEach(cleanup);

describe("onboarding conversation review", () => {
	it("opens real examples, reads source context only on demand, and returns keyboard focus", async () => {
		const session = evidenceSession();
		const user = userEvent.setup();
		render(step(session.actions));
		const { trigger, dialog } = await inspect(user);
		expect(within(dialog).getByText(/2023/)).toBeVisible();
		expect(within(dialog).getByText(/2 examples are hidden/)).toBeVisible();
		expect(
			session.run.mock.calls.some(([request]) =>
				request.startsWith("BrainGetThreadMessages"),
			),
		).toBe(false);
		await user.click(
			within(dialog).getByRole("button", {
				name: "Read recent messages",
			}),
		);
		expect(
			await within(dialog).findByText("Please renew the certificate."),
		).toBeVisible();
		expect(
			within(dialog).getByText(/Showing the five most recent/),
		).toBeVisible();
		expect(
			within(dialog).getByRole("link", { name: "Open in Outlook" }),
		).toHaveAttribute("href", "https://outlook.office.com/mail/message-1");
		await user.click(
			within(dialog).getByRole("button", { name: "Done reviewing" }),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
		expect(
			session.run.mock.calls.some(
				([request]) =>
					request.startsWith("BrainApply") ||
					request.startsWith("RunAgent"),
			),
		).toBe(false);
	});

	it("previews a rejection, preserves profile edits, and undoes only the conversation choice", async () => {
		const session = evidenceSession();
		const user = userEvent.setup();
		render(step(session.actions));
		const description = await screen.findAllByRole("textbox", {
			name: "What this topic covers",
		});
		await user.clear(description[0]);
		await user.type(description[0], "Northwind rollout only.");
		const { dialog } = await inspect(user);
		await user.click(
			within(dialog).getByRole("button", {
				name: /Does not belong here/,
			}),
		);
		expect(
			await within(dialog).findByText("Keep out of Northwind Migration"),
		).toBeVisible();
		expect(within(dialog).getByText("Client A · primary")).toBeVisible();
		await user.click(
			within(dialog).getByRole("button", {
				name: "Undo last correction",
			}),
		);
		await waitFor(() =>
			expect(
				within(dialog).queryByText("After saving this setup"),
			).not.toBeInTheDocument(),
		);
		await user.click(
			within(dialog).getByRole("button", { name: "Done reviewing" }),
		);
		expect(
			screen.getAllByRole("textbox", {
				name: "What this topic covers",
			})[0],
		).toHaveValue("Northwind rollout only.");
		expect(session.saved?.draft.corrections).toEqual([]);
	});

	it.each(["Move", "Also link"] as const)(
		"previews %s with an explicit destination and keeps unrelated links",
		async (action) => {
			const session = evidenceSession();
			const user = userEvent.setup();
			const onNext = vi.fn();
			render(step(session.actions, onNext));
			const { dialog } = await inspect(user);
			const select = within(dialog).getByRole("combobox", {
				name: "Another topic for this conversation",
			});
			select.focus();
			await user.keyboard("{Enter}");
			await waitFor(() =>
				expect(
					screen.getByRole("option", { name: "Platform Operations" }),
				).toHaveFocus(),
			);
			await user.keyboard("{Enter}");
			await user.click(
				within(dialog).getByRole("button", { name: action }),
			);
			expect(
				await within(dialog).findByText(
					action === "Move"
						? "Platform Operations · primary"
						: "Northwind Migration · primary",
				),
			).toBeVisible();
			expect(within(dialog).getByText("Client A")).toBeVisible();
			const request = session.run.mock.calls.find(([statement]) =>
				statement.startsWith("BrainChangeTopicReview("),
			)?.[0];
			expect(request).toContain(
				action === "Move" ? '"type":"move"' : '"type":"also_link"',
			);
			expect(request).toContain('"targetKey":"topic-2"');
			expect(request).toContain(
				'"versions":{"thread-1":"relationship-version-1"}',
			);
			expect(onNext).not.toHaveBeenCalled();
		},
	);

	it("retries an uncertain correction with the same operation ID and blocks other choices meanwhile", async () => {
		const session = evidenceSession();
		session.afterChange.mockRejectedValueOnce(
			new Error("Connection lost after the correction was saved"),
		);
		const user = userEvent.setup();
		render(step(session.actions));
		const { dialog } = await inspect(user);
		await user.click(
			within(dialog).getByRole("button", { name: /Belongs here in/ }),
		);
		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Connection lost",
		);
		expect(
			within(dialog).getByRole("button", {
				name: /Does not belong here/,
			}),
		).toBeDisabled();
		await user.click(within(dialog).getByRole("button", { name: "Retry" }));
		expect(
			await within(dialog).findByText("After saving this setup"),
		).toBeVisible();
		const requests = session.run.mock.calls
			.filter(([statement]) =>
				statement.startsWith("BrainChangeTopicReview("),
			)
			.map(([statement]) => statement);
		expect(requests).toHaveLength(2);
		expect(requests[1]).toBe(requests[0]);
		expect(session.saved?.revision).toBe(2);
	});

	it("recovers the authoritative draft after a conflict without firing a second correction", async () => {
		const session = evidenceSession();
		session.afterChange.mockRejectedValueOnce(
			new Error("Refresh before correcting this conversation"),
		);
		const user = userEvent.setup();
		render(step(session.actions));
		const { dialog } = await inspect(user);
		await user.click(
			within(dialog).getByRole("button", {
				name: /Does not belong here/,
			}),
		);
		await within(dialog).findByRole("alert");
		await user.click(
			within(dialog).getByRole("button", { name: "Reload saved review" }),
		);
		await waitFor(() =>
			expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument(),
		);
		expect(
			within(dialog).getByText("Keep out of Northwind Migration"),
		).toBeVisible();
		expect(session.afterChange).toHaveBeenCalledOnce();
	});

	it("keeps the evidence dialog open while a correction acknowledgement is pending", async () => {
		const session = evidenceSession();
		const pending = deferred<void>();
		session.afterChange.mockImplementationOnce(() => pending.promise);
		const user = userEvent.setup();
		render(step(session.actions));
		const { dialog } = await inspect(user);
		await user.click(
			within(dialog).getByRole("button", { name: /Belongs here in/ }),
		);
		expect(
			within(dialog).getByRole("button", { name: "Done reviewing" }),
		).toBeDisabled();
		await user.keyboard("{Escape}");
		expect(dialog).toBeVisible();
		await act(async () => pending.resolve());
		await waitFor(() =>
			expect(
				within(dialog).getByRole("button", { name: "Done reviewing" }),
			).toBeEnabled(),
		);
	});

	it("searches on Enter without submitting the onboarding form", async () => {
		const session = evidenceSession();
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		const { dialog } = await inspect(user);
		await user.type(
			within(dialog).getByRole("textbox", {
				name: "Search conversation subjects",
			}),
			"unmatched{Enter}",
		);
		expect(
			await within(dialog).findByText(
				/No readable conversation examples/,
			),
		).toBeVisible();
		expect(onNext).not.toHaveBeenCalled();
		expect(
			session.run.mock.calls.some(([statement]) =>
				statement.startsWith("BrainApply"),
			),
		).toBe(false);
	});

	it("allows Teams context reading while blocking a whole-chat correction", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(async (review, key) => {
			const page = makeEvidence(review, key);
			page.items[0].source = "teams";
			page.items[0].canCorrect = false;
			return page;
		});
		const user = userEvent.setup();
		render(step(session.actions));
		const { dialog } = await inspect(user);
		expect(
			within(dialog).getByRole("button", { name: /Belongs here in/ }),
		).toBeDisabled();
		expect(
			within(dialog).getByRole("button", {
				name: /Does not belong here/,
			}),
		).toBeDisabled();
		expect(
			within(dialog).getByRole("button", {
				name: "Read recent messages",
			}),
		).toBeEnabled();
		expect(
			within(dialog).getByText(/This chat may span several topics/),
		).toBeVisible();
	});

	it("ignores a correction response after switching to another authenticated insight", async () => {
		const old = evidenceSession();
		const current = reviewSession();
		const pending = deferred<void>();
		old.afterChange.mockImplementationOnce(() => pending.promise);
		const user = userEvent.setup();
		const view = render(step(old.actions));
		const { dialog } = await inspect(user);
		await user.click(
			within(dialog).getByRole("button", {
				name: /Does not belong here/,
			}),
		);
		view.rerender(step(current.actions));
		await screen.findByDisplayValue("Northwind Migration");
		await act(async () => pending.resolve());
		expect(
			screen.queryByText("Keep out of Northwind Migration"),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(current.saved?.draft.corrections).toBeUndefined();
	});

	it("hides previous source text immediately when the conversation changes", async () => {
		const pending = deferred<ReturnType<typeof wire>>();
		const run = vi.fn(async (statement: string) => {
			if (statement.includes("thread-2")) return pending.promise;
			return wire({
				threadId: "thread-1",
				source: "email",
				messages: [
					{
						id: "m-1",
						text: "Old conversation text",
						at: "2023-10-12T09:00:00Z",
					},
				],
				hiddenCount: 0,
				unavailableCount: 0,
				hasMore: false,
			});
		});
		const actions = { run } as unknown as InsightActions;
		const view = render(
			<TopicConversationContext actions={actions} threadId="thread-1" />,
		);
		await screen.findByText("Old conversation text");
		view.rerender(
			<TopicConversationContext actions={actions} threadId="thread-2" />,
		);
		expect(
			screen.queryByText("Old conversation text"),
		).not.toBeInTheDocument();
		await act(async () =>
			pending.resolve(
				wire({
					threadId: "thread-2",
					source: "email",
					messages: [{ id: "m-2", text: "Current text" }],
					hiddenCount: 0,
					unavailableCount: 0,
					hasMore: false,
				}),
			),
		);
		expect(await screen.findByText("Current text")).toBeVisible();
	});
});
