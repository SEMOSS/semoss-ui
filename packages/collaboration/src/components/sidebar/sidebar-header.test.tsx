import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Sidebar, SidebarProvider, useSidebar } from "@semoss/ui/next";
import { SidebarHeader } from "./sidebar-header";

function SidebarState() {
	const { isMobile, openMobile, setOpenMobile } = useSidebar();
	return (
		<>
			<output aria-label="Mobile sidebar state">
				{isMobile ? "mobile" : "desktop"}:
				{openMobile ? "open" : "closed"}
			</output>
			<button type="button" onClick={() => setOpenMobile(true)}>
				Open mobile drawer
			</button>
		</>
	);
}

function renderHeader({
	condensed = false,
	path = "/room",
}: {
	condensed?: boolean;
	path?: string;
} = {}) {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<SidebarProvider defaultOpen={!condensed}>
				<SidebarState />
				<Sidebar collapsible="icon">
					<SidebarHeader condensed={condensed} />
				</Sidebar>
			</SidebarProvider>
		</MemoryRouter>,
	);
}

describe("SidebarHeader", () => {
	beforeAll(() => {
		vi.stubGlobal("matchMedia", (media: string) => ({
			media,
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));
	});

	afterAll(() => vi.unstubAllGlobals());
	afterEach(() => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1024,
		});
	});

	it("places New Chat before Overview and marks Sessions current", () => {
		renderHeader();
		const navigation = screen.getByRole("navigation", {
			name: "Main navigation",
		});
		const links = within(navigation).getAllByRole("link");

		expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
			"New Chat",
			"Overview",
			"Sessions",
			"Agents",
		]);
		const sessionsLink = within(navigation).getByRole("link", {
			name: "Sessions",
		});
		expect(sessionsLink).toHaveAttribute("href", "/room");
		expect(sessionsLink).toHaveAttribute("aria-current", "page");
	});

	it("marks New Chat current on the new-chat route", () => {
		renderHeader({ path: "/new" });

		const newChatLink = screen.getByRole("link", { name: "New Chat" });
		expect(newChatLink).toHaveAttribute("href", "/new");
		expect(newChatLink).toHaveAttribute("aria-current", "page");
		expect(newChatLink).toHaveClass(
			"mx-auto",
			"w-full",
			"justify-center",
			"bg-primary",
		);
	});

	it("centers the New Chat icon and exposes its collapsed tooltip", async () => {
		const user = userEvent.setup();
		renderHeader({ condensed: true });
		const newChatLink = screen.getByRole("link", { name: "New Chat" });

		expect(newChatLink).toHaveClass("mx-auto", "min-h-11", "min-w-11");
		await user.hover(newChatLink);
		expect(await screen.findByRole("tooltip")).toHaveTextContent(
			"New Chat",
		);
	});

	it("keeps Sessions named and exposes its tooltip in the collapsed rail", async () => {
		const user = userEvent.setup();
		renderHeader({ condensed: true });
		const sessionsLink = screen.getByRole("link", { name: "Sessions" });

		await user.hover(sessionsLink);

		expect(await screen.findByRole("tooltip")).toHaveTextContent(
			"Sessions",
		);
	});

	it("keeps Sessions current while a room is open", () => {
		renderHeader({ path: "/room/room-one" });

		expect(screen.getByRole("link", { name: "Sessions" })).toHaveAttribute(
			"aria-current",
			"page",
		);
	});

	it("closes the mobile drawer when New Chat is selected", async () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 360,
		});
		const user = userEvent.setup();
		renderHeader({ path: "/" });
		const state = screen.getByRole("status", {
			name: "Mobile sidebar state",
		});
		await waitFor(() => expect(state).toHaveTextContent("mobile:closed"));

		await user.click(
			screen.getByRole("button", { name: "Open mobile drawer" }),
		);
		await user.click(screen.getByRole("link", { name: "New Chat" }));

		expect(state).toHaveTextContent("mobile:closed");
	});
});
