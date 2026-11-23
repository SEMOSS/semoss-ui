import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Topic } from "../state/collaboration.types";
import { WorkTopicsDeleteDialog } from "./work-topics-delete-dialog";

// Mock useCollaborationSession
vi.mock("../state/collaboration-session.context", async () => {
	const actual = await vi.importActual(
		"../state/collaboration-session.context",
	);
	return {
		...actual,
		useCollaborationSession: vi.fn(),
	};
});

// Mock toast
vi.mock("@semoss/ui/next", async () => {
	const actual = await vi.importActual("@semoss/ui/next");
	return {
		...actual,
		toast: {
			success: vi.fn(),
			error: vi.fn(),
		},
	};
});

import { toast } from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";

// Mock topic factory
const mockTopic = (id: string, name: string): Topic => ({
	id,
	name,
	short: `t-${id}`,
	accountId: null,
	kind: "client",
	color: "#000000",
	status: "active",
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

describe("WorkTopicsDeleteDialog", () => {
	let dispatch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		dispatch = vi.fn();
		vi.mocked(useCollaborationSession).mockReturnValue({
			state: { topics: [] },
			dispatch,
		} as never);
	});

	const allTopics: Topic[] = [
		mockTopic("1", "Topic 1"),
		mockTopic("2", "Topic 2"),
		mockTopic("3", "Topic 3"),
		mockTopic("4", "Topic 4"),
	];

	it("renders with delete title and warning message", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "Delete topics?" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/This action cannot be undone/),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Notes, people, and rules will be removed/),
		).toBeInTheDocument();
	});

	it("does not render when open is false", () => {
		const mockSetOpen = vi.fn();
		const { container } = render(
			<WorkTopicsDeleteDialog
				open={false}
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(
			container.querySelector("[role='alertdialog']"),
		).not.toBeInTheDocument();
	});

	it("lists all selected topics in scrollable container", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(screen.getByText("Deleting 2 topics:")).toBeInTheDocument();
		expect(screen.getByText("Topic 1")).toBeInTheDocument();
		expect(screen.getByText("Topic 2")).toBeInTheDocument();
	});

	it("displays correct plural/singular form for single topic", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(screen.getByText("Deleting 1 topic:")).toBeInTheDocument();
	});

	it("displays correct plural form for multiple topics", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1", "2", "3"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(screen.getByText("Deleting 3 topics:")).toBeInTheDocument();
	});

	it("closes dialog when Cancel is clicked", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		await user.click(cancelButton);

		expect(mockSetOpen).toHaveBeenCalledWith(false);
	});

	it("dispatches delete for all selected topics", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		const mockOnSuccess = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
				onSuccess={mockOnSuccess}
			/>,
		);

		const deleteButton = screen.getByRole("button", {
			name: "Delete topics",
		});
		await user.click(deleteButton);

		await waitFor(() => {
			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "topic.delete",
					topicId: "1",
				}),
			);
			expect(dispatch).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "topic.delete",
					topicId: "2",
				}),
			);
		});
	});

	it("shows success toast message", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		const deleteButton = screen.getByRole("button", {
			name: "Delete topics",
		});
		await user.click(deleteButton);

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith("Deleted 2 topics.");
		});
	});

	it("calls onSuccess callback when confirmed", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		const mockOnSuccess = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
				onSuccess={mockOnSuccess}
			/>,
		);

		const deleteButton = screen.getByRole("button", {
			name: "Delete topics",
		});
		await user.click(deleteButton);

		await waitFor(() => {
			expect(mockOnSuccess).toHaveBeenCalled();
		});
	});

	it("closes dialog after delete", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		const deleteButton = screen.getByRole("button", {
			name: "Delete topics",
		});
		await user.click(deleteButton);

		await waitFor(() => {
			expect(mockSetOpen).toHaveBeenCalledWith(false);
		});
	});

	it("disables buttons while loading", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		const deleteButton = screen.getByRole("button", {
			name: "Delete topics",
		});
		await user.click(deleteButton);

		await waitFor(() => {
			expect(deleteButton).toBeDisabled();
		});
	});

	it("displays singular form for single topic deletion", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		const deleteButton = screen.getByRole("button", {
			name: "Delete topics",
		});
		await user.click(deleteButton);

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith("Deleted 1 topic.");
		});
	});

	it("dispatches delete for each topic in the selection", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		const mockOnSuccess = vi.fn();

		render(
			<WorkTopicsDeleteDialog
				open
				selectedTopicIds={new Set(["1", "2", "3"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
				onSuccess={mockOnSuccess}
			/>,
		);

		const deleteButton = screen.getByRole("button", {
			name: "Delete topics",
		});
		await user.click(deleteButton);

		await waitFor(() => {
			// Should dispatch all three deletes
			expect(dispatch).toHaveBeenCalledTimes(3);
			expect(dispatch).toHaveBeenNthCalledWith(1, {
				type: "topic.delete",
				topicId: "1",
			});
			expect(dispatch).toHaveBeenNthCalledWith(2, {
				type: "topic.delete",
				topicId: "2",
			});
			expect(dispatch).toHaveBeenNthCalledWith(3, {
				type: "topic.delete",
				topicId: "3",
			});
			expect(toast.success).toHaveBeenCalledWith("Deleted 3 topics.");
			expect(mockOnSuccess).toHaveBeenCalled();
		});
	});
});
