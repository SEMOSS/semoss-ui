import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SidebarProvider, useSidebar } from "@semoss/ui/next";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import { SidebarAgentsList } from "./sidebar-agents-list";

const researchAgent: Agent = {
	id: "research-agent",
	name: "Research agent",
	role: "Analyst",
	type: "Individual",
	icon: "compass",
	tone: "blue",
	workspace: "Conversation",
	instructions: "Research the requested topic.",
	skills: [],
	databases: [],
	dataProducts: [],
	members: [],
	depth: 0,
	concurrency: 1,
	spawn: false,
	triggers: [],
};

const writingAgent: Agent = {
	...researchAgent,
	id: "writing-agent",
	name: "Writing agent",
	role: "Editor",
	icon: "pen",
	tone: "amber",
};

function room(index: number, agentId = researchAgent.id): Session {
	return {
		id: `room-${index}`,
		agentId,
		modelId: index === 1 ? "model-2" : undefined,
		title: `Room ${index}`,
		origin: "You",
		status: index === 2 ? "In progress" : "Ready",
		updatedAt: new Date(Date.UTC(2026, 8, 22, 20 - index)).toISOString(),
		unread: index === 3,
		pinned: false,
		preview: index === 1 ? "Latest room preview" : "",
		thread: [],
	};
}

