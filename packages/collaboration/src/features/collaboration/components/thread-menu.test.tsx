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
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { TooltipProvider, toast } from "@semoss/ui/next";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import type { CollaborationState } from "../state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { CollaborationAccountContext } from "./collaboration-account.context";
import { CollaborationNavigation } from "./collaboration-navigation";
import { CollaborationSidebarProvider } from "./collaboration-sidebar-provider";
import { CollaborationSurface } from "./collaboration-surface";
import { ThreadMenu } from "./thread-menu";
import { threadUrl } from "./thread-menu.utils";

const threadId = "th-geng-review";

function MenuFixture({
	hideMuted = false,
	sidebarTitle,
	itemId,
	sourceMessageId,
	selectedThreadId = threadId,
}: {
	hideMuted?: boolean;
	sidebarTitle?: string;
	itemId?: string;
	sourceMessageId?: string;
	selectedThreadId?: string;
}) {
	const { state } = useCollaborationSession();
	const thread = state.threads.find(
		(candidate) => candidate.id === selectedThreadId,
	);
	if (!thread) throw new Error("Missing fixture thread");
	const isVisible = !hideMuted || !thread.muted;
	const content = (
		<main tabIndex={-1}>
			<output aria-label="Session state">{JSON.stringify(state)}</output>
			{isVisible && (
				<ThreadMenu
					thread={thread}
					sourceMessageId={sourceMessageId}
					item={state.items.find((item) => item.id === itemId)}
				>
					{(menu) => (
						<article aria-label="Thread row">
							<a href="#thread">{thread.subject}</a>
							{menu}
						</article>
					)}
				</ThreadMenu>
			)}
		</main>
	);
	return sidebarTitle ? (
		<CollaborationSurface
			aside={<p>Sidebar contents</p>}
			asideTitle={sidebarTitle}
		>
			{content}
		</CollaborationSurface>
	) : (
		content
	);
}

function setup(
	options: {
		hideMuted?: boolean;
		sidebarTitle?: string;
		itemId?: string;
		sourceMessageId?: string;
		path?: string;
		state?: CollaborationState;
		navigation?: boolean;
		selectedThreadId?: string;
	} = {},
) {
	const state = options.state ?? createInitialCollaborationState();
	const router = createMemoryRouter(
		[
			{
				path: "*",
				element: (
					<CollaborationSessionProvider initialState={state}>
						<CollaborationSidebarProvider>
							{options.navigation && (
								<CollaborationAccountContext.Provider
									value={{
										isLoggingOut: false,
										error: "",
										isLogoutPending: { current: false },
										logout: async () => undefined,
									}}
								>
									<CollaborationNavigation />
								</CollaborationAccountContext.Provider>
							)}
							<MenuFixture {...options} />
						</CollaborationSidebarProvider>
					</CollaborationSessionProvider>
				),
			},
		],
		{ initialEntries: [options.path ?? "/work"] },
	);
	const user = userEvent.setup();
	render(
		<TooltipProvider>
			<RouterProvider router={router} />
		</TooltipProvider>,
	);
	const open = async () =>
		user.click(
			screen.getByRole("button", { name: /^(Thread|Email) actions for/ }),
		);
	return { user, router, open };
}

function queryMenuAction(options: { name: string | RegExp }) {
	return (
		screen.queryByRole("menuitem", options) ??
		screen.queryByRole("button", options)
	);
}
function getMenuAction(options: { name: string | RegExp }) {
	const action = queryMenuAction(options);
	if (!action) throw new Error(`Missing action: ${options.name}`);
	return action;
}
function getMenuActions() {
	const menu = screen.queryByRole("menu");
	return menu
		? within(menu).getAllByRole("menuitem")
		: within(
				screen.getByRole("dialog", { name: /actions for/ }),
			).getAllByRole("button");
}

function sessionState(): CollaborationState {
	return JSON.parse(
		screen.getByLabelText("Session state").textContent ?? "{}",
	);
}

