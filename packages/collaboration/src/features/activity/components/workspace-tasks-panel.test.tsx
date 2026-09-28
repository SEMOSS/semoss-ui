import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { Session } from "@/types/session";
import type { ActivityLogEntry } from "../types/activity-log";
import { WorkspaceTasksPanel } from "./workspace-tasks-panel";

/** Creates a session with a known activity state. */
function session(
	id: string,
	status: Session["status"],
	updatedAt = "2026-09-24T12:00:00Z",
): Session {
	return {
		id,
		status,
		updatedAt,
		agentId: "agent-1",
		title: id,
		origin: "You",
		unread: false,
		pinned: false,
		preview: "",
	};
}

/** A message-level record supplied to the UI without ingestion side effects. */
const email: ActivityLogEntry = {
	key: "email:message-1",
	id: "activity-1",
	topic: "Quarterly plan",
	preview: "Please review the budget and reply by Friday.",
	source: "Email",
	sender: { id: "person-1", name: "Alex Chen", type: "human" },
	agent: { id: "agent-1", name: "Planning agent" },
	receivedAt: "2026-09-24T12:00:00Z",
	updatedAt: "2026-09-24T12:01:00Z",
	processedAt: "2026-09-24T12:01:00Z",
	threadId: "thread-1",
	isHibernating: false,
	isDeleted: false,
	roomId: "room-1",
	status: "needs-response",
};

/** Read one labelled value from the detail sheet. */
function detail(label: string): HTMLElement | null {
	return within(screen.getByRole("dialog")).getByText(label, {
		selector: "dt",
	}).parentElement;
}

