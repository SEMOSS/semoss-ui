import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Sidebar, SidebarProvider } from "@semoss/ui/next";
import { SidebarHeader } from "./sidebar-header";

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

	it("places Sessions between Overview and Agents and marks it current", () => {
		renderHeader();
		const navigation = screen.getByRole("navigation", {
			name: "Main navigation",
		});
		const links = within(navigation).getAllByRole("link");

		expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
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
});