beforeAll(() => {
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.setPointerCapture = () => undefined;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("thread menus", () => {
	it("offers the room import without promising implicit email actions", async () => {
		const { open } = setup();
		await open();
		for (const name of [
			"New email",
			"Draft reply",
			"Reply",
			"Forward",
			"Delete email",
			"Open workbench",
		])
			expect(queryMenuAction({ name })).toBeNull();
		expect(getMenuAction({ name: "Open in room" })).toBeVisible();
	});
	it.each(["/work", "/brain/threads"])(
		"offers matching right-click and overflow actions on %s",
		async (path) => {
			const { user, router, open } = setup({
				path,
				sidebarTitle: "Brain overview",
			});
			fireEvent.contextMenu(screen.getByRole("article"), {
				clientX: 20,
				clientY: 30,
			});
			const contextActions = getMenuActions().map(
				(item) => item.textContent,
			);
			expect(contextActions).toContain(
				path === "/work" ? "Open in room" : "Open Brain overview",
			);
			for (const removed of [
				"Open in Work",
				"Manage topics…",
				"Summarize",
				"Draft reply",
				"Extract next steps",
			])
				expect(contextActions).not.toContain(removed);
			expect(contextActions).not.toContain("Done");
			expect(router.state.location.pathname).toBe(path);
			await user.keyboard("{Escape}");
			await waitFor(() =>
				expect(
					screen.getByRole("button", {
						name: /^(Thread|Email) actions for/,
					}),
				).toHaveFocus(),
			);
			await open();
			expect(getMenuActions().map((item) => item.textContent)).toEqual(
				contextActions,
			);
			await user.keyboard("{Escape}");
			await waitFor(() =>
				expect(
					screen.getByRole("button", {
						name: /^(Thread|Email) actions for/,
					}),
				).toHaveFocus(),
			);
		},
	);

	it("supports the keyboard context-menu command and Escape focus return", async () => {
		const { user } = setup();
		const link = screen.getByRole("link");
		link.focus();
		await user.keyboard("{Shift>}{F10}{/Shift}");
		expect(getMenuAction({ name: "Copy link" })).toBeVisible();
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(
				screen.getByRole("button", {
					name: /^(Thread|Email) actions for/,
				}),
			).toHaveFocus(),
		);
	});

	it.each(["work", "brain"] as const)(
		"copies deployment-aware %s links and reports clipboard failure",
		async (area) => {
			const { user, open } = setup({ path: `/${area}` });
			const write = vi
				.spyOn(navigator.clipboard, "writeText")
				.mockResolvedValue();
			const success = vi.spyOn(toast, "success").mockReturnValue(1);
			const error = vi.spyOn(toast, "error").mockReturnValue(2);
			await open();
			await user.click(getMenuAction({ name: "Copy link" }));
			expect(write).toHaveBeenCalledWith(
				threadUrl(threadId, window.location.href, area),
			);
			expect(success).toHaveBeenCalledWith("Thread link copied");
			write.mockRejectedValue(new Error("Clipboard denied"));
			await open();
			await user.click(getMenuAction({ name: "Copy link" }));
			expect(error).toHaveBeenCalledWith("Clipboard denied");
			expect(success).toHaveBeenCalledTimes(1);
			expect(
				threadUrl(
					"a/b ?",
					"https://example.test/apps/collaboration/?tenant=one#/brain",
					area,
				),
			).toBe(
				`https://example.test/apps/collaboration/?tenant=one#/${area === "work" ? "thread" : "brain/threads"}/a%2Fb%20%3F`,
			);
		},
	);

	it("ignores a thread and restores a surviving focus target", async () => {
		const { user, open } = setup({ hideMuted: true });
		await open();
		await user.click(getMenuAction({ name: "Ignore thread" }));
		expect(screen.queryByRole("article")).not.toBeInTheDocument();
		expect(
			sessionState().threads.find((thread) => thread.id === threadId)
				?.muted,
		).toBe(true);
		await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
	});

	it("offers Resume for an ignored thread", async () => {
		const state = createInitialCollaborationState();
		const thread = state.threads.find((thread) => thread.id === threadId);
		if (!thread) throw new Error("Missing thread");
		thread.muted = true;
		const { user, open } = setup({ state });
		await open();
		await user.click(getMenuAction({ name: "Resume thread" }));
		expect(
			sessionState().threads.find((thread) => thread.id === threadId)
				?.muted,
		).toBe(false);
	});

	it.each(["/work", `/thread/${threadId}`])(
		"opens the source in a room from %s without legacy route commands",
		async (path) => {
			const { user, router, open } = setup({ path });
			await open();
			await user.click(getMenuAction({ name: "Open in room" }));
			expect(router.state.location.pathname).toBe(`/thread/${threadId}`);
			expect(router.state.location.state).toBeNull();
			expect(router.state.historyAction).toBe("PUSH");
		},
	);

	it("hides Work-only actions on Brain, even for an open thread with a work item", async () => {
		const state = createInitialCollaborationState();
		state.openThreadIds = [threadId];
		const item = state.items.find((item) => item.threadId === threadId);
		if (!item) throw new Error("Missing item");
		const { open } = setup({
			state,
			itemId: item.id,
			path: "/brain/threads",
		});
		await open();
		expect(getMenuActions().map((item) => item.textContent)).toEqual([
			"Open in room",
			"View in Brain",
			"Copy link",
			"Ignore thread",
		]);
	});

	it("opens Brain's current sidebar without changing routes and returns focus", async () => {
		const { user, router, open } = setup({
			path: "/brain/people/person",
			sidebarTitle: "Person context",
		});
		await open();
		await user.click(getMenuAction({ name: "Open Person context" }));
		expect(
			await screen.findByRole("dialog", { name: "Person context" }),
		).toBeVisible();
		expect(router.state.location.pathname).toBe("/brain/people/person");
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(
				screen.getByRole("button", {
					name: /^(Thread|Email) actions for/,
				}),
			).toHaveFocus(),
		);
	});

	it("opens the registered Brain sidebar through its contextual thread menu", async () => {
		const state = createInitialCollaborationState();
		state.openThreadIds = [threadId];
		const { user, router } = setup({
			state,
			path: "/brain/threads",
			sidebarTitle: "Brain overview",
		});
		const trigger = screen.getAllByRole("button", {
			name: /^(Thread|Email) actions for/,
		})[0];
		await user.click(trigger);
		expect(queryMenuAction({ name: "Close room" })).not.toBeInTheDocument();
		await user.click(getMenuAction({ name: "Open Brain overview" }));
		expect(
			await screen.findByRole("dialog", { name: "Brain overview" }),
		).toBeVisible();
		expect(router.state.location.pathname).toBe("/brain/threads");
	});

	it("marks only the selected Work item done and exposes Move back afterward", async () => {
		const state = createInitialCollaborationState();
		const item = state.items.find(
			(item) => item.threadId === threadId && !item.suggested,
		);
		if (!item) throw new Error("Missing item");
		item.status = "open";
		const { user, open } = setup({ state, itemId: item.id });
		const before = sessionState().items.filter(
			(candidate) => candidate.id !== item.id,
		);
		await open();
		await user.click(getMenuAction({ name: "Done" }));
		expect(
			sessionState().items.find((candidate) => candidate.id === item.id)
				?.status,
		).toBe("done");
		expect(
			sessionState().items.filter(
				(candidate) => candidate.id !== item.id,
			),
		).toEqual(before);
		await open();
		await user.click(getMenuAction({ name: "Move back" }));
		expect(
			sessionState().items.find((candidate) => candidate.id === item.id)
				?.status,
		).toBe("open");
	});

	it("navigates to Brain without changing thread data", async () => {
		const { user, open, router } = setup({
			path: `/thread/${threadId}`,
		});
		const before = sessionState().threads;
		await open();
		expect(
			queryMenuAction({ name: "Open in Work" }),
		).not.toBeInTheDocument();
		await user.click(getMenuAction({ name: "View in Brain" }));
		expect(router.state.location.pathname).toBe(
			`/brain/threads/${threadId}`,
		);
		expect(sessionState().threads).toEqual(before);
		await act(() => router.navigate(-1));
	});
});

