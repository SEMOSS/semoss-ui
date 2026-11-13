import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { WorkItemPage } from "./work-item.page";

vi.mock("@/features/daily-chat/landing-chat-composer", () => ({
	LandingChatComposer: () => <div data-testid="landing-chat-composer" />,
}));

const workItems = [
	{
		id: "task-1",
		title: "Planning session",
		state: "active",
		mine: true,
		openSteps: [],
		// roomId set so reinstating the old redirect would fire
		roomId: "new-room",
		rooms: [
			{
				id: "new-room",
				title: "Latest chat",
				lastActivity: "2026-11-11T08:00:00Z",
			},
			{
				id: "old-room",
				title: "Earlier chat",
				lastActivity: "2026-11-10T08:00:00Z",
			},
		],
	},
	{
		id: "task-legacy",
		title: "Legacy item",
		state: "active",
		mine: true,
		openSteps: [],
		roomId: "legacy-room",
		rooms: [],
	},
];

const insight = vi.hoisted(() => ({
	actions: {
		run: vi.fn(async (statement: string) => ({
			pixelReturn: [
				{
					output: statement.startsWith("WorkListMyWork")
						? { selfId: "me", workItems }
						: {},
					operationType: ["OPERATION"],
				},
			],
		})),
	},
}));

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

beforeAll(() => {
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.setPointerCapture = () => undefined;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

function LocationProbe() {
	const { pathname } = useLocation();
	return <output data-testid="current-location">{pathname}</output>;
}

function renderPage(taskId = "task-1") {
	const user = userEvent.setup();
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter initialEntries={[`/work/item/${taskId}`]}>
				<Routes>
					<Route
						path="/work/item/:taskId"
						element={<WorkItemPage />}
					/>
					<Route path="*" element={<LocationProbe />} />
				</Routes>
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	return user;
}

it("shows the composer and RoomSelector instead of redirecting when the item has rooms", async () => {
	renderPage();

	// RoomSelector trigger appears (2 rooms → "View earlier chats")
	await screen.findByRole("button", { name: /view earlier chats/i });
	// Composer renders — confirms we are on the work-item page, not redirected
	expect(screen.getByTestId("landing-chat-composer")).toBeInTheDocument();
	// LocationProbe at * is NOT rendered — no redirect happened
	expect(screen.queryByTestId("current-location")).not.toBeInTheDocument();
});

it("navigates to the selected room when a chat is picked from RoomSelector", async () => {
	const user = renderPage();
	await user.click(
		await screen.findByRole("button", { name: /view earlier chats/i }),
	);
	await user.click(
		await screen.findByRole("menuitem", { name: /earlier chat/i }),
	);
	expect(screen.getByTestId("current-location")).toHaveTextContent(
		"/thread/room%3Aold-room",
	);
});

it("shows RoomSelector for a legacy item that has only roomId and no rooms array", async () => {
	renderPage("task-legacy");

	// Legacy item has roomId but rooms: [] — roomsOf() falls back to roomId
	await screen.findByRole("button", { name: /view earlier chat/i });
	expect(screen.getByTestId("landing-chat-composer")).toBeInTheDocument();
	expect(screen.queryByTestId("current-location")).not.toBeInTheDocument();
});
