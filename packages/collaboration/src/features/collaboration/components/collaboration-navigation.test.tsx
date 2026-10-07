import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "@semoss/ui/next";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { CollaborationNavigation } from "./collaboration-navigation";

const dashboard = vi.hoisted(() => ({
	setIsSearchOpen: vi.fn(),
	searchReturnFocus: { current: null as HTMLElement | null },
	openRoom: vi.fn<() => Promise<void>>(),
	openingRoom: null,
	history: {
		rooms: [
			{ roomId: "room-one", roomName: "Pricing conversation" },
			{ roomId: "room-two", roomName: "Sprint conversation" },
		],
		isLoading: false,
		error: "",
		hasMore: false,
		loadMore: vi.fn(),
		refresh: vi.fn(),
		retry: vi.fn(),
		scrollTop: { current: 0 },
	},
}));

vi.mock("@/features/dashboard/dashboard.context", () => ({
	useDashboard: () => dashboard,
}));

/** Exercise the controlled navigation contract without involving persistence. */
function NavigationFixture({ onNavigate }: { onNavigate?: () => void }) {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isTopicsOpen, setIsTopicsOpen] = useState(false);
	return (
		<>
			<Button
				type="button"
				onClick={() => setIsCollapsed((current) => !current)}
			>
				Toggle navigation fixture
			</Button>
			<CollaborationNavigation
				isCollapsed={isCollapsed}
				isTopicsOpen={isTopicsOpen}
				onTopicsOpenChange={setIsTopicsOpen}
				onNavigate={onNavigate}
			/>
		</>
	);
}

/** Render the real header, topics, and history on a persistent route. */
function renderNavigation(
	path = "/",
	state = createInitialCollaborationState(),
) {
	const onNavigate = vi.fn();
	const router = createMemoryRouter(
		[
			{
				path: "*",
				element: <NavigationFixture onNavigate={onNavigate} />,
			},
		],
		{ initialEntries: [path] },
	);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return { router, onNavigate, user: userEvent.setup() };
}

