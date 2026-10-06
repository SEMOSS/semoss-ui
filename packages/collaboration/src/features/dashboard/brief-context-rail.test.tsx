import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import type { CalendarEvent } from "@/features/connectors/api/microsoft-schemas";
import { DashboardPage } from "@/pages/dashboard.page";
import { BriefContextRail } from "./brief-context-rail";
import type { SourceSelection } from "./dashboard.context";

const dashboard = vi.hoisted(() => ({
	calendar: {
		data: [] as CalendarEvent[],
		error: "",
		isLoading: false,
		checkedAt: null,
		refresh: vi.fn(),
	},
	mail: { isLoading: false, checkedAt: null },
	refreshSources: vi.fn(),
	setSource: vi.fn<(source: SourceSelection | null) => void>(),
}));
const updates = vi.hoisted(() => ({
	isRefreshing: false,
	lastUpdated: null,
	error: "",
	refresh: vi.fn(),
}));
vi.mock("./dashboard.context", () => ({
	useDashboard: () => dashboard,
}));
vi.mock("@/features/collaboration/live/work-updates.context", () => ({
	useWorkUpdates: () => updates,
}));

function renderRail({ scoped = false, showBrief = false } = {}) {
	const state = createInitialCollaborationState();
	state.profile.timezone = "UTC";
	state.settings.sourcesJson.calendar = true;
	const topicId = state.topics[0].id;
	const baseItem = state.items[0];
	const baseThread = state.threads[0];
	const baseWorkspace = state.workspaces[baseThread.id];
	state.items = Array.from({ length: 9 }, (_, index) => ({
		...baseItem,
		id: `action-${index + 1}`,
		threadId: `thread-${index + 1}`,
		title: `Action ${index + 1}`,
		topicIds: [topicId],
		askType: "reply" as const,
		status: "open" as const,
		due: `2026-10-${String(index + 6).padStart(2, "0")}T12:00:00.000Z`,
	}));
	if (scoped)
		state.items.push({
			...baseItem,
			id: "outside-topic",
			threadId: "outside-thread",
			title: "Other topic action",
			topicIds: [state.topics[1].id],
			status: "open",
		});
	state.threads = state.items.map((item) => ({
		...baseThread,
		id: item.threadId,
		subject: item.title,
		topicLinks: item.topicIds.map((id) => ({
			topicId: id,
			source: "confirmed" as const,
			confidence: 100,
			primary: true,
		})),
		muted: false,
		automated: false,
	}));
	state.workspaces = Object.fromEntries(
		state.items.map((item) => [
			item.threadId,
			{
				...baseWorkspace,
				drafts: [
					{
						id: `draft-${item.id}`,
						to: "Colleague",
						cc: "",
						subject: item.title,
						body: "Please review this draft before sending.",
						isSample: true,
					},
				],
			},
		]),
	);
	return render(
		<MemoryRouter>
			<CollaborationSessionProvider initialState={state}>
				{showBrief && (
					<section aria-label="Daily brief">
						<DashboardPage />
					</section>
				)}
				<BriefContextRail topicId={scoped ? topicId : undefined} />
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.useFakeTimers({ toFake: ["Date"] });
	vi.setSystemTime(new Date("2026-10-06T09:00:00.000Z"));
	updates.error = "";
	dashboard.calendar.error = "";
	dashboard.calendar.data = [
		{
			id: "next-meeting",
			subject: "Product review",
			start: "2026-10-06T10:30:00.000Z",
			end: "2026-10-06T11:00:00.000Z",
			attendees: [{ name: "Jordan" }],
		},
	];
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

it("shares the Brief's full queue, draft, calendar action, and handled state in the requested order", async () => {
	const user = userEvent.setup();
	renderRail({ showBrief: true });
	const rail = within(
		screen.getByRole("complementary", { name: "Your daily context" }),
	);
	const brief = within(screen.getByRole("region", { name: "Daily brief" }));
	expect(
		rail
			.getAllByRole("heading", { level: 2 })
			.map((heading) => heading.textContent),
	).toEqual(["Needs you", "Your day", "Handled"]);
	const railNeeds = within(rail.getByRole("region", { name: "Needs you" }));
	const briefNeeds = within(brief.getByRole("region", { name: "Needs you" }));
	const titles = (region: ReturnType<typeof within>) =>
		region
			.getAllByRole("heading", { level: 3 })
			.map((heading) => heading.textContent);
	expect(titles(railNeeds)).toEqual(titles(briefNeeds));
	expect(titles(railNeeds)).toHaveLength(8);
	expect(
		railNeeds.getByText("Please review this draft before sending."),
	).toBeVisible();
	expect(
		railNeeds.getByRole("link", { name: "See all 9 →" }),
	).toHaveAttribute("href", "/work");
	expect(rail.queryByRole("region", { name: "Ask" })).not.toBeInTheDocument();
	expect(
		rail.queryByRole("region", { name: "Brain wants to check" }),
	).not.toBeInTheDocument();
	await user.click(
		rail.getByRole("button", { name: "Prepare for meeting →" }),
	);
	expect(dashboard.setSource).toHaveBeenCalledWith({
		kind: "calendar",
		id: "next-meeting",
	});
	await user.click(
		railNeeds.getAllByRole("button", { name: "Mark handled" })[0],
	);
	for (const surface of [rail, brief]) {
		expect(
			within(surface.getByRole("region", { name: "Handled" })).getByRole(
				"link",
				{ name: "Action 1" },
			),
		).toBeVisible();
	}
	await user.click(
		rail.getByRole("button", { name: "Undo: reopen Action 1" }),
	);
	expect(titles(railNeeds)).toEqual(titles(briefNeeds));
	expect(railNeeds.getByRole("link", { name: "Action 1" })).toBeVisible();
});

it("preserves topic filtering and independent work and calendar retry actions", async () => {
	const user = userEvent.setup();
	updates.error = "Work refresh failed.";
	dashboard.calendar.error = "Calendar refresh failed.";
	renderRail({ scoped: true });
	expect(
		screen.queryByRole("link", { name: "Other topic action" }),
	).not.toBeInTheDocument();
	const needs = within(screen.getByRole("region", { name: "Needs you" }));
	const day = within(screen.getByRole("region", { name: "Your day" }));
	expect(needs.getByRole("alert")).toHaveTextContent("Work refresh failed.");
	expect(day.getByRole("alert")).toHaveTextContent(
		"Calendar refresh failed.",
	);
	await user.click(needs.getByRole("button", { name: "Retry" }));
	await user.click(day.getByRole("button", { name: "Retry" }));
	expect(updates.refresh).toHaveBeenCalledOnce();
	expect(dashboard.calendar.refresh).toHaveBeenCalledOnce();
});
