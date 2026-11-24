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
import {
	organizationReview,
	organizationSession,
} from "./topic-organization.test-fixtures";
import {
	checkTopics,
	makeAreaReview,
	nextStage,
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

// a right arrow, kept out of the source as a literal
const ARROW = String.fromCharCode(8594);

/** Opens the Check stage of a draft whose kept topics were set up in the builder. */
async function openCheck(actions: InsightActions, onNext = vi.fn()) {
	const user = userEvent.setup();
	render(step(actions, onNext));
	await screen.findByRole("heading", { name: "Your main areas of work" });
	await checkTopics(user);
	return user;
}

/** Ticks the two recruiting topics and opens the preview of combining them. */
async function openCombinePreview(user: ReturnType<typeof userEvent.setup>) {
	await user.click(
		screen.getByRole("checkbox", {
			name: "Select UNC Recruiting to combine",
		}),
	);
	await user.click(
		screen.getByRole("checkbox", { name: "Select VCU Hiring to combine" }),
	);
	await user.click(screen.getByRole("button", { name: "Combine into one" }));
	return screen.findByRole("dialog", {
		name: "Review your grouping changes",
	});
}

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

describe("regrouping areas", () => {
	it("saves pending edits first, then regroups against the new revision", async () => {
		const session = reviewSession(async () =>
			setUpInBuilder(makeAreaReview()),
		);
		const user = await openCheck(session.actions);
		await user.click(
			screen.getByRole("button", { name: "Take Bo Chen off" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Keep these separate" }),
		);
		await screen.findByRole("button", {
			name: "Combine back into one topic",
		});
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
			screen.getByRole("button", { name: "Put Bo Chen back" }),
		).toBeVisible();
		expect(
			session.saved?.draft.topics.find((topic) => topic.key === "topic-1")
				?.removedPeople,
		).toEqual(["p-2"]);
	});

	it("changes which topics the Done stage lists", async () => {
		const session = reviewSession(async () =>
			setUpInBuilder(makeAreaReview()),
		);
		const user = await openCheck(session.actions);
		await user.click(
			screen.getByRole("button", { name: "Keep these separate" }),
		);
		await screen.findByRole("checkbox", {
			name: "Select VCU Hiring to combine",
		});
		await nextStage(user, "done");
		await screen.findByRole("heading", { name: "Ready to file" });
		expect(screen.getByText("UNC Recruiting")).toBeVisible();
		expect(screen.getByText("VCU Hiring")).toBeVisible();
		expect(screen.queryByText("Recruiting")).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Back" }));
		await user.click(
			await screen.findByRole("button", {
				name: "Combine back into one topic",
			}),
		);
		await screen.findByRole("button", { name: "Keep these separate" });
		await nextStage(user, "done");
		await screen.findByRole("heading", { name: "Ready to file" });
		expect(screen.getByText("Recruiting")).toBeVisible();
		expect(screen.queryByText("VCU Hiring")).not.toBeInTheDocument();
		expect(screen.queryByText("UNC Recruiting")).not.toBeInTheDocument();
	});

	it("keeps the area as it was and says why when regrouping fails", async () => {
		const session = reviewSession(async () =>
			setUpInBuilder(makeAreaReview()),
		);
		const run = vi.fn(async (statement: string) => {
			if (statement.startsWith("BrainSetTopicArea("))
				throw new Error("Could not regroup these topics");
			return session.run(statement);
		});
		const user = await openCheck({ run } as unknown as InsightActions);
		await user.click(
			screen.getByRole("button", { name: "Keep these separate" }),
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
			screen.queryByRole("checkbox", {
				name: "Select VCU Hiring to combine",
			}),
		).not.toBeInTheDocument();
	});
});

describe("combining topics", () => {
	it("previews a combination, then adds it to the draft and files it on Save", async () => {
		const session = organizationSession(
			setUpInBuilder(organizationReview()),
		);
		const onNext = vi.fn();
		const user = await openCheck(session.actions, onNext);
		const preview = await openCombinePreview(user);
		expect(
			within(preview).getByText(`3 topics ${ARROW} 2 topics kept`),
		).toBeVisible();
		expect(
			within(preview).getByRole("heading", { name: "UNC Recruiting" }),
		).toBeVisible();
		expect(session.saved?.appliedRevision).toBeNull();
		expect(statements(session.run, "BrainChangeTopicReview")).toHaveLength(
			0,
		);

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
		expect((await screen.findAllByText("2 topics kept"))[0]).toBeVisible();
		expect(
			session.saved?.draft.topics.find(
				(topic) => topic.key === "topic-2",
			),
		).toMatchObject({ keep: false, mergedIntoKey: "topic-1" });
		expect(session.saved?.appliedRevision).toBeNull();
		expect(session.afterApply).not.toHaveBeenCalled();

		await nextStage(user, "done");
		await user.click(
			await screen.findByRole("button", { name: "Save 2 topics" }),
		);
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(session.saved?.result.topics.map((topic) => topic.name)).toEqual(
			["UNC Recruiting", "Northwind Delivery"],
		);
		expect(session.saved?.result.merges).toHaveLength(1);
	});

	it("shows a blocked combination honestly and does not change the draft", async () => {
		const session = organizationSession(
			setUpInBuilder(organizationReview()),
		);
		session.afterPreview.mockImplementationOnce(async (preview) => ({
			...preview,
			groups: preview.groups.map((group) => ({
				...group,
				canApply: false,
				reason: "Saved Teams links need exchange-aware combination.",
			})),
		}));
		const user = await openCheck(session.actions);
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
		const session = organizationSession(
			setUpInBuilder(organizationReview()),
		);
		session.afterChange.mockRejectedValueOnce(
			new Error("Connection lost after grouping was saved"),
		);
		const user = await openCheck(session.actions);
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
		await user.click(await screen.findByRole("button", { name: "Retry" }));
		expect((await screen.findAllByText("2 topics kept"))[0]).toBeVisible();
		// the server already had it, so the change is not sent twice
		expect(statements(session.run, "BrainChangeTopicReview")).toHaveLength(
			1,
		);
		expect(statements(session.run, "BrainGetTopicReview")).toHaveLength(1);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
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
			const initial = setUpInBuilder(organizationReview());
			initial.profileConflicts = [conflict];
			const session = organizationSession(initial);
			const user = await openCheck(session.actions);
			await nextStage(user, "done");
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
