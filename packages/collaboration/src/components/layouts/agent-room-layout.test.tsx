import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useRoom } from "@/app/room.context";
import { AgentRoomLayout } from "./agent-room-layout";

const harness = vi.hoisted(() => ({
	isMobile: false,
	setOpen: vi.fn(),
	setOpenMobile: vi.fn(),
}));

vi.mock("@semoss/ui/next", () => ({
	useSidebar: () => ({
		isMobile: harness.isMobile,
		setOpen: harness.setOpen,
		setOpenMobile: harness.setOpenMobile,
	}),
}));

function RoomContent() {
	const { openRoomsList } = useRoom();
	return (
		<button type="button" onClick={openRoomsList}>
			Open rooms
		</button>
	);
}

const routes: RouteObject[] = [
	{
		path: "/agents/:agentId",
		Component: AgentRoomLayout,
		children: [
			{ path: "new/:draftId", Component: RoomContent },
			{ path: ":roomId", Component: RoomContent },
		],
	},
];

function renderRoute(path: string) {
	const router = createMemoryRouter(routes, { initialEntries: [path] });
	render(<RouterProvider router={router} />);
}

describe("AgentRoomLayout", () => {
	beforeEach(() => {
		harness.isMobile = false;
		harness.setOpen.mockReset();
		harness.setOpenMobile.mockReset();
	});

	it("reopens the global desktop sidebar", () => {
		renderRoute("/agents/agent-1/room-1");
		fireEvent.click(screen.getByRole("button", { name: "Open rooms" }));

		expect(harness.setOpen).toHaveBeenCalledWith(true);
		expect(harness.setOpenMobile).not.toHaveBeenCalled();
	});

	it("reopens the global mobile drawer", () => {
		harness.isMobile = true;
		renderRoute("/agents/agent-1/room-1");
		fireEvent.click(screen.getByRole("button", { name: "Open rooms" }));

		expect(harness.setOpenMobile).toHaveBeenCalledWith(true);
		expect(harness.setOpen).not.toHaveBeenCalled();
	});
});