describe("WorkspaceTasksPanel", () => {
	it("names the activity log and provides an honest empty state", () => {
		render(
			<MemoryRouter>
				<WorkspaceTasksPanel
					agents={[]}
					sessions={[]}
					onOpenRoom={vi.fn()}
				/>
			</MemoryRouter>,
		);
		expect(
			screen.getByRole("complementary", { name: "Activity log" }),
		).toBeVisible();
		expect(
			screen.getByRole("tab", { name: "Needs you 0" }),
		).toHaveAttribute("aria-selected", "true");
		expect(screen.getByText("Nothing needs your response")).toBeVisible();
		expect(
			screen.getByRole("link", { name: "View all sessions" }),
		).toHaveAttribute("href", "/room");
	});

	it("prioritizes actionable rooms without treating unread or running rooms as replies", async () => {
		const user = userEvent.setup();
		const sessions = [
			session("Older review", "Your review", "2026-09-23T12:00:00Z"),
			session("Active research", "In progress"),
			session("Stopped export", "Stopped"),
			{ ...session("Unread update", "Ready"), unread: true },
			session("Newest review", "Your review"),
		];
		const originalOrder = sessions.map((item) => item.id);
		render(
			<MemoryRouter>
				<WorkspaceTasksPanel
					agents={[]}
					sessions={sessions}
					onOpenRoom={vi.fn()}
				/>
			</MemoryRouter>,
		);
		expect(screen.getByRole("tab", { name: "Needs you 3" })).toBeVisible();
		expect(
			screen
				.getAllByRole("button", { name: /^View activity:/ })
				.map((button) => button.getAttribute("aria-label")),
		).toEqual([
			"View activity: Newest review",
			"View activity: Stopped export",
			"View activity: Older review",
		]);
		expect(
			screen.queryByRole("button", {
				name: "View activity: Active research",
			}),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: "View activity: Unread update",
			}),
		).not.toBeInTheDocument();
		await user.click(screen.getByRole("tab", { name: "All activity" }));
		expect(
			screen.getByRole("button", {
				name: "View activity: Unread update",
			}),
		).toBeVisible();
		expect(
			screen.getByRole("button", {
				name: "View activity: Active research",
			}),
		).toBeVisible();
		expect(sessions.map((item) => item.id)).toEqual(originalOrder);
	});

	it("shows all supplied message metadata and keeps sender and processing agent distinct", async () => {
		const user = userEvent.setup();
		const onOpenRoom = vi.fn();
		render(
			<MemoryRouter>
				<WorkspaceTasksPanel
					agents={[]}
					sessions={[]}
					entries={[email]}
					onOpenRoom={onOpenRoom}
				/>
			</MemoryRouter>,
		);
		await user.click(
			screen.getByRole("button", {
				name: "View activity: Quarterly plan",
			}),
		);
		expect(
			screen.getByRole("dialog", { name: "Quarterly plan" }),
		).toHaveAccessibleDescription("Activity details");
		expect(detail("ID")).toHaveTextContent("activity-1");
		expect(detail("Topic")).toHaveTextContent("Quarterly plan");
		expect(detail("Sender")).toHaveTextContent("Alex Chen (human)");
		expect(detail("Sender ID")).toHaveTextContent("person-1");
		expect(detail("Processing agent")).toHaveTextContent("Planning agent");
		expect(detail("Agent ID")).toHaveTextContent("agent-1");
		expect(detail("Thread ID")).toHaveTextContent("thread-1");
		expect(detail("Received")).toHaveTextContent("Sep 24, 2026");
		expect(detail("Processed")).toHaveTextContent("Sep 24, 2026");
		expect(detail("Hibernate")).toHaveTextContent("No");
		expect(detail("Deleted")).toHaveTextContent("No");
		expect(detail("Room ID")).toHaveTextContent("room-1");
		expect(onOpenRoom).not.toHaveBeenCalled();
		await user.keyboard("{Escape}");
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: "View activity: Quarterly plan",
			}),
		).toHaveFocus();
		await user.keyboard("{Enter}");
		await user.click(screen.getByRole("button", { name: "Open room" }));
		expect(onOpenRoom).toHaveBeenCalledWith("room-1");
	});

	it("does not substitute room metadata for missing message details", async () => {
		const user = userEvent.setup();
		render(
			<MemoryRouter>
				<WorkspaceTasksPanel
					agents={[]}
					sessions={[session("Review room", "Your review")]}
					onOpenRoom={vi.fn()}
				/>
			</MemoryRouter>,
		);
		await user.click(
			screen.getByRole("button", { name: "View activity: Review room" }),
		);
		for (const label of [
			"ID",
			"Sender",
			"Received",
			"Thread ID",
			"Processed",
			"Hibernate",
			"Deleted",
		]) {
			expect(detail(label)).toHaveTextContent("Not provided");
		}
		expect(detail("Room ID")).toHaveTextContent("Review room");
		expect(detail("Last updated")).toHaveTextContent("Sep 24, 2026");
	});

	it("supports collected items without a room and hides closed or hibernating work from Needs you", async () => {
		const user = userEvent.setup();
		const onOpenRoom = vi.fn();
		const entries: ActivityLogEntry[] = [
			{ ...email, roomId: null },
			{
				...email,
				key: "hibernating",
				topic: "Hibernating work",
				isHibernating: true,
			},
			{
				...email,
				key: "deleted",
				topic: "Deleted work",
				isDeleted: true,
			},
			{
				...email,
				key: "completed",
				topic: "Completed work",
				status: "completed",
			},
		];
		render(
			<MemoryRouter>
				<WorkspaceTasksPanel
					agents={[]}
					sessions={[]}
					entries={entries}
					onOpenRoom={onOpenRoom}
				/>
			</MemoryRouter>,
		);
		expect(screen.getByRole("tab", { name: "Needs you 1" })).toBeVisible();
		expect(
			screen.getAllByRole("button", { name: /^View activity:/ }),
		).toHaveLength(1);
		await user.click(
			screen.getByRole("button", {
				name: "View activity: Quarterly plan",
			}),
		);
		expect(detail("Room ID")).toHaveTextContent("Not linked to a room");
		expect(
			screen.queryByRole("button", { name: "Open room" }),
		).not.toBeInTheDocument();
		expect(onOpenRoom).not.toHaveBeenCalled();
		await user.keyboard("{Escape}");
		await user.click(screen.getByRole("tab", { name: "All activity" }));
		expect(
			screen.getAllByRole("button", { name: /^View activity:/ }),
		).toHaveLength(4);
	});

	it("searches topic, sender and thread and recovers from no matches", async () => {
		const user = userEvent.setup();
		render(
			<MemoryRouter>
				<WorkspaceTasksPanel
					agents={[]}
					sessions={[]}
					entries={[email]}
					onOpenRoom={vi.fn()}
				/>
			</MemoryRouter>,
		);
		const search = screen.getByRole("textbox", {
			name: "Search activity log",
		});
		for (const query of ["Quarterly", "Alex Chen", "thread-1"]) {
			await user.clear(search);
			await user.type(search, query);
			expect(
				screen.getByRole("button", {
					name: "View activity: Quarterly plan",
				}),
			).toBeVisible();
		}
		await user.type(search, "missing");
		expect(screen.getByText("No matching activity")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Clear search" }));
		expect(search).toHaveValue("");
		expect(
			screen.getByRole("button", {
				name: "View activity: Quarterly plan",
			}),
		).toBeVisible();
	});
});
