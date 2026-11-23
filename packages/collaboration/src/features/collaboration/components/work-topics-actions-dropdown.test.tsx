import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Topic } from "../state/collaboration.types";
import {
	determineActionEligibility,
	WorkTopicsActionsDropdown,
} from "./work-topics-actions-dropdown";

// Mock topic fixtures
const mockTopic = (
	id: string,
	status: "active" | "dormant" | "archived" | "suggested" = "active",
): Topic => ({
	id,
	name: `Topic ${id}`,
	short: `t-${id}`,
	accountId: null,
	kind: "client",
	color: "#000000",
	status,
	description: "Test topic",
	keywords: [],
	people: [],
	calendarSeries: [],
	isSample: false,
	stats: {
		threads: 0,
		openItems: 0,
		chats: 0,
		lastActivity: "",
	},
});

describe("determineActionEligibility", () => {
	it("returns all false when no topics are selected", () => {
		const eligibility = determineActionEligibility([], 5);
		expect(eligibility).toEqual({
			archive: false,
			restore: false,
			hibernate: false,
			wake: false,
			accept: false,
			merge: false,
			delete: false,
		});
	});

	describe("archive eligibility", () => {
		it("is enabled when any selected topic is not archived", () => {
			const topics = [
				mockTopic("1", "active"),
				mockTopic("2", "dormant"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.archive).toBe(true);
		});

		it("is disabled when all selected topics are archived", () => {
			const topics = [
				mockTopic("1", "archived"),
				mockTopic("2", "archived"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.archive).toBe(false);
		});
	});

	describe("restore eligibility", () => {
		it("is enabled when any selected topic is archived", () => {
			const topics = [
				mockTopic("1", "archived"),
				mockTopic("2", "active"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.restore).toBe(true);
		});

		it("is disabled when no selected topics are archived", () => {
			const topics = [
				mockTopic("1", "active"),
				mockTopic("2", "dormant"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.restore).toBe(false);
		});
	});

	describe("hibernate eligibility", () => {
		it("is enabled when any selected topic is active", () => {
			const topics = [
				mockTopic("1", "active"),
				mockTopic("2", "dormant"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.hibernate).toBe(true);
		});

		it("is enabled when any selected topic is suggested", () => {
			const topics = [
				mockTopic("1", "suggested"),
				mockTopic("2", "dormant"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.hibernate).toBe(true);
		});

		it("is disabled when no selected topics are active or suggested", () => {
			const topics = [
				mockTopic("1", "dormant"),
				mockTopic("2", "archived"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.hibernate).toBe(false);
		});
	});

	describe("wake eligibility", () => {
		it("is enabled when any selected topic is dormant", () => {
			const topics = [
				mockTopic("1", "dormant"),
				mockTopic("2", "archived"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.wake).toBe(true);
		});

		it("is disabled when no selected topics are dormant", () => {
			const topics = [
				mockTopic("1", "active"),
				mockTopic("2", "archived"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.wake).toBe(false);
		});
	});

	describe("accept eligibility", () => {
		it("is enabled when any selected topic is suggested", () => {
			const topics = [
				mockTopic("1", "suggested"),
				mockTopic("2", "active"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.accept).toBe(true);
		});

		it("is disabled when no selected topics are suggested", () => {
			const topics = [
				mockTopic("1", "active"),
				mockTopic("2", "dormant"),
			];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.accept).toBe(false);
		});
	});

	describe("merge eligibility", () => {
		it("is enabled when other topics exist outside selection", () => {
			const topics = [mockTopic("1", "active")];
			const eligibility = determineActionEligibility(topics, 5); // 5 total, 1 selected
			expect(eligibility.merge).toBe(true);
		});

		it("is disabled when only one topic exists (all selected)", () => {
			const topics = [mockTopic("1", "active")];
			const eligibility = determineActionEligibility(topics, 1); // 1 total, 1 selected
			expect(eligibility.merge).toBe(false);
		});

		it("is disabled when all topics are selected", () => {
			const topics = [mockTopic("1"), mockTopic("2"), mockTopic("3")];
			const eligibility = determineActionEligibility(topics, 3); // 3 total, 3 selected
			expect(eligibility.merge).toBe(false);
		});
	});

	describe("delete eligibility", () => {
		it("is always enabled when topics are selected", () => {
			const topics = [mockTopic("1", "active")];
			const eligibility = determineActionEligibility(topics, 5);
			expect(eligibility.delete).toBe(true);
		});

		it("is disabled when no topics are selected", () => {
			const eligibility = determineActionEligibility([], 5);
			expect(eligibility.delete).toBe(false);
		});
	});
});

describe("WorkTopicsActionsDropdown", () => {
	const allTopics = [
		mockTopic("1", "active"),
		mockTopic("2", "dormant"),
		mockTopic("3", "archived"),
		mockTopic("4", "active"),
		mockTopic("5", "active"),
	];

	it("renders with Actions button disabled when no topics selected", () => {
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set()}
				allTopics={allTopics}
			/>,
		);
		expect(screen.getByRole("button", { name: /Actions/ })).toBeDisabled();
	});

	it("renders with Actions button enabled when topics selected", () => {
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
			/>,
		);
		expect(
			screen.getByRole("button", { name: /Actions/ }),
		).not.toBeDisabled();
	});

	it("disables archive action when all selected are archived", async () => {
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["3"])}
				allTopics={allTopics}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(
			screen.getByRole("menuitem", { name: "Archive" }),
		).toHaveAttribute("data-disabled");
	});

	it("enables archive action when any selected is not archived", async () => {
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1", "3"])}
				allTopics={allTopics}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(
			screen.getByRole("menuitem", { name: "Archive" }),
		).not.toHaveAttribute("data-disabled");
	});

	it("disables restore action when no archived topics selected", async () => {
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(
			screen.getByRole("menuitem", { name: "Restore" }),
		).toHaveAttribute("data-disabled");
	});

	it("enables restore action when any archived topic selected", async () => {
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["3"])}
				allTopics={allTopics}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(
			screen.getByRole("menuitem", { name: "Restore" }),
		).not.toHaveAttribute("data-disabled");
	});

	it("disables hibernate action when no active topics selected", async () => {
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["2", "3"])}
				allTopics={allTopics}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(
			screen.getByRole("menuitem", { name: "Hibernate" }),
		).toHaveAttribute("data-disabled");
	});

	it("enables hibernate action when any active topic selected", async () => {
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(
			screen.getByRole("menuitem", { name: "Hibernate" }),
		).not.toHaveAttribute("data-disabled");
	});

	it("disables wake action when no dormant topics selected", async () => {
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1", "3"])}
				allTopics={allTopics}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(screen.getByRole("menuitem", { name: "Wake" })).toHaveAttribute(
			"data-disabled",
		);
	});

	it("enables wake action when any dormant topic selected", async () => {
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["2"])}
				allTopics={allTopics}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(
			screen.getByRole("menuitem", { name: "Wake" }),
		).not.toHaveAttribute("data-disabled");
	});

	it("disables merge action when all topics are selected", async () => {
		const singleTopic = [mockTopic("1", "active")];
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1"])}
				allTopics={singleTopic}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(screen.getByRole("menuitem", { name: "Merge" })).toHaveAttribute(
			"data-disabled",
		);
	});

	it("enables merge action when other topics exist", async () => {
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(
			screen.getByRole("menuitem", { name: "Merge" }),
		).not.toHaveAttribute("data-disabled");
	});

	it("always enables delete action when topics selected", async () => {
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		expect(
			screen.getByRole("menuitem", { name: "Delete" }),
		).not.toHaveAttribute("data-disabled");
	});

	it("calls onArchive when Archive is clicked and enabled", async () => {
		const onArchive = vi.fn();
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
				onArchive={onArchive}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		await user.click(screen.getByRole("menuitem", { name: "Archive" }));
		expect(onArchive).toHaveBeenCalled();
	});

	it("calls onRestore when Restore is clicked and enabled", async () => {
		const onRestore = vi.fn();
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["3"])}
				allTopics={allTopics}
				onRestore={onRestore}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		await user.click(screen.getByRole("menuitem", { name: "Restore" }));
		expect(onRestore).toHaveBeenCalled();
	});

	it("calls onHibernate when Hibernate is clicked and enabled", async () => {
		const onHibernate = vi.fn();
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
				onHibernate={onHibernate}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		await user.click(screen.getByRole("menuitem", { name: "Hibernate" }));
		expect(onHibernate).toHaveBeenCalled();
	});

	it("calls onWake when Wake is clicked and enabled", async () => {
		const onWake = vi.fn();
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["2"])}
				allTopics={allTopics}
				onWake={onWake}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		await user.click(screen.getByRole("menuitem", { name: "Wake" }));
		expect(onWake).toHaveBeenCalled();
	});

	it("calls onMerge when Merge is clicked and enabled", async () => {
		const onMerge = vi.fn();
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
				onMerge={onMerge}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		await user.click(screen.getByRole("menuitem", { name: "Merge" }));
		expect(onMerge).toHaveBeenCalled();
	});

	it("calls onDelete when Delete is clicked and enabled", async () => {
		const onDelete = vi.fn();
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
				onDelete={onDelete}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		await user.click(screen.getByRole("menuitem", { name: "Delete" }));
		expect(onDelete).toHaveBeenCalled();
	});

	it("closes dropdown after selecting an action", async () => {
		const onArchive = vi.fn();
		const user = userEvent.setup();
		render(
			<WorkTopicsActionsDropdown
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
				onArchive={onArchive}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /Actions/ }));
		await user.click(screen.getByRole("menuitem", { name: "Archive" }));
		// Menu should be closed, so Archive should not be in the document
		expect(
			screen.queryByRole("menuitem", { name: "Archive" }),
		).not.toBeInTheDocument();
	});
});
