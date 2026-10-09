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
import type { ReactNode } from "react";
import { useContext, useLayoutEffect, useRef, useState } from "react";
import { createMemoryRouter, useLocation } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Textarea } from "@semoss/ui/next";
import { DashboardProvider } from "@/features/dashboard/dashboard-provider";
import { RoomHeader } from "@/features/rooms/components/room-header";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { CollaborationFrame } from "./collaboration-frame";
import { CollaborationWorkbenchLayoutContext } from "./collaboration-workbench-layout.context";

const remote = vi.hoisted(() => ({
	actions: { run: vi.fn(), logout: vi.fn() },
	tree: {
		rooms: [
			{
				roomId: "room-one",
				roomName: "Pricing conversation",
				topics: [
					{
						topicId: "t-geng",
						name: "Northwind Engineering",
						short: "Northwind Eng",
					},
				],
			},
			{ roomId: "room-two", roomName: "Sprint conversation", topics: [] },
		],
		hasMore: false,
		isLoading: false,
		error: "",
		loadMore: vi.fn(),
		refresh: vi.fn(),
		retry: vi.fn(),
		scrollTop: { current: 0 },
	},
	history: {
		rooms: [{ roomId: "room-one", roomName: "Pricing conversation" }],
		isLoading: false,
		error: "",
		hasMore: false,
		loadMore: vi.fn(),
		refresh: vi.fn(),
		retry: vi.fn(),
		scrollTop: { current: 0 },
	},
}));

vi.mock("@/features/for-you/for-you-provider", () => ({
	ForYouProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/features/for-you/for-you.context", () => ({
	useForYou: () => ({ items: [] }),
}));

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: remote.actions }),
}));
vi.mock("@/features/room-tree/room-tree.context", () => ({
	useRoomTree: () => remote.tree,
}));
vi.mock("@/features/room-tree/room-tree-provider", () => ({
	RoomTreeProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/features/dashboard/use-chat-history", () => ({
	useChatHistory: () => remote.history,
}));
vi.mock("@/features/dashboard/use-visible-resource", () => ({
	useVisibleResource: () => ({
		data: [],
		error: "",
		isLoading: false,
		checkedAt: null,
		refresh: vi.fn(),
	}),
}));
vi.mock("@/features/dashboard/dashboard-source-dialog", () => ({
	DashboardSourceDialog: () => null,
}));

let isWide = true;
const mediaListeners = new Set<() => void>();

/** Keep real frame and palette coordination while isolating remote data reads. */
function FrameFixture() {
	return (
		<DashboardProvider>
			<CollaborationFrame />
		</DashboardProvider>
	);
}

/** A persistent route outlet exposes accidental remounts through an unsaved draft. */
function DraftFixture() {
	const { pathname } = useLocation();
	const layout = useContext(CollaborationWorkbenchLayoutContext);
	const registerConversation = layout?.registerConversation;
	const conversationRef = useRef<HTMLDivElement>(null);
	const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
	const isRoom = pathname.startsWith("/thread/");
	useLayoutEffect(() => {
		if (isRoom && isWorkbenchOpen && conversationRef.current)
			return registerConversation?.(conversationRef.current);
	}, [isRoom, isWorkbenchOpen, registerConversation]);
	return (
		<div ref={conversationRef}>
			{isRoom && (
				<RoomHeader
					agent={{
						name: "Research agent",
						description: "",
						system_prompt: "",
						mcp: [],
						skills: [],
						prompts: [],
					}}
					title="Pricing conversation"
					isToolWorkbenchOpen={isWorkbenchOpen}
					onToggleToolWorkbench={() =>
						setIsWorkbenchOpen((open) => !open)
					}
				/>
			)}
			<Textarea aria-label="Conversation draft" defaultValue="" />
		</div>
	);
}

function renderFrame(path = "/") {
	const router = createMemoryRouter(
		[
			{
				Component: FrameFixture,
				children: [{ path: "*", Component: DraftFixture }],
			},
		],
		{ initialEntries: [path] },
	);
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return { router, user: userEvent.setup() };
}

