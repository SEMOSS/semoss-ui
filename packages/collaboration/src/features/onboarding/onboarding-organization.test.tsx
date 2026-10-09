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
import {
	organizationReview,
	organizationSession,
} from "./topic-organization.test-fixtures";
import type {
	TopicOrganizationPreview,
	TopicOrganizationProposal,
} from "./topic-organization-api";
import { deferred } from "./topic-review.test-fixtures";
import { TopicsStep } from "./topics-step";

function step(actions: InsightActions, onNext = vi.fn(), onBack = vi.fn()) {
	return (
		<StrictMode>
			<TopicsStep
				actions={actions}
				onNext={onNext}
				onBack={onBack}
				eyebrow="Step 7 of 8"
			/>
		</StrictMode>
	);
}

afterEach(cleanup);

describe("owner-guided topic setup", () => {
	it("keeps a large review compact and opens the invalid collapsed profile before focusing its error", async () => {
		const session = organizationSession(organizationReview(25));
		const user = userEvent.setup();
		render(step(session.actions));
		await screen.findByDisplayValue("UNC Recruiting");
		expect(
			screen.getAllByRole("textbox", { name: "Topic name" }),
		).toHaveLength(1);
		await user.click(
			screen.getByRole("button", { name: "Edit Project 25" }),
		);
		const name = screen.getByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.click(
			screen.getByRole("button", { name: "Edit UNC Recruiting" }),
		);
		await user.click(
			screen.getByRole("button", { name: "Keep 25 topics" }),
		);
		await screen.findByText(
			"Name this topic or turn off Keep before continuing",
		);
		expect(
			screen.getAllByRole("textbox", { name: "Topic name" }),
		).toHaveLength(1);
		expect(
			screen.getByRole("textbox", { name: "Topic name" }),
		).toHaveFocus();
		expect(screen.getByRole("textbox", { name: "Topic name" })).toHaveValue(
			"",
		);
		expect(session.afterApply).not.toHaveBeenCalled();
	});

	it("saves free-text context and the owner's preferred detail across Back and remount", async () => {
		const session = organizationSession();
		const onBack = vi.fn();
		const user = userEvent.setup();
		const first = render(step(session.actions, vi.fn(), onBack));
		await screen.findByDisplayValue("UNC Recruiting");
		await user.type(
			screen.getByRole("textbox", {
				name: "Give the assistant some context (optional)",
			}),
			"Recruiting with John M and Taylor J: UNC + VCU. Client A with Jim and Hank.",
		);
		screen
			.getByRole("combobox", { name: "How broad should your topics be?" })
			.focus();
		await user.keyboard("{ArrowDown}");
		await user.click(
			screen.getByRole("option", {
				name: "Individual projects and clients",
			}),
		);
		await user.click(screen.getByRole("button", { name: "Back" }));
		await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
		first.unmount();
		render(step(session.actions));
		expect(
			await screen.findByDisplayValue(/Recruiting with John M/),
		).toBeEnabled();
		expect(
			screen.getByRole("combobox", {
				name: "How broad should your topics be?",
			}),
		).toHaveTextContent("Individual projects and clients");
		expect(session.afterSuggest).not.toHaveBeenCalled();
	});

	it("reviews and edits an assistant proposal, previews saved impact, and changes only the draft until final save", async () => {
		const session = organizationSession();
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		await screen.findByDisplayValue("UNC Recruiting");
		await user.click(
			screen.getByRole("button", { name: "Suggest a better grouping" }),
		);
		const proposed = await screen.findByRole("dialog", {
			name: "Suggested topic groups",
		});
		expect(within(proposed).getByText(/3 topics → 2 topics/)).toBeVisible();
		expect(
			session.saved?.draft.topics.filter((topic) => topic.keep),
		).toHaveLength(3);
		await user.click(
			within(proposed).getByRole("checkbox", {
				name: "Use Northwind Delivery",
			}),
		);
		await user.click(
			within(proposed).getByRole("button", {
				name: "Edit proposed Recruiting",
			}),
		);
		await user.clear(
			within(proposed).getByRole("textbox", {
				name: "Proposed topic name",
			}),
		);
		await user.type(
			within(proposed).getByRole("textbox", {
				name: "Proposed topic name",
			}),
			"Campus Talent",
		);
		expect(document.querySelector("form form")).toBeNull();
		await user.click(
			within(proposed).getByRole("button", {
				name: "Preview selected changes",
			}),
		);
		const preview = await screen.findByRole("dialog", {
			name: "Review your grouping changes",
		});
		expect(
			within(preview).getByRole("heading", { name: "Campus Talent" }),
		).toBeVisible();
		expect(
			within(preview).getByText(/1 Work items and 3 checklist steps/),
		).toBeVisible();
		expect(session.saved?.appliedRevision).toBeNull();
		await user.click(
			within(preview).getByRole("button", {
				name: "Use this grouping in my draft",
			}),
		);
		await screen.findByRole("button", { name: "Keep 2 topics" });
		expect(
			screen.getByRole("button", { name: "Edit Northwind Delivery" }),
		).toBeEnabled();
		expect(session.saved?.appliedRevision).toBeNull();
		expect(session.afterApply).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Keep 2 topics" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(session.saved?.result.topics.map((topic) => topic.name)).toEqual(
			["Campus Talent", "Northwind Delivery"],
		);
		expect(session.saved?.result.merges).toHaveLength(1);
	});

	it("lets the owner remove one contributor without dropping that topic from setup", async () => {
		const session = organizationSession();
		const user = userEvent.setup();
		render(step(session.actions));
		await screen.findByDisplayValue("UNC Recruiting");
		await user.click(
			screen.getByRole("button", { name: "Suggest a better grouping" }),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Suggested topic groups",
		});
		await user.click(
			within(dialog).getByRole("button", {
				name: "Edit proposed Recruiting",
			}),
		);
		await user.click(
			within(dialog).getByRole("checkbox", { name: "VCU Hiring" }),
		);
		expect(within(dialog).getByText(/3 topics → 3 topics/)).toBeVisible();
		await user.click(
			within(dialog).getByRole("button", {
				name: "Preview selected changes",
			}),
		);
		const preview = await screen.findByRole("dialog", {
			name: "Review your grouping changes",
		});
		await user.click(
			within(preview).getByRole("button", {
				name: "Use this grouping in my draft",
			}),
		);
		await screen.findByRole("button", { name: "Keep 3 topics" });
		expect(
			screen.getByRole("button", { name: "Edit VCU Hiring" }),
		).toBeEnabled();
	});

	it("combines directly without the assistant and retains selected aliases until the owner edits them", async () => {
		const session = organizationSession();
		const user = userEvent.setup();
		render(step(session.actions));
		await screen.findByDisplayValue("UNC Recruiting");
		await user.click(
			screen.getByRole("button", {
				name: "Combine UNC Recruiting with other topics",
			}),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Combine overlapping topics",
		});
		await user.click(
			within(dialog).getByRole("button", { name: "Preview combination" }),
		);
		expect(await within(dialog).findByRole("alert")).toHaveTextContent(
			"Choose at least two",
		);
		await user.click(
			within(dialog).getByRole("checkbox", { name: "VCU Hiring" }),
		);
		const clues = within(dialog).getByRole("textbox", {
			name: "Project names and other clues (optional)",
		});
		expect(clues).toHaveValue("UNC\nVCU");
		await user.clear(clues);
		await user.type(clues, "Campus hiring");
		await user.click(
			within(dialog).getByRole("checkbox", {
				name: "Northwind Delivery",
			}),
		);
		expect(clues).toHaveValue("Campus hiring");
		await user.click(
			within(dialog).getByRole("button", { name: "Preview combination" }),
		);
		const preview = await screen.findByRole("dialog", {
			name: "Review your grouping changes",
		});
		expect(
			within(preview).getByText("3 topics → 1 topics kept"),
		).toBeVisible();
		await user.click(
			within(preview).getByRole("button", { name: "Back to topics" }),
		);
		expect(session.afterSuggest).not.toHaveBeenCalled();
		expect(
			session.saved?.draft.topics.filter((topic) => topic.keep),
		).toHaveLength(3);
	});

	it("restores contributing topics with Undo while preserving a later owner name", async () => {
		const session = organizationSession();
		const user = userEvent.setup();
		render(step(session.actions));
		await screen.findByDisplayValue("UNC Recruiting");
		await user.click(
			screen.getByRole("button", { name: "Suggest a better grouping" }),
		);
		await screen.findByRole("dialog", { name: "Suggested topic groups" });
		await user.click(
			screen.getByRole("button", { name: "Preview selected changes" }),
		);
		await screen.findByRole("dialog", {
			name: "Review your grouping changes",
		});
		await user.click(
			screen.getByRole("button", {
				name: "Use this grouping in my draft",
			}),
		);
		await screen.findByRole("button", { name: "Keep 2 topics" });
		const name = screen.getByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Owner's Talent Area");
		await user.click(
			screen.getByRole("button", { name: "Undo last change" }),
		);
		await screen.findByRole("button", { name: "Keep 3 topics" });
		expect(screen.getByRole("textbox", { name: "Topic name" })).toHaveValue(
			"Owner's Talent Area",
		);
		expect(
			screen.getByRole("button", { name: "Edit VCU Hiring" }),
		).toBeEnabled();
		expect(session.afterApply).not.toHaveBeenCalled();
	});

	it("recovers a committed grouping after response loss before resubmitting an older draft", async () => {
		const session = organizationSession();
		const user = userEvent.setup();
		session.afterChange.mockRejectedValueOnce(
			new Error("Connection lost after grouping was saved"),
		);
		render(step(session.actions));
		await screen.findByDisplayValue("UNC Recruiting");
		await user.click(
			screen.getByRole("button", { name: "Suggest a better grouping" }),
		);
		await screen.findByRole("dialog", { name: "Suggested topic groups" });
		await user.click(
			screen.getByRole("button", { name: "Preview selected changes" }),
		);
		const preview = await screen.findByRole("dialog", {
			name: "Review your grouping changes",
		});
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
		await user.click(screen.getByRole("button", { name: "Retry" }));
		await screen.findByRole("button", { name: "Keep 2 topics" });
		expect(
			session.run.mock.calls.filter(([statement]) =>
				statement.startsWith("BrainChangeTopicReview("),
			),
		).toHaveLength(1);
		expect(
			session.run.mock.calls.some(
				([statement]) => statement === "BrainGetTopicReview();",
			),
		).toBe(true);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});

	it("keeps manual setup usable after an assistant error and restores focus when proposals are dismissed", async () => {
		const session = organizationSession();
		const user = userEvent.setup();
		session.afterSuggest.mockRejectedValueOnce(
			new Error("Assistant unavailable; draft preserved"),
		);
		render(step(session.actions));
		await screen.findByDisplayValue("UNC Recruiting");
		const trigger = screen.getByRole("button", {
			name: "Suggest a better grouping",
		});
		await user.click(trigger);
		await screen.findByRole("alert");
		expect(
			screen.getByRole("button", { name: "Add a topic" }),
		).toBeEnabled();
		expect(screen.getByRole("textbox", { name: "Topic name" })).toHaveValue(
			"UNC Recruiting",
		);
		await user.click(trigger);
		await screen.findByRole("dialog", { name: "Suggested topic groups" });
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(trigger).toHaveFocus();
	});

	it("keeps the proposal open while its authoritative preview is pending", async () => {
		const session = organizationSession();
		const user = userEvent.setup();
		const pending = deferred<TopicOrganizationPreview>();
		session.afterPreview.mockImplementationOnce(() => pending.promise);
		render(step(session.actions));
		await screen.findByDisplayValue("UNC Recruiting");
		await user.click(
			screen.getByRole("button", { name: "Suggest a better grouping" }),
		);
		const proposed = await screen.findByRole("dialog", {
			name: "Suggested topic groups",
		});
		await user.click(
			within(proposed).getByRole("button", {
				name: "Preview selected changes",
			}),
		);
		await waitFor(() => expect(session.afterPreview).toHaveBeenCalled());
		await user.keyboard("{Escape}");
		expect(proposed).toBeVisible();
		expect(
			within(proposed).getByRole("button", {
				name: /Preparing preview…/,
			}),
		).toBeDisabled();
		await act(async () =>
			pending.resolve(session.afterPreview.mock.calls[0][0]),
		);
		expect(
			await screen.findByRole("dialog", {
				name: "Review your grouping changes",
			}),
		).toBeVisible();
	});

	it("shows a blocked Teams scope honestly without enabling a whole-chat combination", async () => {
		const session = organizationSession();
		const user = userEvent.setup();
		session.afterPreview.mockImplementationOnce(async (preview) => ({
			...preview,
			groups: preview.groups.map((group) => ({
				...group,
				canApply: false,
				reason: "Saved Teams links need exchange-aware combination.",
			})),
		}));
		render(step(session.actions));
		await screen.findByDisplayValue("UNC Recruiting");
		await user.click(
			screen.getByRole("button", {
				name: "Combine UNC Recruiting with other topics",
			}),
		);
		const combine = await screen.findByRole("dialog", {
			name: "Combine overlapping topics",
		});
		await user.click(
			within(combine).getByRole("checkbox", { name: "VCU Hiring" }),
		);
		await user.click(
			within(combine).getByRole("button", {
				name: "Preview combination",
			}),
		);
		const preview = await screen.findByRole("dialog", {
			name: "Review your grouping changes",
		});
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

	it("requires fresh suggestions when the owner updates the organizing context", async () => {
		const session = organizationSession();
		const user = userEvent.setup();
		render(step(session.actions));
		await screen.findByDisplayValue("UNC Recruiting");
		await user.click(
			screen.getByRole("button", { name: "Suggest a better grouping" }),
		);
		await screen.findByRole("dialog", { name: "Suggested topic groups" });
		await user.click(
			screen.getByRole("button", { name: "Back to topics" }),
		);
		await user.type(
			screen.getByRole("textbox", {
				name: "Give the assistant some context (optional)",
			}),
			"Keep UNC and VCU separate.",
		);
		await user.click(
			screen.getByRole("button", { name: "Review suggested groups" }),
		);
		const proposed = await screen.findByRole("dialog", {
			name: "Suggested topic groups",
		});
		expect(within(proposed).getByRole("status")).toHaveTextContent(
			"Your setup changed",
		);
		expect(
			within(proposed).getByRole("button", {
				name: "Preview selected changes",
			}),
		).toBeDisabled();
		expect(session.afterPreview).not.toHaveBeenCalled();
	});

	it("ignores a late assistant response after switching authenticated insights", async () => {
		const old = organizationSession();
		const current = organizationSession(organizationReview(4));
		const pending = deferred<TopicOrganizationProposal>();
		old.afterSuggest.mockImplementationOnce(() => pending.promise);
		const user = userEvent.setup();
		const view = render(step(old.actions));
		await screen.findByDisplayValue("UNC Recruiting");
		await user.click(
			screen.getByRole("button", { name: "Suggest a better grouping" }),
		);
		await waitFor(() => expect(old.afterSuggest).toHaveBeenCalled());
		view.rerender(step(current.actions));
		await screen.findByRole("button", { name: "Keep 4 topics" });
		await act(async () =>
			pending.resolve(old.afterSuggest.mock.calls[0][0]),
		);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(current.saved?.draft.topics).toHaveLength(4);
	});

	it.each(["saved", "draft"] as const)(
		"resolves an external profile conflict with the explicit %s choice",
		async (choice) => {
			const initial = organizationReview();
			initial.profileConflicts = [
				{
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
				},
			];
			const session = organizationSession(initial);
			const user = userEvent.setup();
			render(step(session.actions));
			await screen.findByDisplayValue("UNC Recruiting");
			expect(
				screen.getByRole("button", { name: "Keep 3 topics" }),
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
				screen.getByRole("textbox", { name: "Topic name" }),
			).toHaveValue(
				choice === "saved" ? "External Recruiting" : "UNC Recruiting",
			);
			expect(
				screen.getByRole("button", { name: "Keep 3 topics" }),
			).toBeEnabled();
			expect(session.afterApply).not.toHaveBeenCalled();
		},
	);
});
