import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { CollaborationProfileMenu } from "./collaboration-profile-menu";

const logout = vi.hoisted(() => vi.fn<() => Promise<boolean>>());
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: { logout } }),
}));

/** Render account actions with real menu and routing behavior. */
function renderMenu() {
	const state = createInitialCollaborationState();
	state.profile.name = "Stored name";
	state.liveProfile = {
		...state.profile,
		name: "Taylor Morgan",
		email: "taylor@example.invalid",
	};
	const router = createMemoryRouter([
		{ path: "*", element: <CollaborationProfileMenu /> },
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
});
afterEach(cleanup);

it("shows the current account and supports keyboard dismissal and Settings navigation", async () => {
	const { router, user } = renderMenu();
	const trigger = screen.getByRole("button", {
		name: "Account menu for Taylor Morgan",
	});
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	expect(screen.getByText("taylor@example.invalid")).toBeVisible();
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
	expect(router.state.location.pathname).toBe("/");
	await act(async () => finishLogout(true));
	await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
	expect(router.state.historyAction).toBe("REPLACE");
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