/** Simulate the frame's responsive subscription, independently of jsdom layout. */
function setDesktop(matches: boolean): void {
	act(() => {
		isWide = matches;
		for (const listener of mediaListeners) listener();
	});
}

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
	isWide = true;
	mediaListeners.clear();
	remote.history.scrollTop.current = 0;
	remote.tree.scrollTop.current = 0;
	vi.stubGlobal("matchMedia", (query: string) => ({
		get matches() {
			return query === "(min-width: 64rem)" && isWide;
		},
		addEventListener: (_event: string, listener: () => void) =>
			mediaListeners.add(listener),
		removeEventListener: (_event: string, listener: () => void) =>
			mediaListeners.delete(listener),
	}));
	// The palette falls back to the currently visible trigger after a mobile
	// drawer unmounts. jsdom supplies no rectangles, so model this boundary only.
	vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
		function (this: HTMLElement) {
			const isDesktopControl = Boolean(
				this.closest('aside[aria-label="Workspace navigation"]'),
			);
			const isMobileControl =
				this.getAttribute("aria-label") === "Open navigation";
			const isVisible =
				this.isConnected &&
				!this.closest("[hidden]") &&
				(isDesktopControl ? isWide : isMobileControl ? !isWide : true);
			const rectangles = isVisible ? [new DOMRect(0, 0, 40, 40)] : [];
			return Object.assign(rectangles, {
				item: (index: number) => rectangles[index] ?? null,
			});
		},
	);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	localStorage.clear();
});

