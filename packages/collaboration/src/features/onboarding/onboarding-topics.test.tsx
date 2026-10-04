import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import {
	deferred,
	makeReview,
	type ReviewWire,
	reviewSession,
} from "./topic-review.test-fixtures";
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

describe("onboarding topic review", () => {
	it("shares initialization in Strict Mode and applies the canonical profile in one request", async () => {
		const pending = deferred<ReviewWire>();
		const generate = vi.fn(() => pending.promise);
		const session = reviewSession(generate);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		expect(generate).toHaveBeenCalledOnce();
		expect(
			screen.getByRole("button", { name: "Keep 0 topics" }),
		).toBeDisabled();
		await act(async () => pending.resolve(makeReview()));
		const name = await screen.findByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Northwind Rollout");
		const description = screen.getByRole("textbox", {
			name: "What this topic covers",
		});
		expect(description.tagName).toBe("TEXTAREA");
		await user.clear(description);
		await user.type(
			description,
			"Launch readiness and delivery milestones.",
		);
		await user.click(screen.getByRole("button", { name: "Keep 1 topics" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(session.saved?.result.topics[0]).toMatchObject({
			name: "Northwind Rollout",
			short: "Northwind Rollout",
			description: "Launch readiness and delivery milestones.",
		});
		expect(
			session.run.mock.calls.filter(([statement]) =>
				statement.startsWith("BrainApplyTopicReview("),
			),
		).toHaveLength(1);
		expect(
			session.run.mock.calls.some(([statement]) =>
				statement.startsWith("BrainSaveTopic("),
			),
		).toBe(false);
	});

	it("preserves edits, added topics and people corrections across Back and remount", async () => {
		const session = reviewSession();
		const onBack = vi.fn();
		const user = userEvent.setup();
		const first = render(step(session.actions, vi.fn(), onBack));
		const name = await screen.findByDisplayValue("Northwind Migration");
		await user.clear(name);
		await user.type(name, "Northwind Delivery");
		await user.click(
			screen.getByRole("button", { name: "Remove Bo Chen" }),
		);
		expect(
			screen.getByRole("button", { name: "Restore Bo Chen" }),
		).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Add a topic" }));
		await user.type(
			screen.getAllByRole("textbox", { name: "Topic name" })[1],
			"Backend Hiring",
		);
		await user.click(screen.getByRole("button", { name: "Back" }));
		await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
		first.unmount();
		render(step(session.actions));
		expect(
			await screen.findByDisplayValue("Northwind Delivery"),
		).toBeEnabled();
		expect(screen.getByDisplayValue("Backend Hiring")).toBeEnabled();
		expect(
			screen.getByRole("button", { name: "Restore Bo Chen" }),
		).toBeEnabled();
	});

	it("blocks a kept blank name and associates the field error without dropping the topic", async () => {
		const session = reviewSession();
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		const name = await screen.findByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.click(screen.getByRole("button", { name: "Keep 1 topics" }));
		expect(
			await screen.findByText(
				"Name this topic or turn off Keep before continuing",
			),
		).toBeVisible();
		expect(name).toHaveAttribute("aria-invalid", "true");
		const errorId = name.getAttribute("aria-describedby");
		expect(
			errorId && document.getElementById(errorId)?.textContent,
		).toContain("Name this topic");
		expect(onNext).not.toHaveBeenCalled();
		expect(session.afterApply).not.toHaveBeenCalled();
	});

	it("allows manual setup and explicit zero-topic completion after suggestion failure", async () => {
		const initial = makeReview();
		initial.draft = { topics: [], modelError: "Topic model unavailable" };
		const session = reviewSession(async () => initial);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		expect(
			await screen.findByText(/You can still add your own topics/),
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Add a topic" }),
		).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Keep 0 topics" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(session.saved?.appliedRevision).toBe(session.saved?.revision);
		expect(session.saved?.filingJobId).toBeNull();
	});

	it("retains entered fields when autosave fails and supports explicit recovery", async () => {
		const session = reviewSession();
		session.afterSave.mockRejectedValueOnce(
			new Error("Review changed elsewhere"),
		);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		const name = await screen.findByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Northwind Rollout");
		await user.click(screen.getByRole("button", { name: "Keep 1 topics" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Review changed elsewhere",
		);
		expect(name).toHaveValue("Northwind Rollout");
		expect(onNext).not.toHaveBeenCalled();
		await user.click(
			screen.getByRole("button", { name: "Reload saved review" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
		expect(screen.getByRole("textbox", { name: "Topic name" })).toHaveValue(
			"Northwind Rollout",
		);
	});

	it("reuses added-topic IDs after the apply response is lost", async () => {
		const session = reviewSession();
		session.afterApply.mockRejectedValueOnce(
			new Error("Connection lost after save"),
		);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		await screen.findByDisplayValue("Northwind Migration");
		await user.click(screen.getByRole("button", { name: "Add a topic" }));
		await user.type(
			screen.getAllByRole("textbox", { name: "Topic name" })[1],
			"Backend Hiring",
		);
		await user.click(screen.getByRole("button", { name: "Keep 2 topics" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Connection lost after save",
		);
		const addedId = session.saved?.result.topics[1].id;
		await user.click(screen.getByRole("button", { name: "Retry" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(session.saved?.result.topics[1].id).toBe(addedId);
		expect(session.saved?.result.topics).toHaveLength(2);
	});

	it("does not continue when saved profile readback differs from the entered values", async () => {
		const session = reviewSession();
		session.afterApply.mockImplementationOnce(async (review) => {
			review.result.topics[0].short = "Old navigation name";
		});
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		await screen.findByDisplayValue("Northwind Migration");
		await user.click(screen.getByRole("button", { name: "Keep 1 topics" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"do not match your review",
		);
		expect(onNext).not.toHaveBeenCalled();
	});

	it.each(["success", "failure"])(
		"ignores a late %s from the previous insight",
		async (outcome) => {
			const pending = deferred<ReviewWire>();
			const old = reviewSession(() => pending.promise);
			const current = reviewSession(async () =>
				makeReview("Backend Hiring"),
			);
			const view = render(step(old.actions));
			view.rerender(step(current.actions));
			expect(
				await screen.findByDisplayValue("Backend Hiring"),
			).toBeEnabled();
			await act(async () => {
				if (outcome === "success")
					pending.resolve(makeReview("Old topic"));
				else pending.reject(new Error("Old request failed"));
			});
			expect(
				screen.queryByDisplayValue("Old topic"),
			).not.toBeInTheDocument();
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		},
	);
});
