import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test, vi } from "vitest";
import { AdminThemePage } from "./admin-theme-page";

const themes = vi.hoisted(() => ({
	status: "SUCCESS",
	data: [
		{
			ID: "theme-1",
			THEME_NAME: "Theme",
			IS_ACTIVE: true,
			THEME_MAP: {
				playground: {
					featureFlags: {
						enableAgentHarness: false,
						modeFollowsAgent: false,
					},
				},
			},
		},
	],
	refresh: vi.fn(),
}));

vi.mock("@/hooks", () => ({
	useAPI: () => themes,
	useSettings: () => ({ adminMode: true }),
}));
vi.mock("@/api/theme", () => ({
	createAdminTheme: vi.fn(),
	deleteAdminTheme: vi.fn(),
	editAdminTheme: vi.fn(),
	getAdminThemes: vi.fn(),
	setActiveAdminTheme: vi.fn(),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	MonacoEditor: () => null,
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	useTheme: () => ({ resolvedTheme: "light" }),
}));

const harnessSwitch = () =>
	screen.getByRole("switch", { name: "Enable Agent Harness" });

test("Mode Follows Agent shows Enable Agent Harness as included without saving it", async () => {
	render(
		<MemoryRouter>
			<AdminThemePage />
		</MemoryRouter>,
	);
	fireEvent.mouseDown(await screen.findByRole("tab", { name: "Playground" }));
	expect(harnessSwitch()).not.toBeChecked();
	expect(harnessSwitch()).toBeEnabled();

	fireEvent.click(screen.getByRole("switch", { name: "Mode Follows Agent" }));
	expect(harnessSwitch()).toBeChecked();
	expect(harnessSwitch()).toBeDisabled();
	expect(
		screen.getByText(/Included in Mode Follows Agent\./),
	).toBeInTheDocument();

	// turning it off shows the harness flag's own saved value again
	fireEvent.click(screen.getByRole("switch", { name: "Mode Follows Agent" }));
	expect(harnessSwitch()).not.toBeChecked();
	expect(harnessSwitch()).toBeEnabled();
});

test("Agent Mode Only turns on and off, and shows Mode Follows Agent and Enable Agent Harness as included while on", async () => {
	render(
		<MemoryRouter>
			<AdminThemePage />
		</MemoryRouter>,
	);
	fireEvent.mouseDown(await screen.findByRole("tab", { name: "Playground" }));
	const agentModeOnly = () =>
		screen.getByRole("switch", { name: "Agent Mode Only" });
	expect(agentModeOnly()).not.toBeChecked();

	fireEvent.click(agentModeOnly());
	expect(agentModeOnly()).toBeChecked();
	expect(harnessSwitch()).toBeChecked();
	expect(harnessSwitch()).toBeDisabled();
	const followsAgent = () =>
		screen.getByRole("switch", { name: "Mode Follows Agent" });
	expect(followsAgent()).toBeChecked();
	expect(followsAgent()).toBeDisabled();
	expect(screen.getAllByText(/Included in Agent Mode Only\./)).toHaveLength(
		2,
	);

	fireEvent.click(agentModeOnly());
	expect(agentModeOnly()).not.toBeChecked();
	expect(followsAgent()).not.toBeChecked();
	expect(followsAgent()).toBeEnabled();
	expect(harnessSwitch()).not.toBeChecked();
	expect(harnessSwitch()).toBeEnabled();
});
