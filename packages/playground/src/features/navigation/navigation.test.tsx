import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Sidebar, SidebarHeader, SidebarProvider } from "@semoss/ui/next";
import { MobileNavigationClose } from "./mobile-navigation-close";
import { NavigationButton } from "./navigation-button";
import { NavigationToggle } from "./navigation-toggle";

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
				<Sidebar collapsible="offcanvas" variant="inset">
					<SidebarHeader>
						<NavigationToggle />
						<MobileNavigationClose />
						<Link to="/agent">Agents</Link>
					</SidebarHeader>
				</Sidebar>
				<NavigationButton />
			</SidebarProvider>
		</MemoryRouter>
	);
}

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

test("on desktop the page offers to open the navigation only while it is hidden", async () => {
	const user = userEvent.setup();
	render(<NavigationTest />);
	const toggle = screen.getByRole("button", { name: "actions.closeSidebar" });
	expect(
		screen.queryAllByRole("button", { name: "actions.openNavigation" }),
	).toHaveLength(0);
	await user.click(toggle);
	// the sidebar's toggle and the page's button both open it now
	const [, openButton] = screen.getAllByRole("button", {
		name: "actions.openNavigation",
	});
	expect(openButton).not.toBe(toggle);
	expect(openButton).toHaveAttribute("aria-expanded", "false");
	await user.click(openButton);
	expect(toggle).toHaveAttribute("aria-expanded", "true");
	expect(
		screen.queryAllByRole("button", { name: "actions.openNavigation" }),
	).toHaveLength(0);
});

test("inline in a page's header on desktop, the button opens the navigation only while it is hidden", async () => {
	const user = userEvent.setup();
	render(
		<MemoryRouter>
			<SidebarProvider defaultOpen>
				<Sidebar collapsible="offcanvas" variant="inset">
					<SidebarHeader>
						<NavigationToggle />
						<Link to="/agent">Agents</Link>
					</SidebarHeader>
				</Sidebar>
				<header>
					<NavigationButton placement="inline" />
				</header>
			</SidebarProvider>
		</MemoryRouter>,
	);
	const toggle = screen.getByRole("button", { name: "actions.closeSidebar" });
	// the open navigation holds the toggle, not the header
	expect(
		screen.queryAllByRole("button", { name: "actions.openNavigation" }),
	).toHaveLength(0);
	await user.click(toggle);
	const openButton = within(screen.getByRole("banner")).getByRole("button", {
		name: "actions.openNavigation",
	});
	expect(openButton).toHaveAttribute("aria-expanded", "false");
	await user.click(openButton);
	expect(toggle).toHaveAttribute("aria-expanded", "true");
	expect(openButton).not.toBeInTheDocument();
});
