import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Topic } from "../state/collaboration.types";
import { WorkTopicsStatusDialog } from "./work-topics-status-dialog";

// Mock useCollaborationSession
vi.mock("../state/collaboration-session.context", () => ({
	useCollaborationSession: vi.fn(() => ({
		state: {
			topics: [],
		},
		dispatch: vi.fn(),
	})),
}));

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

describe("WorkTopicsStatusDialog", () => {
	const allTopics = [
		mockTopic("1", "active"),
		mockTopic("2", "dormant"),
		mockTopic("3", "archived"),
		mockTopic("4", "active"),
		mockTopic("5", "suggested"),
	];

	let dispatch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		dispatch = vi.fn();
		vi.mocked(useCollaborationSession).mockReturnValue({
			state: { topics: allTopics },
			dispatch,
		} as never);
	});

	describe("Archive mode", () => {
		it("renders with archive title and description", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(screen.getByText("Archive topics?")).toBeInTheDocument();
			expect(
				screen.getByText(/hidden from your main view/),
			).toBeInTheDocument();
		});

		it("shows only non-archived topics as eligible", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1", "2", "3", "5"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			// 3 eligible (1=active, 2=dormant, 5=suggested), 1 skipped (3=archived)
			expect(screen.getByText(/Affecting 3 topics:/)).toBeInTheDocument();
			expect(
				screen.getByText(/1 topic cannot be archived/),
			).toBeInTheDocument();
		});

		it("disables confirm when all selected are already archived", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["3"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(
				screen.getByRole("button", { name: "Archive" }),
			).toBeDisabled();
		});

		it("dispatches archive status for eligible topics", async () => {
			const user = userEvent.setup();
			const onOpenChange = vi.fn();
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1", "2"])}
					allTopics={allTopics}
					onOpenChange={onOpenChange}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "Archive" }));
			await waitFor(() => {
				expect(dispatch).toHaveBeenCalledWith({
					type: "topic.save",
					topic: { id: "1", status: "archived" },
				});
				expect(dispatch).toHaveBeenCalledWith({
					type: "topic.save",
					topic: { id: "2", status: "archived" },
				});
			});
		});

		it("shows success toast and closes dialog", async () => {
			const user = userEvent.setup();
			const onOpenChange = vi.fn();
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1"])}
					allTopics={allTopics}
					onOpenChange={onOpenChange}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "Archive" }));
			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledWith(
					"Archive 1 topic.",
					expect.any(Object),
				);
				expect(onOpenChange).toHaveBeenCalledWith(false);
			});
		});
	});

	describe("Restore mode", () => {
		it("renders with restore title", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="restore"
					selectedTopicIds={new Set(["3"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(screen.getByText("Restore topics?")).toBeInTheDocument();
		});

		it("shows only archived topics as eligible", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="restore"
					selectedTopicIds={new Set(["1", "3"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(screen.getByText(/Affecting 1 topic:/)).toBeInTheDocument();
			expect(
				screen.getByText(/1 topic cannot be restored/),
			).toBeInTheDocument();
		});

		it("dispatches restore status (active)", async () => {
			const user = userEvent.setup();
			render(
				<WorkTopicsStatusDialog
					open
					mode="restore"
					selectedTopicIds={new Set(["3"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "Restore" }));
			await waitFor(() => {
				expect(dispatch).toHaveBeenCalledWith({
					type: "topic.save",
					topic: { id: "3", status: "active" },
				});
			});
		});
	});

	describe("Hibernate mode", () => {
		it("renders with hibernate title", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="hibernate"
					selectedTopicIds={new Set(["1"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(screen.getByText("Hibernate topics?")).toBeInTheDocument();
			expect(
				screen.getByText(/paused—you won't get new notifications/),
			).toBeInTheDocument();
		});

		it("shows only active topics as eligible", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="hibernate"
					selectedTopicIds={new Set(["1", "2", "4"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(screen.getByText(/Affecting 2 topics:/)).toBeInTheDocument();
			expect(
				screen.getByText(/1 topic cannot be hibernated/),
			).toBeInTheDocument();
		});

		it("dispatches hibernate status (dormant)", async () => {
			const user = userEvent.setup();
			render(
				<WorkTopicsStatusDialog
					open
					mode="hibernate"
					selectedTopicIds={new Set(["1", "4"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "Hibernate" }));
			await waitFor(() => {
				expect(dispatch).toHaveBeenCalledWith({
					type: "topic.save",
					topic: { id: "1", status: "dormant" },
				});
				expect(dispatch).toHaveBeenCalledWith({
					type: "topic.save",
					topic: { id: "4", status: "dormant" },
				});
			});
		});
	});

	describe("Wake mode", () => {
		it("renders with wake title", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="wake"
					selectedTopicIds={new Set(["2"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(screen.getByText("Wake topics?")).toBeInTheDocument();
			expect(
				screen.getByText(/resume sending you notifications/),
			).toBeInTheDocument();
		});

		it("shows only dormant topics as eligible", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="wake"
					selectedTopicIds={new Set(["2", "1"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(screen.getByText(/Affecting 1 topic:/)).toBeInTheDocument();
			expect(
				screen.getByText(/1 topic cannot be woken/),
			).toBeInTheDocument();
		});

		it("dispatches wake status (active)", async () => {
			const user = userEvent.setup();
			render(
				<WorkTopicsStatusDialog
					open
					mode="wake"
					selectedTopicIds={new Set(["2"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "Wake" }));
			await waitFor(() => {
				expect(dispatch).toHaveBeenCalledWith({
					type: "topic.save",
					topic: { id: "2", status: "active" },
				});
			});
		});
	});

	describe("General behavior", () => {
		it("does not render when open is false", () => {
			const { container } = render(
				<WorkTopicsStatusDialog
					open={false}
					mode="archive"
					selectedTopicIds={new Set(["1"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(
				container.querySelector('[role="dialog"]'),
			).not.toBeInTheDocument();
		});

		it("displays correct plural/singular form", () => {
			const { rerender } = render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(screen.getByText(/Affecting 1 topic:/)).toBeInTheDocument();

			rerender(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1", "2"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(screen.getByText(/Affecting 2 topics:/)).toBeInTheDocument();
		});

		it("calls onSuccess callback when confirmed", async () => {
			const user = userEvent.setup();
			const onSuccess = vi.fn();
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
					onSuccess={onSuccess}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "Archive" }));
			await waitFor(() => {
				expect(onSuccess).toHaveBeenCalled();
			});
		});

		it("closes dialog when Cancel is clicked", async () => {
			const user = userEvent.setup();
			const onOpenChange = vi.fn();
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1"])}
					allTopics={allTopics}
					onOpenChange={onOpenChange}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "Cancel" }));
			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it("disables buttons while loading", async () => {
			const user = userEvent.setup();
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			const confirmButton = screen.getByRole("button", {
				name: "Archive",
			});
			const _cancelButton = screen.getByRole("button", {
				name: "Cancel",
			});

			await user.click(confirmButton);

			await waitFor(() => {
				expect(confirmButton).toBeDisabled();
			});
		});

		it("lists all eligible topics in scrollable container", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1", "2", "4", "5"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			// Should show topic names
			expect(screen.getByText("Topic 1")).toBeInTheDocument();
			expect(screen.getByText("Topic 2")).toBeInTheDocument();
			expect(screen.getByText("Topic 4")).toBeInTheDocument();
			expect(screen.getByText("Topic 5")).toBeInTheDocument();
			// Should not show ineligible topic
			expect(screen.queryByText("Topic 3")).not.toBeInTheDocument();
		});

		it("hides skipped notice when no topics are skipped", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1", "2", "5"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			// All 3 are eligible (none archived), so no skipped notice
			expect(
				screen.queryByText(/topic.*cannot be archived/),
			).not.toBeInTheDocument();
		});

		it("shows toast with correct count message", async () => {
			const user = userEvent.setup();
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1", "2"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			await user.click(screen.getByRole("button", { name: "Archive" }));
			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledWith(
					"Archive 2 topics.",
					expect.any(Object),
				);
			});
		});
	});

	describe("Edge cases", () => {
		it("handles empty selection", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set()}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(
				screen.getByRole("button", { name: "Archive" }),
			).toBeDisabled();
		});

		it("handles all topics ineligible", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["3"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(
				screen.getByRole("button", { name: "Archive" }),
			).toBeDisabled();
			expect(
				screen.getByText(/1 topic cannot be archived/),
			).toBeInTheDocument();
		});

		it("handles mixed eligible/ineligible topics", () => {
			render(
				<WorkTopicsStatusDialog
					open
					mode="archive"
					selectedTopicIds={new Set(["1", "3", "2"])}
					allTopics={allTopics}
					onOpenChange={() => {}}
				/>,
			);
			expect(screen.getByText(/Affecting 2 topics:/)).toBeInTheDocument();
			expect(
				screen.getByText(/1 topic cannot be archived/),
			).toBeInTheDocument();
		});
	});
});
