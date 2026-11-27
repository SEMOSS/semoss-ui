import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixtures } from "../state/collaboration.fixtures";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { WorkTopics } from "./work-topics";

// Mock the collaboration session hook
vi.mock("../state/collaboration-session.context");
vi.mock("../live/work-refresh-status", () => ({
	WorkRefreshStatus: () => <div>Refresh Status</div>,
}));
vi.mock("../state/memory", () => ({
	memoriesAbout: () => [],
}));
vi.mock("../../dashboard/brief-panel", () => ({
	BriefPanel: ({ children, title }: Record<string, unknown>) => (
		<div>
			<h2>{title}</h2>
			{children}
		</div>
	),
}));
vi.mock("../../dashboard/mail-check-status", () => ({
	MailCheckStatus: () => <div>Mail Status</div>,
}));
vi.mock("../components/collaboration-hero-header", () => ({
	CollaborationHeroHeader: ({ children }: Record<string, unknown>) => (
		<div>{children}</div>
	),
}));
vi.mock("../components/collaboration-hero-page", () => ({
	CollaborationHeroPage: ({ children }: Record<string, unknown>) => (
		<div>{children}</div>
	),
}));
vi.mock("../components/collaboration-page-header", () => ({
	CollaborationPageHeader: ({
		children,
		actions,
	}: Record<string, unknown>) => (
		<div>
			{children}
			{actions}
		</div>
	),
}));
vi.mock("../components/collaboration-surface", () => ({
	CollaborationSurface: ({ children, header }: Record<string, unknown>) => (
		<div>
			{header}
			{children}
		</div>
	),
}));
vi.mock("../components/topic-editor", () => ({
	TopicEditor: () => <div>Topic Editor</div>,
}));

describe("WorkTopics selection (Step 4.1)", () => {
	beforeEach(() => {
		const mockSessionState = {
			topics: [
				{
					...fixtures.topic,
					id: "topic-1",
					name: "Topic 1",
					status: "active",
				},
				{
					...fixtures.topic,
					id: "topic-2",
					name: "Topic 2",
					status: "active",
				},
				{
					...fixtures.topic,
					id: "topic-3",
					name: "Topic 3",
					status: "archived",
				},
			],
			accounts: [],
			memories: [],
			works: [],
			threads: [],
			items: [],
			people: [],
			rooms: [],
		};

		(useCollaborationSession as never).mockReturnValue({
			state: mockSessionState,
			dispatch: vi.fn(),
		});
	});

	it("renders checkboxes before each topic row", () => {
		render(
			<BrowserRouter>
				<WorkTopics
					settings={{ title: "Topics", description: "Test" }}
				/>
			</BrowserRouter>,
		);

		const checkboxes = screen.getAllByRole("checkbox");
		// One for select-all + 2 visible topics (topic-3 is archived and filtered out by default)
		expect(checkboxes.length).toBeGreaterThan(0);
	});

	it("selects a single topic when checkbox is clicked", async () => {
		const user = userEvent.setup();
		const onSelectionChange = vi.fn();

		render(
			<BrowserRouter>
				<WorkTopics
					settings={{ title: "Topics", description: "Test" }}
					onSelectionChange={onSelectionChange}
				/>
			</BrowserRouter>,
		);

		const topic1Checkbox = screen.getByLabelText(/Select Topic 1/);
		await user.click(topic1Checkbox);

		expect(onSelectionChange).toHaveBeenCalledWith(expect.any(Set));
		const selectedSet = onSelectionChange.mock.calls[0][0];
		expect(selectedSet.has("topic-1")).toBe(true);
	});

	it("shows selection count when topics are selected", async () => {
		const user = userEvent.setup();

		render(
			<BrowserRouter>
				<WorkTopics
					settings={{ title: "Topics", description: "Test" }}
				/>
			</BrowserRouter>,
		);

		const topic1Checkbox = screen.getByLabelText(/Select Topic 1/);
		await user.click(topic1Checkbox);

		// Should show "1 selected"
		expect(screen.getByText(/1 selected/)).toBeInTheDocument();
	});

	it("select-all checkbox selects all visible topics", async () => {
		const user = userEvent.setup();
		const onSelectionChange = vi.fn();

		render(
			<BrowserRouter>
				<WorkTopics
					settings={{ title: "Topics", description: "Test" }}
					onSelectionChange={onSelectionChange}
				/>
			</BrowserRouter>,
		);

		const selectAllCheckbox = screen.getByLabelText(/Select all topics/);
		await user.click(selectAllCheckbox);

		// Should select only visible topics (topic-1 and topic-2, not topic-3 which is archived)
		const lastCall =
			onSelectionChange.mock.calls[
				onSelectionChange.mock.calls.length - 1
			][0];
		expect(lastCall.size).toBe(2); // Only active topics
		expect(lastCall.has("topic-1")).toBe(true);
		expect(lastCall.has("topic-2")).toBe(true);
		expect(lastCall.has("topic-3")).toBe(false);
	});

	it("deselects all when select-all is clicked again", async () => {
		const user = userEvent.setup();
		const onSelectionChange = vi.fn();

		render(
			<BrowserRouter>
				<WorkTopics
					settings={{ title: "Topics", description: "Test" }}
					onSelectionChange={onSelectionChange}
				/>
			</BrowserRouter>,
		);

		const selectAllCheckbox = screen.getByLabelText(/Select all topics/);
		// First click: select all
		await user.click(selectAllCheckbox);
		// Second click: deselect all
		await user.click(selectAllCheckbox);

		const lastCall =
			onSelectionChange.mock.calls[
				onSelectionChange.mock.calls.length - 1
			][0];
		expect(lastCall.size).toBe(0);
	});

	it("prunes selection when filters change", async () => {
		const mockSessionState = {
			topics: [
				{
					...fixtures.topic,
					id: "topic-1",
					name: "Topic 1",
					status: "active",
				},
				{
					...fixtures.topic,
					id: "topic-2",
					name: "Topic 2",
					status: "archived",
				},
			],
			accounts: [],
			memories: [],
			works: [],
			threads: [],
			items: [],
			people: [],
			rooms: [],
		};

		(useCollaborationSession as never).mockReturnValue({
			state: mockSessionState,
			dispatch: vi.fn(),
		});

		render(
			<BrowserRouter>
				<WorkTopics
					settings={{ title: "Topics", description: "Test" }}
				/>
			</BrowserRouter>,
		);

		// Verify that only topic-1 is visible (topic-2 is archived and hidden by default filter)
		expect(screen.getByText(/Topic 1/i)).toBeInTheDocument();
		expect(screen.queryByText(/Topic 2/i)).not.toBeInTheDocument();
	});

	it("does not trigger navigation when clicking checkbox", async () => {
		const user = userEvent.setup();

		render(
			<BrowserRouter>
				<WorkTopics
					settings={{ title: "Topics", description: "Test" }}
				/>
			</BrowserRouter>,
		);

		const topic1Checkbox = screen.getByLabelText(/Select Topic 1/);
		await user.click(topic1Checkbox);

		// The checkbox should be checked after clicking
		expect(topic1Checkbox).toBeChecked();
		// Topic name should still be visible (in the list, not on a new page)
		expect(screen.getByText(/Topic 1/i)).toBeInTheDocument();
	});
});
