import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { expect, test, vi } from "vitest";
import type { RoomStore } from "@/stores";
import { RoomSidebar } from "./room-sidebar";

// Mock shared FlexLayout to avoid heavy implementation in tests
vi.mock("@semoss/shared", () => {
	return {
		FlexLayout: {
			Layout: () => {
				// Render a simple placeholder for layout
				return React.createElement(
					"div",
					{ "data-testid": "flexlayout" },
					null,
				);
			},
		},
	};
});

const createMockRoom = () => ({
	closeSidebar: vi.fn(),
	sidebar: { model: {}, isOpen: true },
});

test("renders sidebar and close button triggers closeSidebar", () => {
	const room: RoomStore = createMockRoom();

	render(<RoomSidebar room={room} />);

	// Assert FlexLayout placeholder exists
	expect(screen.getByTestId("flexlayout")).toBeInTheDocument();

	// There are two buttons (maximize and close) — click the last one (close)
	const buttons = screen.getAllByRole("button");
	expect(buttons.length).toBeGreaterThanOrEqual(2);

	const closeButton = buttons[buttons.length - 1];
	fireEvent.click(closeButton);

	expect(room.closeSidebar).toHaveBeenCalled();
});