beforeEach(() => {
	vi.clearAllMocks();
	dashboard.searchReturnFocus.current = null;
	dashboard.history.scrollTop.current = 0;
	dashboard.openRoom.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("CollaborationNavigation", () => {
	it("keeps the overview, Work, and Brain distinct with folded Topics", () => {
		const state = createInitialCollaborationState();
		state.items = [];
		state.reviews = [];
		state.topics = [];
		state.memories = [];
		renderNavigation("/", state);

		expect(screen.getByText("Collaboration")).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "Collaboration workspace" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", {
				name: /(?:Collapse|Expand) navigation/,
			}),
		).not.toBeInTheDocument();
		const main = screen.getByRole("navigation", { name: "Main" });
		expect(
			Array.from(main.querySelectorAll("a,button")).map((control) =>
				control.getAttribute("aria-label"),
			),
		).toEqual(["New Session", "For you", "Work", "Brain"]);
		expect(
			within(main).getByRole("link", { name: "For you" }),
		).toHaveTextContent(/^For you$/);
		expect(
			within(main).getByRole("link", { name: "Brain" }),
		).toHaveTextContent(/^Brain$/);
		expect(screen.queryByText("Waiting on others")).not.toBeInTheDocument();
		expect(screen.queryByText("Handled")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Topics" })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
		expect(screen.getByRole("button", { name: "New topic" })).toBeVisible();
		expect(screen.getByRole("region", { name: "Sessions" })).toBeVisible();
	});

	it("shows nonzero work and Brain review counts without introducing zero labels", () => {
		const state = createInitialCollaborationState();
		state.items = state.items
			.filter((item) => item.status === "open" && item.askType !== "fyi")
			.slice(0, 2);
		state.reviews = state.reviews.slice(0, 1);
		state.topics = [];
		state.memories = [];
		renderNavigation("/", state);

		expect(
			within(screen.getByRole("link", { name: "For you" })).getByText(
				"2",
			),
		).toBeVisible();
		expect(
			within(screen.getByRole("link", { name: "Brain" })).getByText(
				/^1\b/,
			),
		).toBeVisible();
		expect(screen.queryByText(/^0(?: to check)?$/)).not.toBeInTheDocument();
	});

	it("selects For you only on the landing page", () => {
		renderNavigation("/");
		expect(screen.getByRole("link", { name: "For you" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(screen.getByRole("link", { name: "Work" })).not.toHaveAttribute(
			"aria-current",
		);
	});

	it.each([
		"/work",
		"/work/all",
		"/work/waiting",
		"/work/done",
		"/work/topic/t-geng",
	])("selects Work on %s", (path) => {
		renderNavigation(path);
		expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(
			screen.getByRole("link", { name: "For you" }),
		).not.toHaveAttribute("aria-current");
		expect(screen.getByRole("link", { name: "Brain" })).not.toHaveAttribute(
			"aria-current",
		);
	});

	it.each([
		"/brain",
		"/brain/people/p-ava",
		"/brain/threads/th-geng-review",
		"/brain/sources",
		"/brain/topics/t-geng",
	])("keeps Brain selected on %s", (path) => {
		renderNavigation(path);
		expect(screen.getByRole("link", { name: "Brain" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		expect(
			screen.getByRole("link", { name: "For you" }),
		).not.toHaveAttribute("aria-current");
		expect(screen.getByRole("link", { name: "Work" })).not.toHaveAttribute(
			"aria-current",
		);
	});

	it("opens Topics by keyboard and preserves the active topic destination", async () => {
		const { user, router, onNavigate } =
			renderNavigation("/work/topic/t-geng");
		const disclosure = screen.getByRole("button", { name: "Topics" });
		act(() => disclosure.focus());
		await user.keyboard("{Enter}");
		expect(disclosure).toHaveAttribute("aria-expanded", "true");
		const topics = screen.getByRole("navigation", { name: "Topics" });
		const selected = within(topics).getByRole("link", {
			name: /^Northwind Eng\b/,
		});
		expect(selected).toHaveAttribute("aria-current", "page");
		await user.click(selected);
		expect(onNavigate).toHaveBeenCalledOnce();
		await act(() => router.navigate("/brain/topics/t-geng"));
		expect(
			within(
				screen.getByRole("navigation", { name: "Topics" }),
			).getByRole("link", { name: /^Northwind Eng\b/ }),
		).toHaveAttribute("href", "/brain/topics/t-geng");
	});

	it("opens New topic independently of the folded Topics disclosure and returns focus", async () => {
		const { user } = renderNavigation();
		const trigger = screen.getByRole("button", { name: "New topic" });
		const disclosure = screen.getByRole("button", { name: "Topics" });
		await user.click(trigger);
		const dialog = screen.getByRole("dialog", { name: "New topic" });
		expect(disclosure).toHaveAttribute("aria-expanded", "false");
		await user.click(
			within(dialog).getByRole("button", { name: "Cancel" }),
		);
		await waitFor(() => expect(trigger).toHaveFocus());
		expect(disclosure).toHaveAttribute("aria-expanded", "false");
	});

	it("preserves the mounted session scroller, its position, and selection when collapsed", async () => {
		const { user } = renderNavigation("/thread/room%3Aroom-one");
		const session = screen.getByRole("button", {
			name: "Pricing conversation",
		});
		const list = screen.getByRole("navigation", { name: "Sessions" });
		const scroller = list.parentElement;
		if (!scroller) throw new Error("Sessions must have a scroll container");
		scroller.scrollTop = 180;
		fireEvent.scroll(scroller);
		expect(session).toHaveAttribute("aria-current", "page");
		const collapse = screen.getByRole("button", {
			name: "Toggle navigation fixture",
		});
		act(() => collapse.focus());
		await user.keyboard("{Enter}");
		expect(
			screen.getByRole("link", { name: "Settings" }),
		).not.toHaveTextContent("Settings");
		expect(session).toBeInTheDocument();
		expect(scroller.scrollTop).toBe(180);
		await user.keyboard("{Enter}");
		expect(
			screen.getByRole("button", { name: "Pricing conversation" }),
		).toBe(session);
		expect(screen.getByRole("navigation", { name: "Sessions" })).toBe(list);
		expect(scroller.scrollTop).toBe(180);
		expect(session).toHaveAttribute("aria-current", "page");
	});

	it("keeps every rail action named and supplies discoverable tooltips", async () => {
		const { user } = renderNavigation();
		await user.click(
			screen.getByRole("button", { name: "Toggle navigation fixture" }),
		);
		const controls = [
			screen.getByRole("link", { name: "New Session" }),
			screen.getByRole("link", { name: "For you" }),
			screen.getByRole("link", { name: "Work" }),
			screen.getByRole("link", { name: "Brain" }),
			screen.getByRole("link", { name: "Settings" }),
		];
		for (const control of controls) {
			expect(control).toBeVisible();
			await user.hover(control);
			expect(await screen.findByRole("tooltip")).toHaveTextContent(/\S/);
			await user.keyboard("{Escape}");
			await user.unhover(control);
		}
	});

	it("keeps a direct Settings link in the sidebar while leaving Search and account to the header", async () => {
		const { user, onNavigate, router } = renderNavigation();
		expect(
			screen.queryByRole("button", { name: "Search your workspace" }),
		).not.toBeInTheDocument();
		const settings = screen.getByRole("link", { name: "Settings" });
		expect(settings).toHaveTextContent("Settings");
		expect(
			screen.queryByRole("button", {
				name: /Account menu|Switch to .* theme/,
			}),
		).not.toBeInTheDocument();
		await user.click(settings);
		expect(onNavigate).toHaveBeenCalledOnce();
		expect(router.state.location.pathname).toBe("/settings");
	});
});
