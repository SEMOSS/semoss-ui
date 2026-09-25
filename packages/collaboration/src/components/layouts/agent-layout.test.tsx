import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useAgent } from "@/app/agent.context";

const harness = vi.hoisted(() => ({
	agents: [] as { id: string; name: string }[],
	sessions: [] as { id: string; agentId: string }[],
	statement: "",
	data: undefined as unknown,
	status: "INITIAL" as "INITIAL" | "LOADING" | "SUCCESS" | "ERROR",
	error: undefined as Error | undefined,
	refresh: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	usePixel: (statement: string) => {
		harness.statement = statement;
		return {
			data: harness.data,
			status: harness.status,
			error: harness.error,
			refresh: harness.refresh,
		};
	},
}));

vi.mock("@/app/main.context", () => ({
	useMain: () => ({
		agents: harness.agents,
		sessions: harness.sessions,
	}),
}));

vi.mock("@/components/layouts/selected-agent", () => ({
	SelectedAgent: ({ source }: { source: { id: string } }) => (
		<div>Selected agent: {source.id}</div>
	),
}));

import { AgentLayout } from "./agent-layout";

function RoomAgentProbe() {
	const { agent, agentId } = useAgent();
	return (
		<div>
			Room agent: {agent.name}; id: {agentId || "none"}
		</div>
	);
}

function renderRoute(path: string) {
	const routes: RouteObject[] = [
		{
			path: "/room/:roomId",
			Component: AgentLayout,
			children: [{ index: true, Component: RoomAgentProbe }],
		},
		{ path: "/agents/:agentId", Component: AgentLayout },
	];
	const router = createMemoryRouter(routes, { initialEntries: [path] });
	render(<RouterProvider router={router} />);
}

describe("AgentLayout", () => {
	beforeEach(() => {
		harness.agents = [];
		harness.sessions = [];
		harness.statement = "";
		harness.data = undefined;
		harness.status = "INITIAL";
		harness.error = undefined;
		harness.refresh.mockReset();
	});

	it("opens a listed room without an agent route segment", () => {
		harness.agents = [{ id: "workspace-one", name: "Research" }];
		harness.sessions = [{ id: "room-one", agentId: "workspace-one" }];

		renderRoute("/room/room-one");

		expect(screen.getByText("Selected agent: workspace-one")).toBeVisible();
		expect(harness.statement).toBe("");
	});

	it("resolves a deep-linked room workspace from its room options", () => {
		harness.status = "SUCCESS";
		harness.data = {
			OPTIONS: {
				workspace: { workspace_id: "workspace/two", name: "Research" },
			},
			ROOM_NAME: "Direct room",
		};

		renderRoute("/room/direct-room");

		expect(screen.getByText("Selected agent: workspace/two")).toBeVisible();
		expect(harness.statement).toBe(
			'GetRoomOptions(roomId=["direct-room"]);',
		);
	});

	it("opens a room without an assigned agent", () => {
		harness.status = "SUCCESS";
		harness.data = {
			OPTIONS: {},
			ROOM_NAME: "Unassigned room",
		};

		renderRoute("/room/unassigned-room");

		expect(
			screen.getByText("Room agent: Assistant; id: none"),
		).toBeVisible();
		expect(harness.statement).toBe(
			'GetRoomOptions(roomId=["unassigned-room"]);',
		);
	});

	it("keeps existing agent routes working without a room lookup", () => {
		renderRoute("/agents/workspace-one");

		expect(screen.getByText("Selected agent: workspace-one")).toBeVisible();
		expect(harness.statement).toBe("");
	});

	it("announces room resolution while a direct link is loading", () => {
		harness.status = "LOADING";

		renderRoute("/room/direct-room");

		expect(screen.getByLabelText("Loading room")).toBeVisible();
	});

	it("shows a retry action when direct room resolution fails", async () => {
		const user = userEvent.setup();
		harness.status = "ERROR";
		harness.error = new Error("Room options are unavailable.");

		renderRoute("/room/missing-room");

		expect(screen.getByText("Could not open room")).toBeVisible();
		expect(screen.getByText("Room options are unavailable.")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Try again" }));
		expect(harness.refresh).toHaveBeenCalledOnce();
	});
});