it("offers the email source in a room and omits thread organization", async () => {
	const state = createInitialCollaborationState();
	const thread = state.threads.find((item) => item.id === threadId);
	if (!thread) throw new Error("Missing thread");
	thread.source = { kind: "outlook", nativeId: "original", folder: "inbox" };
	const { user, open, router } = setup({
		state,
		sourceMessageId: "later-email",
	});
	await open();
	for (const name of [
		"Ignore thread",
		"Open workbench",
		"Reply",
		"Draft reply",
	])
		expect(queryMenuAction({ name })).toBeNull();
	await user.click(getMenuAction({ name: "Open in room" }));
	expect(router.state.location.pathname).toBe(`/thread/${threadId}`);
	expect(router.state.location.state).toBeNull();
});

it("does not open the action popover on hover", async () => {
	const { user } = setup();
	const link = screen.getByRole("link");
	link.focus();
	await user.hover(screen.getByRole("article"));
	await user.hover(
		screen.getByRole("button", { name: /Thread actions for/ }),
	);
	// longer than the delay the removed hover-open used
	await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
	expect(screen.queryByRole("dialog", { name: /Thread actions/ })).toBeNull();
	expect(link).toHaveFocus();
});

it("returns focus to the actions button after selecting an action", async () => {
	const { user, open } = setup();
	await open();
	await screen.findByRole("dialog", { name: /Thread actions for/ });
	await user.click(getMenuAction({ name: "Ignore thread" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: /Thread actions for/ }),
		).toHaveFocus(),
	);
});

it("opens actions through the visible touch button without navigating the row", async () => {
	const { user, router } = setup();
	await user.pointer({
		keys: "[TouchA]",
		target: screen.getByRole("button", { name: /Thread actions for/ }),
	});
	expect(
		screen.getByRole("dialog", { name: /Thread actions for/ }),
	).toBeInTheDocument();
	expect(router.state.location.pathname).toBe("/work");
});
