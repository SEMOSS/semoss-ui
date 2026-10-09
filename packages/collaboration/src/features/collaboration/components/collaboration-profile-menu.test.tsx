import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { CollaborationAccountContext } from "./collaboration-account.context";
import { CollaborationProfileMenu } from "./collaboration-profile-menu";
import { useCollaborationAccount } from "./use-collaboration-account";

const logout = vi.hoisted(() => vi.fn<() => Promise<boolean>>());
const mediaListeners = new Set<() => void>();
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: { logout } }),
}));

/** Keep request state mounted while navigation itself can be closed and reopened. */
function AccountFixture({ onNavigate }: { onNavigate?: () => void }) {
	const account = useCollaborationAccount();
	const [isNavigationMounted, setIsNavigationMounted] = useState(true);
	const [isCollapsed, setIsCollapsed] = useState(false);
	return (
		<CollaborationAccountContext.Provider value={account}>
			<button
				type="button"
				onClick={() => setIsNavigationMounted((current) => !current)}
			>
				{isNavigationMounted ? "Hide navigation" : "Show navigation"}
			</button>
			<button
				type="button"
				onClick={() => setIsCollapsed((current) => !current)}
			>
				{isCollapsed ? "Expand navigation" : "Collapse navigation"}
			</button>
			{isNavigationMounted && (
				<CollaborationProfileMenu
					isCollapsed={isCollapsed}
					onNavigate={onNavigate}
				/>
			)}
		</CollaborationAccountContext.Provider>
	);
}

