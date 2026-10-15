import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	createMemoryRouter,
	Navigate,
	Outlet,
	RouterProvider,
} from "react-router";
import { ThemeProvider } from "@semoss/ui/next";
import { CollaborationSettingsLink } from "@/features/collaboration/components/collaboration-settings-link";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { resetMyData } from "@/features/onboarding/onboarding-api";
import { SettingsPage } from "@/pages/settings.page";
import { settingsSections } from "./settings-sections";

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: {} }),
}));
vi.mock("@/features/onboarding/onboarding-api", () => ({
	resetMyData: vi.fn(),
}));

const themeKey = "smss-ui-theme-collaboration";
let systemDark = false;
const mediaListeners = new Set<(event: { matches: boolean }) => void>();

function SettingsTestShell() {
	return (
		<>
			<CollaborationSettingsLink isCollapsed={false} />
			<Outlet />
		</>
	);
}

function renderSettings(path = "/settings", hasProfile = true) {
	const state = createInitialCollaborationState();
	state.liveProfile = hasProfile ? structuredClone(state.profile) : null;
	state.people = state.people
		.slice(0, 1)
		.map((person) => ({ ...person, vip: true, isSample: false }));
	state.rules = [];
	const onChange = vi.fn();
	const router = createMemoryRouter(
		[
			{
				Component: SettingsTestShell,
				children: [
					{ path: "/", element: <p>Home</p> },
					{
						path: "/brain/profile",
						element: <Navigate to="/settings/about-you" replace />,
					},
					{
						path: "/settings",
						Component: SettingsPage,
						children: [
							{
								index: true,
								element: (
									<Navigate
										to="/settings/about-you"
										replace
									/>
								),
							},
							...settingsSections.map(({ id }) => ({
								path: id,
								element: <></>,
							})),
						],
					},
				],
			},
		],
		{ initialEntries: [path] },
	);
	const rendered = render(
		<ThemeProvider defaultTheme="light" storageKey={themeKey}>
			<CollaborationSessionProvider
				initialState={state}
				onChange={onChange}
			>
				<RouterProvider router={router} />
			</CollaborationSessionProvider>
		</ThemeProvider>,
	);
	return { ...rendered, router, onChange, state };
}

beforeEach(() => {
	systemDark = false;
	vi.stubGlobal("matchMedia", () => ({
		get matches() {
			return systemDark;
		},
		addEventListener: (
			_: string,
			listener: (event: { matches: boolean }) => void,
		) => mediaListeners.add(listener),
		removeEventListener: (
			_: string,
			listener: (event: { matches: boolean }) => void,
		) => mediaListeners.delete(listener),
	}));
});

