import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { DashboardSettings } from "@/features/settings/dashboard-settings";
import type { InsightActions } from "@/lib/pixel";
import { DashboardContext } from "./dashboard.context";
import { DashboardGrid } from "./dashboard-grid";
import { presetWidgets, saveDashboardPreferences } from "./dashboard-layout";
import { DashboardSourceDialog } from "./dashboard-source-dialog";
import { useDashboardLayout } from "./use-dashboard-layout";

vi.mock("./dashboard-widget-content", () => ({
	DashboardWidgetContent: ({
		widget,
	}: {
		widget: { kind: string; title: string };
	}) =>
		widget.kind === "app" ? (
			<iframe title={widget.title} />
		) : (
			<p>{widget.title} content</p>
		),
}));
vi.mock("@/features/connectors/components/source-preview", () => ({
	SourcePreview: () => null,
}));
const actions = {} as InsightActions;

function Harness() {
	const layout = useDashboardLayout("interaction-layout");
	return (
		<MemoryRouter>
			<CollaborationSessionProvider
				initialState={createInitialCollaborationState()}
			>
				<DashboardContext.Provider
					value={{
						actions,
						layout,
						history: {
							rooms: [],
							isLoading: false,
							error: "",
							hasMore: false,
							loadMore: vi.fn(),
							refresh: vi.fn(),
							retry: vi.fn(),
							scrollTop: { current: 0 },
						},
						calendar: {
							data: null,
							error: "",
							isLoading: false,
							checkedAt: null,
							refresh: vi.fn(),
						},
						mail: {
							data: null,
							error: "",
							isLoading: false,
							checkedAt: null,
							refresh: vi.fn(),
						},
						refreshSources: vi.fn(),
						refreshRevision: 0,
						isSearchOpen: false,
						setIsSearchOpen: vi.fn(),
						searchReturnFocus: { current: null },
						sourceReturnFocus: { current: null },
						source: null,
						setSource: vi.fn(),
						openRoom: vi.fn(),
						openingRoom: null,
					}}
				>
					<DashboardSettings />
					{layout.isEditing && (
						<button type="button" onClick={layout.cancel}>
							Cancel layout
						</button>
					)}
					<DashboardGrid />
					<DashboardSourceDialog />
				</DashboardContext.Provider>
			</CollaborationSessionProvider>
		</MemoryRouter>
	);
}

afterEach(() => {
	cleanup();
	localStorage.clear();
});

it("opens customization from Settings, resizes by keyboard, preserves app nodes through reorder, and cancels changes", async () => {
	const widgets = presetWidgets();
	saveDashboardPreferences("interaction-layout", {
		version: 1,
		presets: [],
		widgets: [
			...widgets,
			{
				...widgets[0],
				id: "app-report",
				kind: "app",
				title: "Report",
				appId: "report",
			},
		],
	});
	const user = userEvent.setup();
	const { container } = render(<Harness />);
	const app = screen.getByTitle("Report");
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: "Resize Your day" }),
	).not.toBeInTheDocument();
	await user.click(
		screen.getByRole("button", { name: "Customize dashboard" }),
	);
	const day = screen.getByRole("region", { name: "Your day" });
	fireEvent.keyDown(screen.getByRole("button", { name: "Resize Your day" }), {
		key: "ArrowDown",
	});
	expect(day.style.gridRow).toBe("span 88");
	await user.click(screen.getByRole("button", { name: "Configure Report" }));
	await user.click(screen.getByRole("button", { name: "Earlier" }));
	await user.keyboard("{Escape}");
	expect(
		[...container.querySelectorAll("[data-widget-id]")].map((node) =>
			node.getAttribute("data-widget-id"),
		),
	).toEqual(["day", "needs", "agents", "app-report", "email"]);
	expect(screen.getByTitle("Report")).toBe(app);
	await user.click(
		screen.getByRole("button", { name: "Hide Agents needing you" }),
	);
	expect(
		screen.queryByRole("region", { name: "Agents needing you" }),
	).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "Cancel layout" }));
	expect(
		screen.getByRole("region", { name: "Agents needing you" }),
	).toBeVisible();
	expect(
		within(screen.getByRole("region", { name: "Your day" })).getByText(
			"Your day content",
		),
	).toBeVisible();
	expect(day.style.gridRow).toBe("span 80");
	expect(screen.getByTitle("Report")).toBe(app);
});
