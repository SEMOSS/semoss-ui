import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Textarea } from "@semoss/ui/next";
import { DashboardProvider } from "@/features/dashboard/dashboard-provider";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { CollaborationFrame } from "./collaboration-frame";

const remote = vi.hoisted(() => ({
	actions: { run: vi.fn() },
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

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: remote.actions }),
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
	return <Textarea aria-label="Conversation draft" defaultValue="" />;
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
	it("switches the desktop sidebar to a rail without remounting the conversation draft", async () => {
		const { user } = renderFrame("/room/room-one");
		const navigation = screen.getByRole("complementary", {
			name: "Workspace navigation",
		});
		const draft = screen.getByRole("textbox", {
			name: "Conversation draft",
		});
		await user.type(draft, "Keep this unsent message");
		expect(navigation).toHaveClass("w-64");
		await user.click(
			within(navigation).getByRole("button", {
				name: "Collapse navigation",
			}),
		);
		expect(navigation).toHaveClass("w-16");
		expect(
			within(navigation).getByRole("button", {
				name: "Expand navigation",
			}),
		).toHaveAttribute("aria-expanded", "false");
		expect(
			screen.getByRole("textbox", { name: "Conversation draft" }),
		).toBe(draft);
		expect(draft).toHaveValue("Keep this unsent message");
		await user.click(
			within(navigation).getByRole("button", {
				name: "Expand navigation",
			}),
		);
		expect(navigation).toHaveClass("w-64");
		expect(draft).toHaveValue("Keep this unsent message");
	});

	it("restores the chosen rail and Topics disclosure together after a fresh mount", async () => {
		const { user } = renderFrame();
		await user.click(screen.getByRole("button", { name: "Topics" }));
		await user.click(
			screen.getByRole("button", { name: "Collapse navigation" }),
		);
		cleanup();
		renderFrame();
		await user.click(
			screen.getByRole("button", { name: "Expand navigation" }),
		);
		expect(screen.getByRole("button", { name: "Topics" })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		expect(
			screen.getByRole("navigation", { name: "Topics" }),
		).toBeVisible();
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

	it("hands mobile focus to Search, then returns to the visible navigation trigger", async () => {
		isWide = false;
		const { user } = renderFrame();
		const trigger = screen.getByRole("button", { name: "Open navigation" });
		await user.click(trigger);
		const navigation = screen.getByRole("dialog", {
			name: "Workspace navigation",
		});
		await user.click(
			within(navigation).getByRole("button", {
				name: "Search your workspace",
			}),
		);
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

	it("returns Search focus to the rail trigger when dismissed on desktop", async () => {
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
		expect(
			screen.getByRole("dialog", { name: "Workspace navigation" }),
		).toBeVisible();
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

	it("moves a focused mobile trigger to the desktop toggle when the viewport widens", () => {
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

	it.each([false, true])(
		"preserves a new topic draft when resizing its drawer to desktop (rail: %s)",
		async (isCollapsed) => {
			const { user } = renderFrame();
			if (isCollapsed)
				await user.click(
					screen.getByRole("button", { name: "Collapse navigation" }),
				);
			setDesktop(false);
			await user.click(
				screen.getByRole("button", { name: "Open navigation" }),
			);
			const navigation = screen.getByRole("dialog", {
				name: "Workspace navigation",
			});
			await user.click(
				within(navigation).getByRole("button", { name: "New topic" }),
			);
			const dialog = screen.getByRole("dialog", { name: "New topic" });
			const name = within(dialog).getByRole("textbox", {
				name: "Name (required)",
			});
			await user.type(name, "Northwind strategy");
			setDesktop(true);
			await waitFor(() => expect(navigation).not.toBeInTheDocument());
			expect(screen.getByRole("dialog", { name: "New topic" })).toBe(
				dialog,
			);
			expect(name).toHaveValue("Northwind strategy");
			expect(name).toHaveFocus();
			await user.click(
				within(dialog).getByRole("button", { name: "Cancel" }),
			);
			await waitFor(() =>
				expect(
					screen.getByRole("button", {
						name: isCollapsed ? "Expand navigation" : "New topic",
					}),
				).toHaveFocus(),
			);
		},
	);
});