afterEach(() => {
	cleanup();
	localStorage.clear();
	document.documentElement.classList.remove("dark", "light");
	mediaListeners.clear();
	vi.restoreAllMocks();
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

it("opens Settings directly, retains profile drafts across categories and history, and discards them on exit", async () => {
	const user = userEvent.setup();
	const { router, onChange, state } = renderSettings("/");
	await user.click(screen.getByRole("link", { name: "Settings" }));
	expect(router.state.location.pathname).toBe("/settings/about-you");
	expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	const role = screen.getByRole("textbox", { name: "Role" });
	await user.clear(role);
	await user.type(role, "My unsaved role");
	expect(onChange).not.toHaveBeenCalled();
	await user.click(screen.getByRole("link", { name: "Appearance" }));
	expect(role).not.toBeVisible();
	expect(
		screen.queryByRole("textbox", { name: "Role" }),
	).not.toBeInTheDocument();
	await act(() => router.navigate(-1));
	expect(role).toBeVisible();
	expect(role).toHaveValue("My unsaved role");
	await act(() => router.navigate(1));
	expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeVisible();
	await act(() => router.navigate("/"));
	await user.click(screen.getByRole("link", { name: "Settings" }));
	expect(screen.getByRole("textbox", { name: "Role" })).toHaveValue(
		state.profile.role.value,
	);
});

it("redirects the old profile link, validates profile fields, and saves only confirmed profile edits", async () => {
	const user = userEvent.setup();
	const { router, onChange } = renderSettings("/brain/profile");
	expect(router.state.location.pathname).toBe("/settings/about-you");
	const timezone = screen.getByRole("textbox", { name: "Time zone" });
	await user.clear(timezone);
	await user.type(timezone, "Invalid/Zone");
	await user.click(
		screen.getByRole("button", { name: "Save profile for this session" }),
	);
	expect(timezone).toHaveAccessibleDescription(
		"Enter a valid time zone, such as America/New_York.",
	);
	expect(onChange).not.toHaveBeenCalled();
	await user.clear(timezone);
	await user.type(timezone, "Europe/London");
	await user.click(
		screen.getByRole("button", { name: "Save profile for this session" }),
	);
	await waitFor(() => expect(onChange).toHaveBeenCalled());
	expect(onChange.mock.lastCall?.[0].next.liveProfile.timezone).toBe(
		"Europe/London",
	);
	expect(screen.queryByText("Unsaved profile edits")).not.toBeInTheDocument();
});

it("keeps VIP controls and the missing-profile state usable inside Settings", async () => {
	const user = userEvent.setup();
	const { state, onChange, unmount } = renderSettings();
	await user.click(
		screen.getByRole("button", {
			name: `Remove VIP ${state.people[0].name}`,
		}),
	);
	expect(onChange.mock.lastCall?.[0].next.people[0].vip).toBe(false);
	expect(
		screen.getByRole("link", { name: "Choose VIPs from People" }),
	).toHaveAttribute("href", "/brain/people");
	unmount();
	renderSettings("/settings/about-you", false);
	expect(
		screen.getByText(/Your account profile is unavailable/),
	).toBeVisible();
	await user.click(screen.getByRole("link", { name: "Appearance" }));
	expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeVisible();
});

it("keeps rule and filing drafts across categories, validates thresholds, and saves/adds/removes through the existing session", async () => {
	const user = userEvent.setup();
	const { onChange } = renderSettings("/settings/rules");
	const value = screen.getByRole("textbox", { name: "Value (required)" });
	const ask = screen.getByRole("spinbutton", { name: "Ask from (%)" });
	await user.type(value, "private@example.invalid");
	await user.clear(ask);
	await user.type(ask, "84");
	await user.click(screen.getByRole("link", { name: "About you" }));
	await user.click(screen.getByRole("link", { name: "Rules" }));
	expect(value).toHaveValue("private@example.invalid");
	expect(ask).toHaveValue(84);
	await user.click(screen.getByRole("button", { name: "Save preferences" }));
	expect(ask).toHaveAccessibleDescription(
		"Ask threshold must be at least five points below filing threshold.",
	);
	expect(onChange).not.toHaveBeenCalled();
	await user.clear(ask);
	await user.type(ask, "45");
	await user.click(screen.getByRole("button", { name: "Save preferences" }));
	expect(onChange.mock.lastCall?.[0].next.settings.askAt).toBe(45);
	await user.click(screen.getByRole("button", { name: "Add rule" }));
	expect(onChange.mock.lastCall?.[0].next.rules).toEqual([
		expect.objectContaining({
			value: "private@example.invalid",
			kind: "never_sender",
		}),
	]);
	await user.click(
		screen.getByRole("button", {
			name: "Remove sender rule private@example.invalid",
		}),
	);
	expect(
		screen.queryByRole("button", {
			name: "Remove sender rule private@example.invalid",
		}),
	).not.toBeInTheDocument();
});

it("applies and persists Light, Dark, and System and responds to device appearance changes", async () => {
	const user = userEvent.setup();
	const { unmount } = renderSettings("/settings/appearance");
	expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
	await user.click(screen.getByRole("radio", { name: "Dark" }));
	expect(document.documentElement).toHaveClass("dark");
	expect(localStorage.getItem(themeKey)).toBe("dark");
	unmount();
	renderSettings("/settings/appearance");
	expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
	await user.click(screen.getByRole("radio", { name: "System" }));
	expect(localStorage.getItem(themeKey)).toBe("system");
	act(() => {
		systemDark = true;
		for (const listener of mediaListeners) listener({ matches: true });
	});
	expect(document.documentElement).toHaveClass("dark");
	act(() => {
		systemDark = false;
		for (const listener of mediaListeners) listener({ matches: false });
	});
	expect(document.documentElement).toHaveClass("light");
	await user.click(screen.getByRole("radio", { name: "Light" }));
	expect(localStorage.getItem(themeKey)).toBe("light");
});

it("reports failed theme storage without changing the selected theme", async () => {
	const user = userEvent.setup();
	renderSettings("/settings/appearance");
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("Storage blocked");
	});
	await user.click(screen.getByRole("radio", { name: "Dark" }));
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Your theme could not be saved",
	);
	expect(screen.getByRole("radio", { name: "Light" })).toBeChecked();
});

it("requires reset confirmation, prevents duplicate writes, and allows cancellation before submitting", async () => {
	const user = userEvent.setup();
	renderSettings("/settings/data");
	await user.click(screen.getByRole("button", { name: "Reset my data" }));
	expect(resetMyData).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Reset my data" })).toHaveFocus();
	await user.click(screen.getByRole("button", { name: "Reset my data" }));
	let rejectReset: (reason: Error) => void = () => {};
	vi.mocked(resetMyData).mockImplementation(
		() =>
			new Promise((_, reject) => {
				rejectReset = reject;
			}),
	);
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Reset my data",
		}),
	);
	expect(resetMyData).toHaveBeenCalledTimes(1);
	expect(screen.getByRole("button", { name: "Resetting..." })).toBeDisabled();
	await user.keyboard("{Escape}");
	expect(screen.getByRole("dialog")).toBeVisible();
	await act(async () => {
		rejectReset(new Error("Reset unavailable"));
	});
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Could not reset: Reset unavailable",
	);
	expect(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Reset my data",
		}),
	).toBeEnabled();
});