/** Render account actions with real menu and routing behavior. */
function renderMenu(
	onNavigate?: () => void,
	profile: { storedName?: string; liveName?: string } = {},
) {
	const state = createInitialCollaborationState();
	state.profile.name = profile.storedName ?? "Stored name";
	state.liveProfile = {
		...state.profile,
		name: profile.liveName ?? "Taylor Morgan",
		email: "taylor@example.invalid",
	};
	const router = createMemoryRouter([
		{ path: "*", element: <AccountFixture onNavigate={onNavigate} /> },
		{ path: "/login", element: <p>Signed out</p> },
	]);
	render(
		<CollaborationSessionProvider initialState={state}>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return { router, user: userEvent.setup() };
}

beforeEach(() => {
	logout.mockReset();
	logout.mockResolvedValue(true);
	mediaListeners.clear();
	vi.stubGlobal("matchMedia", () => ({
		matches: true,
		addEventListener: (_event: string, listener: () => void) =>
			mediaListeners.add(listener),
		removeEventListener: (_event: string, listener: () => void) =>
			mediaListeners.delete(listener),
	}));
	vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
		function (this: HTMLElement) {
			const rectangles =
				this.isConnected && !this.closest("[hidden]")
					? [new DOMRect(0, 0, 44, 44)]
					: [];
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
});

it("shows the current account and supports keyboard dismissal and Settings navigation", async () => {
	const { router, user } = renderMenu();
	const trigger = screen.getByRole("button", {
		name: "Account menu for Taylor Morgan",
	});
	expect(within(trigger).getByText("Taylor Morgan")).toBeVisible();
	expect(screen.queryByText("Stored name")).not.toBeInTheDocument();
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	const menu = screen.getByRole("menu");
	expect(within(menu).getByText("Taylor Morgan")).toBeVisible();
	expect(within(menu).getByText("taylor@example.invalid")).toBeVisible();
	const settings = screen.getByRole("menuitem", { name: "Settings" });
	await waitFor(() => expect(settings).toHaveFocus());
	await user.keyboard("{ArrowDown}");
	expect(screen.getByRole("menuitem", { name: "Log out" })).toHaveFocus();
	await user.keyboard("{Escape}");
	await waitFor(() => expect(trigger).toHaveFocus());
	await user.click(trigger);
	await user.click(screen.getByRole("menuitem", { name: "Settings" }));
	expect(router.state.location.pathname).toBe("/settings");
	expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	expect(logout).not.toHaveBeenCalled();
});

it("keeps the account trigger and menu access stable when navigation collapses", async () => {
	const { user } = renderMenu();
	const trigger = screen.getByRole("button", {
		name: "Account menu for Taylor Morgan",
	});
	await user.click(
		screen.getByRole("button", { name: "Collapse navigation" }),
	);
	expect(
		screen.getByRole("button", {
			name: "Account menu for Taylor Morgan",
		}),
	).toBe(trigger);
	expect(trigger).not.toHaveTextContent("Taylor Morgan");
	await user.hover(trigger);
	expect(await screen.findByRole("tooltip")).toHaveTextContent(
		/^Account menu for Taylor Morgan$/,
	);
	await user.keyboard("{Escape}");
	await user.unhover(trigger);
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	const menu = screen.getByRole("menu");
	expect(within(menu).getByText("Taylor Morgan")).toBeVisible();
	expect(within(menu).getByText("taylor@example.invalid")).toBeVisible();
	expect(
		within(menu).getByRole("menuitem", { name: "Settings" }),
	).toBeVisible();
	expect(
		within(menu).getByRole("menuitem", { name: "Log out" }),
	).toBeVisible();
	await user.keyboard("{Escape}");
	await waitFor(() => expect(trigger).toHaveFocus());
	await user.click(screen.getByRole("button", { name: "Expand navigation" }));
	expect(
		screen.getByRole("button", {
			name: "Account menu for Taylor Morgan",
		}),
	).toBe(trigger);
	expect(within(trigger).getByText("Taylor Morgan")).toBeVisible();
});

it.each([
	{
		liveName:
			"Alexandra Catherine Montgomery-Wellington, Research and Operations",
		storedName: "Stored name",
		expected:
			"Alexandra Catherine Montgomery-Wellington, Research and Operations",
	},
	{ liveName: " ", storedName: "Stored name", expected: "Stored name" },
	{ liveName: " ", storedName: " ", expected: "You" },
])(
	"keeps the full account identity available for $expected",
	async (profile) => {
		const { user } = renderMenu(undefined, profile);
		const trigger = screen.getByRole("button", {
			name: `Account menu for ${profile.expected}`,
		});
		expect(within(trigger).getByText(profile.expected)).toBeVisible();
		await user.click(trigger);
		const menu = screen.getByRole("menu");
		expect(within(menu).getByText(profile.expected)).toBeVisible();
		expect(within(menu).getByText("taylor@example.invalid")).toBeVisible();
	},
);

it("closes mobile navigation when Settings is selected", async () => {
	const onNavigate = vi.fn();
	const { user, router } = renderMenu(onNavigate);
	await user.click(screen.getByRole("button", { name: /Account menu/ }));
	await user.click(screen.getByRole("menuitem", { name: "Settings" }));
	expect(onNavigate).toHaveBeenCalledOnce();
	expect(router.state.location.pathname).toBe("/settings");
});

it("closes on a navigation breakpoint without restoring focus to a hidden avatar", async () => {
	const { user } = renderMenu();
	const trigger = screen.getByRole("button", { name: /Account menu/ });
	await user.click(trigger);
	const focusTrigger = vi.spyOn(trigger, "focus");
	act(() => {
		trigger.hidden = true;
		for (const listener of mediaListeners) listener();
	});
	await waitFor(() =>
		expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
	);
	await user.tab();
	expect(focusTrigger).not.toHaveBeenCalled();
	expect(trigger).not.toHaveFocus();
	await user.click(screen.getByRole("button", { name: "Hide navigation" }));
	expect(mediaListeners.size).toBe(0);
});

it("waits for logout success and prevents repeated submissions", async () => {
	let finishLogout: (value: boolean) => void = () => {
		throw new Error("Logout promise not initialized");
	};
	const pending = new Promise<boolean>((resolve) => {
		finishLogout = resolve;
	});
	logout.mockReturnValue(pending);
	const { router, user } = renderMenu();
	await user.click(screen.getByRole("button", { name: /Account menu/ }));
	await user.click(screen.getByRole("menuitem", { name: "Log out" }));
	const item = screen.getByRole("menuitem", { name: "Logging out…" });
	expect(item).toHaveAttribute("aria-disabled", "true");
	await user.keyboard("{Enter}{Enter}");
	expect(logout).toHaveBeenCalledOnce();
	await user.click(screen.getByRole("menuitem", { name: "Settings" }));
	expect(router.state.location.pathname).toBe("/");
	await act(async () => finishLogout(true));
	await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
	expect(router.state.historyAction).toBe("REPLACE");
});

it("preserves pending logout and retryable errors when mobile navigation remounts", async () => {
	let finishLogout: (value: boolean) => void = () => {
		throw new Error("Logout promise not initialized");
	};
	logout.mockReturnValueOnce(
		new Promise<boolean>((resolve) => {
			finishLogout = resolve;
		}),
	);
	const { router, user } = renderMenu();
	await user.click(screen.getByRole("button", { name: /Account menu/ }));
	await user.click(screen.getByRole("menuitem", { name: "Log out" }));
	await user.keyboard("{Escape}");
	await user.click(screen.getByRole("button", { name: "Hide navigation" }));
	await user.click(screen.getByRole("button", { name: "Show navigation" }));
	await user.click(screen.getByRole("button", { name: /Account menu/ }));
	const pending = screen.getByRole("menuitem", { name: "Logging out…" });
	expect(pending).toHaveAttribute("aria-disabled", "true");
	await user.click(pending);
	expect(logout).toHaveBeenCalledOnce();
	await act(async () => finishLogout(false));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Could not log out. Please try again.",
	);
	await user.keyboard("{Escape}");
	await user.click(screen.getByRole("button", { name: "Hide navigation" }));
	await user.click(screen.getByRole("button", { name: "Show navigation" }));
	await user.click(screen.getByRole("button", { name: /Account menu/ }));
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Could not log out. Please try again.",
	);
	await user.click(screen.getByRole("menuitem", { name: "Log out" }));
	await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
	expect(logout).toHaveBeenCalledTimes(2);
});

it.each(["false", "rejection"])(
	"retains the session and allows retry after a %s result",
	async (failure) => {
		if (failure === "false") logout.mockResolvedValueOnce(false);
		else logout.mockRejectedValueOnce(new Error("Offline"));
		const { router, user } = renderMenu();
		await user.click(screen.getByRole("button", { name: /Account menu/ }));
		await user.click(screen.getByRole("menuitem", { name: "Log out" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Could not log out. Please try again.",
		);
		expect(router.state.location.pathname).toBe("/");
		await user.click(screen.getByRole("menuitem", { name: "Log out" }));
		await waitFor(() =>
			expect(router.state.location.pathname).toBe("/login"),
		);
		expect(logout).toHaveBeenCalledTimes(2);
	},
);
