import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Sidebar, SidebarHeader, SidebarProvider } from "@semoss/ui/next";
import { MobileNavigationButton } from "./mobile-navigation-button";
import { MobileNavigationClose } from "./mobile-navigation-close";
import { NavigationRail } from "./navigation-rail";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
	vi.stubGlobal("innerWidth", 1440);
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
});
afterEach(() => vi.unstubAllGlobals());

/** Exercises the same shared sidebar primitives used by the app shell. */
function NavigationTest() {
	return (
		<MemoryRouter>
			<SidebarProvider defaultOpen>
				<Sidebar collapsible="icon" variant="inset">
					<SidebarHeader>
						<MobileNavigationClose />
						<Link to="/agent">Agents</Link>
					</SidebarHeader>
					<NavigationRail />
				</Sidebar>
				<MobileNavigationButton />
			</SidebarProvider>
		</MemoryRouter>
	);
}

test("divider toggles by keyboard and pointer with state-specific tooltips", async () => {
	const user = userEvent.setup();
	render(<NavigationTest />);
	const rail = screen.getByRole("button", { name: "actions.closeSidebar" });
	expect(rail).toHaveAttribute("tabindex", "0");
	expect(rail).toHaveAttribute("aria-expanded", "true");
	await user.tab();
	await user.tab();
	expect(rail).toHaveFocus();
	expect(await screen.findByRole("tooltip")).toHaveTextContent(
		"actions.closeSidebar",
	);
	await user.keyboard("{Escape}");
	await waitFor(() =>
		expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
	);
	await user.keyboard("{Enter}");
	expect(rail).toHaveAccessibleName("actions.openNavigation");
	expect(rail).toHaveAttribute("aria-expanded", "false");
	expect(rail.querySelector("svg")).not.toBeInTheDocument();
	await user.keyboard(" ");
	expect(rail).toHaveAttribute("aria-expanded", "true");
	expect(rail.querySelector("svg")).not.toBeInTheDocument();
	await user.click(rail);
	expect(rail).toHaveAttribute("aria-expanded", "false");
});

test("mobile navigation opens, dismisses, and returns focus after Close, Escape, and route selection", async () => {
	vi.stubGlobal("innerWidth", 360);
	const user = userEvent.setup();
	render(<NavigationTest />);
	const trigger = screen.getByRole("button", {
		name: "actions.openNavigation",
	});
	expect(trigger).toHaveAttribute("aria-expanded", "false");
	await user.click(trigger);
	expect(await screen.findByRole("dialog")).toBeInTheDocument();
	await user.click(
		screen.getByRole("button", { name: "actions.closeSidebar" }),
	);
	await waitFor(() =>
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
	);
	await waitFor(() => expect(trigger).toHaveFocus());
	await user.click(trigger);
	await user.keyboard("{Escape}");
	await waitFor(() => expect(trigger).toHaveFocus());
	await user.click(trigger);
	await user.click(screen.getByRole("link", { name: "Agents" }));
	await waitFor(() =>
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
	);
	await waitFor(() => expect(trigger).toHaveFocus());
});