function SidebarState() {
	const { isMobile, openMobile, setOpenMobile, state } = useSidebar();
	return (
		<>
			<output aria-label="Workspace sidebar state">{state}</output>
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

function LocationState() {
	const location = useLocation();
	return (
		<output aria-label="Current location">
			{location.pathname + location.search}
		</output>
	);
}

function renderSidebar({
	sessions,
	agents = [researchAgent, writingAgent],
	activeAgentId,
	activeRoomId,
	isLoading,
	onRoomVisited = vi.fn(),
}: {
	sessions: Session[];
	agents?: Agent[];
	activeAgentId?: string;
	activeRoomId?: string;
	isLoading?: boolean;
	onRoomVisited?: (roomId: string) => void;
}) {
	return render(
		<MemoryRouter
			initialEntries={[
				activeRoomId
					? `/agents/research-agent/${activeRoomId}`
					: "/agents",
			]}
		>
			<SidebarProvider defaultOpen>
				<SidebarState />
				<LocationState />
				<SidebarAgentsList
					agents={agents}
					sessions={sessions}
					activeAgentId={activeAgentId}
					activeRoomId={activeRoomId}
					isLoading={isLoading}
					onRoomVisited={onRoomVisited}
				/>
			</SidebarProvider>
		</MemoryRouter>,
	);
}

describe("SidebarAgentsList", () => {
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

	it("shows useful loading and empty states", () => {
		const { unmount } = renderSidebar({
			agents: [],
			sessions: [],
			isLoading: true,
		});
		expect(screen.getByText("Loading agents")).toBeVisible();
		expect(screen.getByText("Loading rooms")).toBeVisible();

		unmount();
		renderSidebar({ agents: [], sessions: [] });
		expect(screen.getByText("No agents yet")).toBeVisible();
		expect(screen.getByText("No recent rooms")).toBeVisible();
	});

	it("keeps agents open by default and reveals rooms in five-room increments", async () => {
		const user = userEvent.setup();
		renderSidebar({
			sessions: Array.from({ length: 7 }, (_, index) => room(index + 1)),
		});

		expect(
			screen.getByRole("button", {
				name: "Collapse rooms for Research agent",
			}),
		).toHaveAttribute("aria-expanded", "true");
		expect(
			screen.getByRole("button", {
				name: "Collapse rooms for Writing agent",
			}),
		).toHaveAttribute("aria-expanded", "true");
		const rooms = screen.getByRole("list", {
			name: "Rooms for Research agent",
		});
		expect(within(rooms).getAllByRole("link")).toHaveLength(5);

		await user.click(
			within(rooms).getByRole("button", { name: "Show 5 more" }),
		);
		expect(within(rooms).getAllByRole("link")).toHaveLength(7);

		await user.click(
			within(rooms).getByRole("button", { name: "Show less" }),
		);
		expect(within(rooms).getAllByRole("link")).toHaveLength(5);
	});

	it("expands the active agent and keeps a deep active room visible", () => {
		renderSidebar({
			sessions: Array.from({ length: 7 }, (_, index) => room(index + 1)),
			activeAgentId: researchAgent.id,
			activeRoomId: "room-7",
		});

		const rooms = screen.getByRole("list", {
			name: "Rooms for Research agent",
		});
		expect(within(rooms).getAllByRole("link")).toHaveLength(7);
		expect(
			within(rooms).getByRole("link", { name: /Room 7/ }),
		).toHaveAttribute("aria-current", "page");
	});

	it("shows the ten newest rooms across agents in Recent", () => {
		const sessions = Array.from({ length: 12 }, (_, index) =>
			room(index + 1, index % 2 ? writingAgent.id : researchAgent.id),
		);
		renderSidebar({ sessions });

		const recent = screen.getByRole("list", { name: "Recent rooms" });
		const recentLinks = within(recent).getAllByRole("link");
		expect(recentLinks).toHaveLength(10);
		expect(recentLinks[0]).toHaveTextContent("Room 1");
		expect(recent).not.toHaveTextContent("Research agent");
		expect(recent).not.toHaveTextContent("Writing agent");
		expect(recent).not.toHaveTextContent("Latest room preview");
		expect(recent).not.toHaveTextContent("Ready");
		expect(
			within(recent).queryByRole("link", { name: /Room 11/ }),
		).toBeNull();
	});

	it("visits a room without collapsing the desktop sidebar", async () => {
		const user = userEvent.setup();
		const onRoomVisited = vi.fn();
		renderSidebar({
			sessions: [room(1)],
			activeAgentId: researchAgent.id,
			onRoomVisited,
		});

		await user.click(
			within(
				screen.getByRole("list", {
					name: "Rooms for Research agent",
				}),
			).getByRole("link", { name: /Room 1/ }),
		);

		expect(onRoomVisited).toHaveBeenCalledWith("room-1");
		expect(
			screen.getByRole("status", { name: "Workspace sidebar state" }),
		).toHaveTextContent("expanded");
	});

	it("closes only the mobile drawer after a room is selected", async () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 360,
		});
		const user = userEvent.setup();
		renderSidebar({
			sessions: [room(1)],
			activeAgentId: researchAgent.id,
		});
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Mobile sidebar state" }),
			).toHaveTextContent("mobile:closed"),
		);

		await user.click(
			screen.getByRole("button", { name: "Open mobile drawer" }),
		);
		expect(
			screen.getByRole("status", { name: "Mobile sidebar state" }),
		).toHaveTextContent("mobile:open");
		await user.click(
			within(
				screen.getByRole("list", {
					name: "Rooms for Research agent",
				}),
			).getByRole("link", { name: /Room 1/ }),
		);
		expect(
			screen.getByRole("status", { name: "Mobile sidebar state" }),
		).toHaveTextContent("mobile:closed");
	});

	it("starts a new room with the active room's model", async () => {
		const user = userEvent.setup();
		const randomId = vi
			.spyOn(crypto, "randomUUID")
			.mockReturnValue("00000000-0000-4000-8000-000000000001");
		renderSidebar({
			sessions: [room(1)],
			activeAgentId: researchAgent.id,
			activeRoomId: "room-1",
		});

		await user.click(
			screen.getByRole("button", {
				name: "New room with Research agent",
			}),
		);

		expect(
			screen.getByRole("status", { name: "Current location" }),
		).toHaveTextContent(
			"/agents/research-agent/new/00000000-0000-4000-8000-000000000001?model=model-2",
		);
		randomId.mockRestore();
	});
});
