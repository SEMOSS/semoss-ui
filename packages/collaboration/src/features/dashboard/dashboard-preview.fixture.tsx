import { createRoot } from "react-dom/client";
import { createMemoryRouter, Navigate, RouterProvider } from "react-router";
import { Insight, InsightContext } from "@semoss/sdk/react";
import { ThemeProvider, TooltipProvider } from "@semoss/ui/next";
import { CollaborationShell } from "@/features/collaboration/components/collaboration-shell";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { DailyChatPreview } from "@/features/daily-chat/daily-chat-preview.fixture";
import { settingsSections } from "@/features/settings/settings-sections";
import { WorkComposerStateProvider } from "@/features/work-thread/work-composer-state.context";
import { BrainPage } from "@/pages/brain.page";
import { DashboardPage } from "@/pages/dashboard.page";
import { SettingsPage } from "@/pages/settings.page";
import { WorkPage } from "@/pages/work.page";
import "@/index.css";

const state = createInitialCollaborationState();
state.profile.name = "Riley Warren";
state.profile.id = "visual-fixture-only";
state.profile.email = "fixture@example.invalid";
// A representative sample day exercises open, waiting and handled presentation.
const previewNow = new Date();
const openItems = state.items.filter(
	(item) => item.status === "open" && item.askType !== "fyi",
);
for (const [index, item] of openItems.entries()) {
	if (index >= 4) {
		item.status = "done";
		item.completedAt = new Date(
			previewNow.getTime() - (index + 1) * 900_000,
		).toISOString();
	} else {
		item.due = new Date(
			previewNow.getTime() + (index + 1) * 3_600_000,
		).toISOString();
	}
}
state.liveProfile = structuredClone(state.profile);
state.settings.sourcesJson = { calendar: true, email: true };
const today = new Date();
const events = [
	"Product planning",
	"Tailspin renewal call",
	"Design review",
].map((subject, index) => {
	const start = new Date(today);
	start.setHours(10 + index * 2, 30, 0, 0);
	return {
		id: `event-${index}`,
		subject,
		start: start.toISOString(),
		startTimeZone: "UTC",
		end: new Date(start.getTime() + 3600000).toISOString(),
		endTimeZone: "UTC",
		location: "Microsoft Teams",
		attendees: [{ name: "Carla Jimenez" }, { name: "Dana Osei" }],
		body: "Review decisions and agree next steps.",
		organizerName: "Carla Jimenez",
	};
});
const instance = new Insight();
const actions = {
	...instance.actions,
	run: (async (statement: string) => {
		let output: unknown = [];
		if (statement.includes("MicrosoftCalendarListEvents"))
			output = { count: events.length, events };
		else if (statement.includes("MicrosoftCalendarGetEvent"))
			output = events[0];
		else if (statement.includes("MicrosoftOutlookListMail("))
			output = { folder: "inbox", count: 0, messages: [] };
		else if (statement.includes("GetPlaygroundRooms"))
			output = Array.from({ length: 12 }, (_, index) => ({
				ROOM_ID: `room-${index}`,
				DATE_UPDATED: new Date(
					Date.now() - Math.floor(index / 2) * 86400000,
				).toISOString(),
				ROOM_NAME: [
					"Prepare for the renewal call",
					"Weekly product brief",
					"Review the launch plan",
					"Q4 priorities",
					"Customer follow-up",
				][index % 5],
			}));
		return { pixelReturn: [{ output, operationType: [] }] };
	}) as typeof instance.actions.run,
};
const router = createMemoryRouter(
	[
		{
			Component: CollaborationShell,
			children: [
				{ index: true, Component: DashboardPage },
				{ path: "new", Component: DailyChatPreview },
				{ path: "work/thread/:threadId", Component: DailyChatPreview },
				...[
					"work",
					"work/waiting",
					"work/done",
					"work/topic/:topicId",
				].map((path) => ({ path, Component: WorkPage })),
				{
					path: "brain/profile",
					element: <Navigate to="/settings/about-you" replace />,
				},
				{
					path: "settings",
					Component: SettingsPage,
					children: [
						{
							index: true,
							element: (
								<Navigate to="/settings/about-you" replace />
							),
						},
						...settingsSections.map(({ id }) => ({
							path: id,
							element: <></>,
						})),
					],
				},
				...[
					"brain",
					"brain/people",
					"brain/people/:personId",
					"brain/threads",
					"brain/threads/:threadId",
					"brain/topics/:topicId",
					"brain/sources",
				].map((path) => ({ path, Component: BrainPage })),
			],
		},
	],
	{
		initialEntries: [
			new URLSearchParams(window.location.search).get("page") || "/",
		],
	},
);
const root = document.getElementById("root");
if (root && import.meta.env.DEV)
	createRoot(root).render(
		<ThemeProvider
			defaultTheme="light"
			storageKey="dashboard-visual-fixture-theme"
		>
			<TooltipProvider>
				<InsightContext.Provider
					value={{
						actions,
						insightId: "fixture",
						isInitialized: true,
						isAuthorized: true,
						isReady: true,
						error: null,
						system: null,
					}}
				>
					<CollaborationSessionProvider initialState={state}>
						<div className="p-4">
							<WorkComposerStateProvider>
								<RouterProvider router={router} />
							</WorkComposerStateProvider>
							<p className="pointer-events-none fixed right-3 bottom-1 rounded bg-background/90 px-2 py-0.5 text-muted-foreground text-xs">
								Design preview · Sample data
							</p>
						</div>
					</CollaborationSessionProvider>
				</InsightContext.Provider>
			</TooltipProvider>
		</ThemeProvider>,
	);