describe("CollaborationFrame", () => {
	it("closes the desktop account menu and focuses mobile navigation when its avatar becomes hidden", async () => {
		const { user } = renderFrame();
		act(() =>
			screen.getByRole("button", { name: /Account menu for/ }).focus(),
		);
		await user.keyboard("{Enter}");
		await waitFor(() =>
			expect(
				screen.getByRole("menuitem", { name: "Settings" }),
			).toHaveFocus(),
		);
		setDesktop(false);
		await waitFor(() =>
			expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
		);
		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Open navigation" }),
			).toHaveFocus(),
		);
	});

	it("reserves the measured conversation header without remounting drafts and restores page layout", async () => {
		const observers = new Set<ResizeObserverCallback>();
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(private callback: ResizeObserverCallback) {
					observers.add(callback);
				}
				observe() {}
				unobserve() {}
				disconnect() {
					observers.delete(this.callback);
				}
			},
		);
		let conversationWidth = 420;
		let headerHeight = 56;
		vi.spyOn(
			HTMLElement.prototype,
			"getBoundingClientRect",
		).mockImplementation(function (this: HTMLElement) {
			return new DOMRect(
				0,
				0,
				conversationWidth,
				this.tagName === "HEADER" ? headerHeight : 700,
			);
		});
		const { router, user } = renderFrame("/thread/room%3Aone");
		const search = screen.getByRole("button", {
			name: "Search your workspace",
		});
		const header = search.closest("header");
		const headerContainer = header?.parentElement;
		const content = headerContainer?.parentElement;
		const draft = screen.getByRole("textbox", {
			name: "Conversation draft",
		});
		await user.type(draft, "Keep this draft");
		await user.click(
			screen.getByRole("button", { name: "Open workbench" }),
		);
		expect(headerContainer).toHaveClass("md:absolute");
		expect(
			content?.style.getPropertyValue(
				"--collaboration-conversation-width",
			),
		).toBe("420px");
		expect(
			content?.style.getPropertyValue("--collaboration-header-height"),
		).toBe("56px");
		conversationWidth = 240;
		headerHeight = 104;
		act(() => {
			for (const notify of observers) notify([], {} as ResizeObserver);
		});
		expect(
			content?.style.getPropertyValue(
				"--collaboration-conversation-width",
			),
		).toBe("240px");
		expect(
			content?.style.getPropertyValue("--collaboration-header-height"),
		).toBe("104px");
		await user.click(
			screen.getByRole("button", { name: "Close workbench" }),
		);
		expect(headerContainer).not.toHaveClass("md:absolute");
		expect(draft).toHaveValue("Keep this draft");
		expect(
			screen.getByRole("button", { name: "Search your workspace" }),
		).toBe(search);
		await user.click(
			screen.getByRole("button", { name: "Open workbench" }),
		);
		await act(() => router.navigate("/brain"));
		expect(headerContainer).not.toHaveClass("md:absolute");
		expect(
			content?.style.getPropertyValue(
				"--collaboration-conversation-width",
			),
		).toBe("");
		expect(observers.size).toBe(0);
	});

	it("dismisses the mobile account menu before the navigation drawer and returns focus", async () => {
		isWide = false;
		const { user } = renderFrame();
		const navigationTrigger = screen.getByRole("button", {
			name: "Open navigation",
		});
		await user.click(navigationTrigger);
		const drawer = screen.getByRole("dialog", {
			name: "Workspace navigation",
		});
		const avatar = within(drawer).getByRole("button", {
			name: /Account menu for/,
		});
		await user.click(avatar);
		expect(
			screen.getByRole("menuitem", { name: "Settings" }),
		).toBeVisible();
		await user.keyboard("{Escape}");
		await waitFor(() => expect(avatar).toHaveFocus());
		expect(drawer).toBeVisible();
		await user.keyboard("{Escape}");
		await waitFor(() => expect(navigationTrigger).toHaveFocus());
	});

	it.each(["/", "/settings"])(
		"closes mobile account navigation from %s and focuses Settings",
		async (path) => {
			isWide = false;
			const { user, router } = renderFrame(path);
			await user.click(
				screen.getByRole("button", { name: "Open navigation" }),
			);
			const drawer = screen.getByRole("dialog", {
				name: "Workspace navigation",
			});
			await user.click(
				within(drawer).getByRole("button", {
					name: /Account menu for/,
				}),
			);
			await user.click(
				screen.getByRole("menuitem", { name: "Settings" }),
			);
			await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
			expect(screen.queryByRole("menu")).not.toBeInTheDocument();
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			expect(router.state.location.pathname).toBe("/settings");
		},
	);

	it.each(["/", "/for-you"])(
		"returns home from the mobile brand on %s and closes navigation",
		async (path) => {
			isWide = false;
			const { user, router } = renderFrame(path);
			await user.click(
				screen.getByRole("button", { name: "Open navigation" }),
			);
			const drawer = screen.getByRole("dialog", {
				name: "Workspace navigation",
			});
			await user.click(
				within(drawer).getByRole("link", {
					name: "Collaboration home",
				}),
			);
			expect(router.state.location.pathname).toBe("/");
			await waitFor(() =>
				expect(
					screen.queryByRole("dialog", {
						name: "Workspace navigation",
					}),
				).not.toBeInTheDocument(),
			);
			expect(screen.getByRole("main")).toHaveFocus();
		},
	);

	it("keeps one header and search palette mounted across page and room navigation", async () => {
		const { router, user } = renderFrame();
		const header = screen
			.getByRole("button", { name: "Search your workspace" })
			.closest("header");
		const search = screen.getByRole("button", {
			name: "Search your workspace",
		});
		const account = screen.getByRole("button", {
			name: /Account menu for/,
		});
		expect(header).not.toContainElement(account);
		expect(
			screen.getByRole("complementary", { name: "Workspace navigation" }),
		).toContainElement(account);
		for (const path of [
			"/brain",
			"/settings/about-you",
			"/thread/room%3Aone",
			"/",
		]) {
			await act(() => router.navigate(path));
			expect(document.querySelectorAll("header")).toHaveLength(1);
			if (path.startsWith("/thread/")) {
				expect(header).toContainElement(
					screen.getByRole("heading", {
						name: "Pricing conversation",
					}),
				);
			} else {
				expect(
					screen.queryByRole("button", {
						name: /Conversation details/,
					}),
				).not.toBeInTheDocument();
			}
			expect(
				screen
					.getByRole("button", { name: "Search your workspace" })
					.closest("header"),
			).toBe(header);
			expect(
				screen.getByRole("button", { name: "Search your workspace" }),
			).toBe(search);
			expect(
				screen.getByRole("button", { name: /Account menu for/ }),
			).toBe(account);
		}
		expect(
			screen.queryByRole("button", { name: /Switch to .* theme/ }),
		).not.toBeInTheDocument();
		act(() => search.focus());
		await user.keyboard("{Control>}k{/Control}");
		expect(
			screen.getAllByRole("dialog", { name: "Search your workspace" }),
		).toHaveLength(1);
		await user.keyboard("{Escape}");
		await waitFor(() => expect(search).toHaveFocus());
		await user.click(search);
		await user.click(screen.getByRole("option", { name: /Brain/ }));
		await waitFor(() =>
			expect(router.state.location.pathname).toBe("/brain"),
		);
		expect(screen.getByRole("main")).toHaveFocus();
	});

	it.each(["{Enter}", " "])(
		"toggles the room sidebar with its rail using %s without remounting the draft",
		async (key) => {
			const { user } = renderFrame("/thread/room%3Aroom-one");
			const navigation = screen.getByRole("complementary", {
				name: "Workspace navigation",
			});
			const draft = screen.getByRole("textbox", {
				name: "Conversation draft",
			});
			await user.type(draft, "Keep this unsent message");
			expect(navigation).toHaveClass("w-16");
			expect(
				within(navigation).getByRole("navigation", { name: "Main" }),
			).toBeVisible();
			expect(
				screen.getByRole("button", {
					name: "Search your workspace",
				}),
			).toBeVisible();
			expect(
				within(navigation).getByRole("link", { name: "For you" }),
			).toBeVisible();
			const expand = screen.getByRole("button", {
				name: "Expand navigation",
			});
			expect(navigation).toContainElement(expand);
			expect(expand.closest("header")).toBeNull();
			expect(expand).toHaveAttribute("data-sidebar", "rail");
			expect(expand).toHaveAttribute("tabindex", "0");
			expect(expand.querySelector("svg")).toBeNull();
			const controlsId = expand.getAttribute("aria-controls");
			expect(controlsId).toBeTruthy();
			expect(navigation).toContainElement(
				document.getElementById(controlsId ?? ""),
			);
			expect(screen.getByRole("main")).not.toHaveClass("lg:pl-14");
			await user.click(expand);
			expect(navigation).toHaveClass("w-64");
			expect(
				screen.getByRole("button", {
					name: "Collapse navigation",
				}),
			).toHaveAttribute("aria-expanded", "true");
			expect(
				screen.getByRole("textbox", { name: "Conversation draft" }),
			).toBe(draft);
			expect(draft).toHaveValue("Keep this unsent message");
			const rail = screen.getByRole("button", {
				name: "Collapse navigation",
			});
			expect(rail).toBe(expand);
			expect(rail).toHaveFocus();
			await user.keyboard(key);
			expect(
				screen.getByRole("button", { name: "Expand navigation" }),
			).toHaveFocus();
			expect(navigation).toHaveClass("w-16");
			expect(draft).toHaveValue("Keep this unsent message");
		},
	);

	it("returns focus to the rail when the navigation shortcut hides a focused session", async () => {
		const { user } = renderFrame();
		act(() =>
			screen.getByRole("link", { name: "Pricing conversation" }).focus(),
		);
		await user.keyboard("{Control>}b{/Control}");
		expect(
			screen.getByRole("button", { name: "Expand navigation" }),
		).toHaveFocus();
	});

	it("collapses each opened room and restores the sidebar preference on other pages", async () => {
		const { router, user } = renderFrame();
		const navigation = screen.getByRole("complementary", {
			name: "Workspace navigation",
		});
		const writes = vi.spyOn(Storage.prototype, "setItem");
		expect(navigation).toHaveClass("w-64");
		await act(() => router.navigate("/thread/session%3Aone"));
		expect(navigation).toHaveClass("w-16");
		await user.click(
			screen.getByRole("button", { name: "Expand navigation" }),
		);
		expect(navigation).toHaveClass("w-64");
		await act(() => router.navigate("/thread/room%3Atwo"));
		expect(navigation).toHaveClass("w-16");
		await act(() => router.navigate("/thread/session%3Aone"));
		expect(navigation).toHaveClass("w-16");
		await act(() => router.navigate("/brain"));
		expect(navigation).toHaveClass("w-64");
		expect(
			writes.mock.calls.some(([key]) =>
				String(key).endsWith(":isCollapsed"),
			),
		).toBe(false);
	});

	it("opens the exact room link, collapses the sidebar, and moves focus into the conversation", async () => {
		const { router, user } = renderFrame();
		const session = screen.getByRole("link", {
			name: "Pricing conversation",
		});
		await user.click(session);
		expect(router.state.location.pathname).toBe("/thread/room%3Aroom-one");
		expect(screen.getByRole("main")).toHaveFocus();
		expect(
			screen.getByRole("button", { name: "Expand navigation" }),
		).toHaveAttribute("aria-expanded", "false");
	});

	it("closes the mobile drawer after selecting a room and focuses the conversation", async () => {
		isWide = false;
		const { user, router } = renderFrame();
		await user.click(
			screen.getByRole("button", { name: "Open navigation" }),
		);
		const drawer = screen.getByRole("dialog", {
			name: "Workspace navigation",
		});
		await user.click(
			within(drawer).getByRole("link", { name: "Pricing conversation" }),
		);
		await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
		expect(router.state.location.pathname).toBe("/thread/room%3Aroom-one");
		expect(drawer).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Expand navigation" }),
		).toHaveAttribute("aria-expanded", "false");
	});

	it("restores the collapsed sidebar after a fresh mount and keeps every room accessible", async () => {
		const { user } = renderFrame();
		await user.click(
			screen.getByRole("button", { name: "Collapse navigation" }),
		);
		cleanup();
		renderFrame();
		const expand = screen.getByRole("button", {
			name: "Expand navigation",
		});
		expect(expand).toHaveAttribute("aria-expanded", "false");
		await user.click(expand);
		expect(
			screen.getByRole("link", { name: "Pricing conversation" }),
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Sprint conversation" }),
		).toBeVisible();
		expect(
			within(
				screen.getByRole("navigation", { name: "Rooms" }),
			).getAllByRole("list"),
		).toHaveLength(1);
	});

	it("restores the room list scroll position when mobile navigation reopens", async () => {
		isWide = false;
		const { user } = renderFrame();
		await user.click(
			screen.getByRole("button", { name: "Open navigation" }),
		);
		const dialog = screen.getByRole("dialog", {
			name: "Workspace navigation",
		});
		const scroller = within(dialog).getByRole("navigation", {
			name: "Rooms",
		}).parentElement;
		if (!scroller) throw new Error("Rooms must have a scroll container");
		scroller.scrollTop = 160;
		fireEvent.scroll(scroller);
		expect(remote.tree.scrollTop.current).toBe(160);
		await user.keyboard("{Escape}");
		await user.click(
			screen.getByRole("button", { name: "Open navigation" }),
		);
		const reopened = screen.getByRole("dialog", {
			name: "Workspace navigation",
		});
		expect(
			within(reopened).getByRole("navigation", { name: "Rooms" })
				.parentElement?.scrollTop,
		).toBe(160);
		expect(
			within(reopened).getByRole("link", {
				name: "Pricing conversation",
			}),
		).toBeVisible();
		expect(
			within(reopened).getByRole("link", { name: "Sprint conversation" }),
		).toBeVisible();
		setDesktop(true);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(
			screen.getByRole("link", { name: "Pricing conversation" }),
		).toBeVisible();
		expect(remote.tree.refresh).not.toHaveBeenCalled();
	});

	it.each(["Escape", "Close navigation"])(
		"dismisses mobile navigation with %s and restores focus to its trigger",
		async (dismissal) => {
			isWide = false;
			const { user, router } = renderFrame();
			const trigger = screen.getByRole("button", {
				name: "Open navigation",
			});
			await user.click(trigger);
			const dialog = screen.getByRole("dialog", {
				name: "Workspace navigation",
			});
			expect(dialog).toContainElement(
				document.activeElement as HTMLElement,
			);
			expect(
				within(dialog).queryByRole("button", {
					name: "Collapse navigation",
				}),
			).not.toBeInTheDocument();
			if (dismissal === "Escape") await user.keyboard("{Escape}");
			else
				await user.click(
					within(dialog).getByRole("button", {
						name: "Close navigation",
					}),
				);
			await waitFor(() => expect(trigger).toHaveFocus());
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			expect(router.state.location.pathname).toBe("/");
		},
	);

	it("closes mobile navigation on selection and sends focus into the destination", async () => {
		isWide = false;
		const { user, router } = renderFrame();
		await user.click(
			screen.getByRole("button", { name: "Open navigation" }),
		);
		const dialog = screen.getByRole("dialog", {
			name: "Workspace navigation",
		});
		await user.click(within(dialog).getByRole("link", { name: "Brain" }));
		await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(router.state.location.pathname).toBe("/brain");
	});

	it("shows the full account row in mobile navigation even when the desktop sidebar is collapsed", async () => {
		const { user } = renderFrame();
		await user.click(
			screen.getByRole("button", { name: "Collapse navigation" }),
		);
		const desktopAccount = screen.getByRole("button", {
			name: "Account menu for Robin Hale",
		});
		expect(desktopAccount).not.toHaveTextContent("Robin Hale");
		setDesktop(false);
		await user.click(
			screen.getByRole("button", { name: "Open navigation" }),
		);
		const drawer = screen.getByRole("dialog", {
			name: "Workspace navigation",
		});
		const mobileAccount = within(drawer).getByRole("button", {
			name: "Account menu for Robin Hale",
		});
		expect(within(mobileAccount).getByText("Robin Hale")).toBeVisible();
		expect(
			within(drawer).queryByRole("link", { name: "Settings" }),
		).not.toBeInTheDocument();
		await user.click(mobileAccount);
		expect(
			screen.getByRole("menuitem", { name: "Settings" }),
		).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "Log out" })).toBeVisible();
		await user.keyboard("{Escape}");
		await waitFor(() => expect(mobileAccount).toHaveFocus());
	});

	it("closes an open drawer when the route changes elsewhere", async () => {
		isWide = false;
		const { user, router } = renderFrame();
		await user.click(
			screen.getByRole("button", { name: "Open navigation" }),
		);
		expect(
			screen.getByRole("dialog", { name: "Workspace navigation" }),
		).toBeVisible();
		await act(() => router.navigate("/work/waiting"));
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("opens Search directly from the mobile header and returns focus there", async () => {
		isWide = false;
		const { user } = renderFrame();
		const trigger = screen.getByRole("button", {
			name: "Search your workspace",
		});
		await user.click(trigger);
		const search = screen.getByRole("dialog", {
			name: "Search your workspace",
		});
		await waitFor(() =>
			expect(
				within(search).getByRole("combobox", { name: "Search" }),
			).toHaveFocus(),
		);
		expect(
			screen.queryByRole("dialog", { name: "Workspace navigation" }),
		).not.toBeInTheDocument();
		await user.keyboard("{Escape}");
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it("hands focus from an open mobile drawer to keyboard search", async () => {
		isWide = false;
		const { user } = renderFrame();
		const trigger = screen.getByRole("button", { name: "Open navigation" });
		await user.click(trigger);
		await user.keyboard("{Control>}k{/Control}");
		const search = screen.getByRole("dialog", {
			name: "Search your workspace",
		});
		await waitFor(() =>
			expect(
				within(search).getByRole("combobox", { name: "Search" }),
			).toHaveFocus(),
		);
		expect(
			screen.queryByRole("dialog", { name: "Workspace navigation" }),
		).not.toBeInTheDocument();
		await user.keyboard("{Escape}");
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it("returns Search focus to its persistent header trigger when dismissed on desktop", async () => {
		const { user } = renderFrame();
		await user.click(
			screen.getByRole("button", { name: "Collapse navigation" }),
		);
		const trigger = screen.getByRole("button", {
			name: "Search your workspace",
		});
		await user.click(trigger);
		const dialog = screen.getByRole("dialog", {
			name: "Search your workspace",
		});
		await waitFor(() =>
			expect(
				within(dialog).getByRole("combobox", { name: "Search" }),
			).toHaveFocus(),
		);
		await user.keyboard("{Escape}");
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it("closes the drawer on desktop resize, transfers focus safely, and stays closed after shrinking", async () => {
		isWide = false;
		const { user } = renderFrame();
		await user.click(
			screen.getByRole("button", { name: "Open navigation" }),
		);
		const drawer = screen.getByRole("dialog", {
			name: "Workspace navigation",
		});
		expect(drawer).toBeVisible();
		setDesktop(true);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(
			screen.getByRole("button", { name: "Collapse navigation" }),
		).toHaveFocus();
		setDesktop(false);
		expect(
			screen.getByRole("button", { name: "Open navigation" }),
		).toHaveFocus();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("moves a focused mobile trigger to the desktop rail when the viewport widens", () => {
		isWide = false;
		renderFrame();
		act(() =>
			screen.getByRole("button", { name: "Open navigation" }).focus(),
		);
		setDesktop(true);
		expect(
			screen.getByRole("button", { name: "Collapse navigation" }),
		).toHaveFocus();
	});
});
