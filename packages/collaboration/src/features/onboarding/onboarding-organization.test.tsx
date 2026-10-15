import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { makeEvidence } from "./topic-evidence.test-fixtures";
import {
	organizationReview,
	organizationSession,
	packet,
} from "./topic-organization.test-fixtures";
import {
	makeAreaReview,
	nextStage,
	press,
	reviewSession,
} from "./topic-review.test-fixtures";
import type { SetupChange } from "./topic-setup-api";
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

const SAVED = { timeout: 3000 };
// a right arrow, kept out of the source as a literal
const ARROW = String.fromCharCode(8594);

const change = (extra: Partial<SetupChange>): SetupChange => ({
	type: "edit_topic",
	topicKey: "",
	topicKeys: [],
	name: "",
	description: "",
	addTerms: [],
	addPeople: [],
	removePeople: [],
	reason: "",
	...extra,
});

/** The organization fixture plus a scripted chat reply and topics with no conversations. */
function assistantSession(
	changes: SetupChange[],
	initial = organizationReview(),
) {
	const session = organizationSession(initial);
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("BrainTopicReviewChat(")) {
			if (!session.saved) throw new Error("Review not found");
			return packet({
				reviewId: session.saved.id,
				revision: session.saved.revision,
				reply: "Here is what I would change.",
				changes,
			});
		}
		if (statement.startsWith("BrainGetTopicReviewEvidence(")) {
			if (!session.saved) throw new Error("Review not found");
			const key = JSON.parse(
				statement.match(/topicKey=(\[[^\]]+\])/)?.[1] || "[]",
			)[0] as string;
			return packet(makeEvidence(session.saved, key, { total: 0 }));
		}
		return session.run(statement);
	});
	return { session, run, actions: { run } as unknown as InsightActions };
}

async function askAssistant(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole("button", { name: "Ask the assistant" }));
	await user.type(
		await screen.findByRole("textbox", {
			name: "Message the setup assistant",
		}),
		"Recruiting is one area.",
	);
	await user.click(screen.getByRole("button", { name: "Send" }));
}

async function openCombinePreview(user: ReturnType<typeof userEvent.setup>) {
	await askAssistant(user);
	await user.click(await screen.findByRole("button", { name: "Apply" }));
	return screen.findByRole("dialog", {
		name: "Review your grouping changes",
	});
}

const combine = change({
	type: "combine",
	topicKeys: ["topic-1", "topic-2"],
	name: "Recruiting",
	description: "Recruiting across UNC and VCU.",
	reason: "The same recruiting area.",
});

