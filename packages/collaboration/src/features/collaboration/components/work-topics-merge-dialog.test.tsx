import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Topic } from "../state/collaboration.types";
import { WorkTopicsMergeDialog } from "./work-topics-merge-dialog";

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

// Mock the toast
vi.mock("@semoss/ui/next", async () => {
	const actual = await vi.importActual("@semoss/ui/next");
	return {
		...actual,
		toast: {
			success: vi.fn(),
		},
	};
});

import { fixtures as defaultFixtures } from "../state/collaboration.fixtures";
import { useCollaborationSession } from "../state/collaboration-session.context";

describe("WorkTopicsMergeDialog", () => {
	let dispatch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		dispatch = vi.fn();
		vi.mocked(useCollaborationSession).mockReturnValue({
			state: { topics: [] },
			dispatch,
		} as never);
	});

	const allTopics: Topic[] = [
		{
			...defaultFixtures.topic,
			id: "1",
			name: "Topic 1",
		},
		{
			...defaultFixtures.topic,
			id: "2",
			name: "Topic 2",
		},
		{
			...defaultFixtures.topic,
			id: "3",
			name: "Topic 3",
		},
		{
			...defaultFixtures.topic,
			id: "4",
			name: "Topic 4",
		},
	];

	it("renders with merge title and description", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "Merge topics?" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/threads, people, notes, keywords, and rules/),
		).toBeInTheDocument();
	});

	it("does not render when open is false", () => {
		const mockSetOpen = vi.fn();
		const { container } = render(
			<WorkTopicsMergeDialog
				open={false}
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(
			container.querySelector("[role='dialog']"),
		).not.toBeInTheDocument();
	});

	it("lists all selected topics in scrollable container", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(screen.getByText("Merging 2 topics:")).toBeInTheDocument();
		expect(screen.getByText("Topic 1")).toBeInTheDocument();
		expect(screen.getByText("Topic 2")).toBeInTheDocument();
	});

	it("displays correct plural/singular form for single topic", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(screen.getByText("Merging 1 topic:")).toBeInTheDocument();
	});

	it("displays correct plural form for multiple topics", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1", "2", "3"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(screen.getByText("Merging 3 topics:")).toBeInTheDocument();
	});

	it("closes dialog when Cancel is clicked", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsMergeDialog
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

	it("disables merge button when no target selected", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		const mergeButton = screen.getByRole("button", { name: "Merge" });
		expect(mergeButton).toBeDisabled();
	});

	it("dispatches merge for all selected topics into target", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		const mockOnSuccess = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
				onSuccess={mockOnSuccess}
			/>,
		);

		// Find and click the Select trigger button
		const triggers = screen.getAllByRole("button");
		const targetSelect = triggers.find((btn) =>
			btn.textContent?.includes("Choose a topic"),
		);
		if (targetSelect) {
			await user.click(targetSelect);
			const option3 = await screen.findByText("Topic 3");
			await user.click(option3);

			const mergeButton = screen.getByRole("button", { name: "Merge" });
			await waitFor(
				() => {
					expect(mergeButton).not.toBeDisabled();
				},
				{ timeout: 2000 },
			);

			await user.click(mergeButton);

			await waitFor(() => {
				expect(dispatch).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "topic.merge",
						sourceId: "1",
						targetId: "3",
					}),
				);
				expect(dispatch).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "topic.merge",
						sourceId: "2",
						targetId: "3",
					}),
				);
			});
		}
	});

	it("calls onSuccess callback when confirmed", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		const mockOnSuccess = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
				onSuccess={mockOnSuccess}
			/>,
		);

		const triggers = screen.getAllByRole("button");
		const targetSelect = triggers.find((btn) =>
			btn.textContent?.includes("Choose a topic"),
		);
		if (targetSelect) {
			await user.click(targetSelect);
			const option3 = await screen.findByText("Topic 3");
			await user.click(option3);

			const mergeButton = screen.getByRole("button", { name: "Merge" });
			await waitFor(
				() => {
					expect(mergeButton).not.toBeDisabled();
				},
				{ timeout: 2000 },
			);

			await user.click(mergeButton);

			await waitFor(() => {
				expect(mockOnSuccess).toHaveBeenCalled();
			});
		}
	});

	it("closes dialog after merge", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		const triggers = screen.getAllByRole("button");
		const targetSelect = triggers.find((btn) =>
			btn.textContent?.includes("Choose a topic"),
		);
		if (targetSelect) {
			await user.click(targetSelect);
			const option3 = await screen.findByText("Topic 3");
			await user.click(option3);

			const mergeButton = screen.getByRole("button", { name: "Merge" });
			await waitFor(
				() => {
					expect(mergeButton).not.toBeDisabled();
				},
				{ timeout: 2000 },
			);

			await user.click(mergeButton);

			await waitFor(() => {
				expect(mockSetOpen).toHaveBeenCalledWith(false);
			});
		}
	});

	it("disables buttons while loading", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		const triggers = screen.getAllByRole("button");
		const targetSelect = triggers.find((btn) =>
			btn.textContent?.includes("Choose a topic"),
		);
		if (targetSelect) {
			await user.click(targetSelect);
			const option3 = await screen.findByText("Topic 3");
			await user.click(option3);

			const mergeButton = screen.getByRole("button", { name: "Merge" });
			await waitFor(
				() => {
					expect(mergeButton).not.toBeDisabled();
				},
				{ timeout: 2000 },
			);

			await user.click(mergeButton);

			await waitFor(() => {
				expect(mergeButton).toBeDisabled();
			});
		}
	});

	it("handles single selected topic", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(screen.getByText("Merging 1 topic:")).toBeInTheDocument();
		expect(screen.getByText("Topic 1")).toBeInTheDocument();
	});

	it("handles all but one topic selected", () => {
		const mockSetOpen = vi.fn();
		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1", "2", "3"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
			/>,
		);

		expect(screen.getByText("Merging 3 topics:")).toBeInTheDocument();
		// Merge button should be disabled until a target is selected
		const mergeButton = screen.getByRole("button", { name: "Merge" });
		expect(mergeButton).toBeDisabled();
	});

	it("dispatches merge for each selected topic to the target", async () => {
		const user = userEvent.setup();
		const mockSetOpen = vi.fn();
		const mockOnSuccess = vi.fn();

		render(
			<WorkTopicsMergeDialog
				open
				selectedTopicIds={new Set(["1", "2"])}
				allTopics={allTopics}
				onOpenChange={mockSetOpen}
				onSuccess={mockOnSuccess}
			/>,
		);

		const triggers = screen.getAllByRole("button");
		const targetSelect = triggers.find((btn) =>
			btn.textContent?.includes("Choose a topic"),
		);
		if (targetSelect) {
			await user.click(targetSelect);
			const option3 = await screen.findByText("Topic 3");
			await user.click(option3);

			const mergeButton = screen.getByRole("button", { name: "Merge" });
			await waitFor(
				() => {
					expect(mergeButton).not.toBeDisabled();
				},
				{ timeout: 2000 },
			);

			await user.click(mergeButton);

			await waitFor(() => {
				// Should dispatch merge for each selected topic
				expect(dispatch).toHaveBeenCalledTimes(2);
				expect(dispatch).toHaveBeenNthCalledWith(1, {
					type: "topic.merge",
					sourceId: "1",
					targetId: "3",
				});
				expect(dispatch).toHaveBeenNthCalledWith(2, {
					type: "topic.merge",
					sourceId: "2",
					targetId: "3",
				});
				expect(mockOnSuccess).toHaveBeenCalled();
			});
		}
	});
});