beforeEach(() => {
	vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

const statements = (run: { mock: { calls: unknown[][] } }, reactor: string) =>
	run.mock.calls
		.map(([statement]) => String(statement))
		.filter((statement) => statement.startsWith(`${reactor}(`));

describe("regrouping areas without the assistant", () => {
	it("saves pending edits first, then regroups against the new revision", async () => {
		const session = reviewSession(async () => makeAreaReview());
		const user = userEvent.setup();
		render(step(session.actions));
		await user.click(
			await screen.findByRole("checkbox", {
				name: "Platform Operations",
			}),
		);
		await user.click(
			screen.getByRole("button", { name: "Keep these separate" }),
		);
		await screen.findByRole("button", { name: "Combine into one topic" });
		const calls = session.run.mock.calls.map(([statement]) => statement);
		const save = calls.findIndex((statement) =>
			statement.startsWith("BrainSaveTopicReview("),
		);
		const regroup = calls.findIndex((statement) =>
			statement.startsWith("BrainSetTopicArea("),
		);
		expect(save).toBeGreaterThan(-1);
		expect(regroup).toBeGreaterThan(save);
		expect(calls[regroup]).toContain("revision=[2]");
		// the earlier edit survives the regroup
		expect(
			screen.getByRole("checkbox", { name: "Platform Operations" }),
		).not.toBeChecked();
		expect(
			session.saved?.draft.topics.find((topic) => topic.key === "topic-3")
				?.keep,
		).toBe(false);
	});

	it("changes which topics the next steps list", async () => {
		const session = reviewSession(async () => makeAreaReview());
		const user = userEvent.setup();
		render(step(session.actions));
		await user.click(
			await screen.findByRole("button", { name: "Keep these separate" }),
		);
		await screen.findByRole("checkbox", { name: "VCU Hiring" });
		await nextStage(user, "people");
		expect(screen.getByText("UNC Recruiting")).toBeVisible();
		expect(screen.getByText("VCU Hiring")).toBeVisible();
		expect(screen.queryByText("Recruiting")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Back" }));
		await user.click(
			await screen.findByRole("button", {
				name: "Combine into one topic",
			}),
		);
		await screen.findByRole("button", { name: "Keep these separate" });
		await nextStage(user, "people");
		expect(screen.getByText("Recruiting")).toBeVisible();
		expect(screen.queryByText("VCU Hiring")).not.toBeInTheDocument();
		expect(screen.queryByText("UNC Recruiting")).not.toBeInTheDocument();
	});

	it("keeps the area as it was and says why when regrouping fails", async () => {
		const session = reviewSession(async () => makeAreaReview());
		const run = vi.fn(async (statement: string) => {
			if (statement.startsWith("BrainSetTopicArea("))
				throw new Error("Could not regroup these topics");
			return session.run(statement);
		});
		const user = userEvent.setup();
		render(step({ run } as unknown as InsightActions));
		await user.click(
			await screen.findByRole("button", { name: "Keep these separate" }),
		);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Could not regroup these topics",
		);
		expect(
			screen.getByRole("button", { name: "Keep these separate" }),
		).toBeEnabled();
		expect(
			screen.getByRole("button", { name: "Reload saved topics" }),
		).toBeEnabled();
		expect(
			screen.queryByRole("checkbox", { name: "VCU Hiring" }),
		).not.toBeInTheDocument();
	});
});

describe("setup assistant", () => {
	it("applies several proposed changes to the draft at once", async () => {
		const { session, actions } = assistantSession([
			change({
				type: "edit_topic",
				topicKey: "topic-1",
				name: "Campus Hiring",
				addTerms: ["campus"],
			}),
			change({ type: "skip", topicKey: "topic-3" }),
			change({
				type: "add_topic",
				name: "Backend Hiring",
				description: "Engineering recruiting.",
			}),
		]);
		const user = userEvent.setup();
		render(step(actions));
		await screen.findByRole("heading", { name: "Your main areas of work" });
		await askAssistant(user);
		expect(await screen.findByText("Update UNC Recruiting")).toBeVisible();
		expect(screen.getByText("Skip Northwind Delivery")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Apply all" }));
		const chat = screen.getByRole("dialog", { name: "Setup assistant" });
		await waitFor(() =>
			expect(within(chat).getAllByText("Done")).toHaveLength(3),
		);
		await user.keyboard("{Escape}");
		expect(
			await screen.findByRole("checkbox", { name: "Campus Hiring" }),
		).toBeChecked();
		expect(
			screen.getByRole("checkbox", { name: "Northwind Delivery" }),
		).not.toBeChecked();
		expect(
			screen.getByRole("checkbox", { name: "Backend Hiring" }),
		).toBeChecked();
		await waitFor(
			() =>
				expect(
					session.saved?.draft.topics.map((topic) => [
						topic.name,
						topic.keep,
					]),
				).toEqual([
					["Campus Hiring", true],
					["VCU Hiring", true],
					["Northwind Delivery", false],
					["Backend Hiring", true],
				]),
			SAVED,
		);
		expect(session.saved?.draft.topics[0].terms).toBe("UNC\ncampus");
		// the assistant proposes; only saving the topics applies anything
		expect(session.saved?.appliedRevision).toBeNull();
	});

	it("previews a proposed combination, then adds it to the draft and files it on Save", async () => {
		const { session, actions, run } = assistantSession([combine]);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(actions, onNext));
		await screen.findByRole("heading", { name: "Your main areas of work" });
		const preview = await openCombinePreview(user);
		expect(
			within(preview).getByText(`3 topics ${ARROW} 2 topics kept`),
		).toBeVisible();
		expect(
			within(preview).getByRole("heading", { name: "Recruiting" }),
		).toBeVisible();
		expect(session.saved?.appliedRevision).toBeNull();
		expect(statements(run, "BrainChangeTopicReview")).toHaveLength(0);

		await user.click(
			within(preview).getByRole("button", {
				name: "Use this grouping in my draft",
			}),
		);
		await waitFor(() =>
			expect(
				screen.queryByRole("dialog", {
					name: "Review your grouping changes",
				}),
			).not.toBeInTheDocument(),
		);
		await user.keyboard("{Escape}");
		expect(await screen.findByText("2 topics kept")).toBeVisible();
		expect(
			session.saved?.draft.topics.find(
				(topic) => topic.key === "topic-2",
			),
		).toMatchObject({ keep: false, mergedIntoKey: "topic-1" });
		expect(session.saved?.appliedRevision).toBeNull();
		expect(session.afterApply).not.toHaveBeenCalled();

		await nextStage(user, "people");
		await nextStage(user, "conversations");
		await press(user, "Looks right, next topic");
		await press(user, "Looks right, finish");
		await user.click(
			await screen.findByRole("button", { name: "Save 2 topics" }),
		);
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(session.saved?.result.topics.map((topic) => topic.name)).toEqual(
			["Recruiting", "Northwind Delivery"],
		);
		expect(session.saved?.result.merges).toHaveLength(1);
	});

	it("shows a blocked combination honestly and does not change the draft", async () => {
		const { session, actions } = assistantSession([combine]);
		session.afterPreview.mockImplementationOnce(async (preview) => ({
			...preview,
			groups: preview.groups.map((group) => ({
				...group,
				canApply: false,
				reason: "Saved Teams links need exchange-aware combination.",
			})),
		}));
		const user = userEvent.setup();
		render(step(actions));
		await screen.findByRole("heading", { name: "Your main areas of work" });
		const preview = await openCombinePreview(user);
		expect(
			within(preview).getByText(/Saved Teams links need/),
		).toBeVisible();
		expect(
			within(preview).getByRole("button", {
				name: "Use this grouping in my draft",
			}),
		).toBeDisabled();
		expect(session.afterChange).not.toHaveBeenCalled();
	});

	it("recovers a committed combination after a lost response before anything older is saved", async () => {
		const { session, actions, run } = assistantSession([combine]);
		session.afterChange.mockRejectedValueOnce(
			new Error("Connection lost after grouping was saved"),
		);
		const user = userEvent.setup();
		render(step(actions));
		await screen.findByRole("heading", { name: "Your main areas of work" });
		const preview = await openCombinePreview(user);
		await user.click(
			within(preview).getByRole("button", {
				name: "Use this grouping in my draft",
			}),
		);
		expect(await within(preview).findByRole("alert")).toHaveTextContent(
			"Connection lost",
		);
		await user.click(
			within(preview).getByRole("button", { name: "Back to topics" }),
		);
		await user.keyboard("{Escape}");
		await user.click(await screen.findByRole("button", { name: "Retry" }));
		expect(await screen.findByText("2 topics kept")).toBeVisible();
		// the server already had it, so the change is not sent twice
		expect(statements(run, "BrainChangeTopicReview")).toHaveLength(1);
		expect(statements(run, "BrainGetTopicReview")).toHaveLength(1);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("tells you when a proposal no longer fits your topics", async () => {
		const { actions } = assistantSession([
			change({ type: "skip", topicKey: "topic-unknown" }),
		]);
		const user = userEvent.setup();
		render(step(actions));
		await screen.findByRole("heading", { name: "Your main areas of work" });
		await askAssistant(user);
		await user.click(await screen.findByRole("button", { name: "Apply" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"no longer fits your topics",
		);
	});
});

describe("saved topics that changed during setup", () => {
	const conflict = {
		topicKey: "topic-1",
		profileVersion: "b".repeat(64),
		exists: true,
		canReconcile: true,
		reason: "",
		savedProfile: {
			name: "External Recruiting",
			short: "Talent",
			description: "Edited in another view",
			terms: "External clue",
			kind: "internal",
			status: "active",
			people: [],
		},
	};

	it.each(["saved", "draft"] as const)(
		"holds Save until you choose the %s profile",
		async (choice) => {
			const initial = organizationReview();
			initial.profileConflicts = [conflict];
			const { session, actions } = assistantSession([], initial);
			const user = userEvent.setup();
			render(step(actions));
			await screen.findByRole("heading", {
				name: "Your main areas of work",
			});
			await nextStage(user, "people");
			await nextStage(user, "conversations");
			for (const name of [
				"Looks right, next topic",
				"Looks right, next topic",
				"Looks right, finish",
			])
				await press(user, name);
			expect(
				await screen.findByText("Saved topics changed during setup"),
			).toBeVisible();
			expect(
				screen.getByRole("button", { name: "Save 3 topics" }),
			).toBeDisabled();
			await user.click(
				screen.getByRole("button", {
					name: "Compare changes to UNC Recruiting",
				}),
			);
			await user.click(
				screen.getByRole("button", {
					name:
						choice === "saved"
							? "Use saved profile"
							: "Keep my draft profile",
				}),
			);
			await waitFor(() =>
				expect(
					screen.queryByText("Saved topics changed during setup"),
				).not.toBeInTheDocument(),
			);
			expect(
				screen.getByText(
					choice === "saved"
						? "External Recruiting"
						: "UNC Recruiting",
				),
			).toBeVisible();
			expect(
				screen.getByRole("button", { name: "Save 3 topics" }),
			).toBeEnabled();
			expect(session.afterApply).not.toHaveBeenCalled();
		},
	);
});
