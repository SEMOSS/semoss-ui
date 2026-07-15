import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { expect, test, vi } from "vitest";
import type { RoomStore } from "@/stores";
import { RoomSidebar } from "./room-sidebar";

vi.mock("@semoss/sdk/react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/sdk/react")>();
	return {
		...actual,
		useInsight: () => ({
			actions: {
				run: vi.fn(),
			},
		}),
	};
});

// Mock @semoss/shared to avoid flexlayout-react instanceof issues in jsdom
vi.mock("@semoss/shared", () => {
	class TabNode {}
	class TabSetNode {}
	return {
		FlexLayout: {
			Layout: () =>
				React.createElement(
					"div",
					{ "data-testid": "flexlayout" },
					null,
				),
			TabNode,
			TabSetNode,
		},
		getFileIconComponent: vi.fn(() => null),
		useTabBarScroll: vi.fn(() => ({
			ref: { current: null },
			onScroll: vi.fn(),
		})),
		createMcpPlatformUrl: vi.fn(() => vi.fn()),
		createPromptPlatformUrl: vi.fn(() => vi.fn()),
	};
});

const createMockRoom = () => ({
	closeSidebar: vi.fn(),
	removeSidebarNode: vi.fn(),
	addSidebarNode: vi.fn(),
	getToolByNodeId: vi.fn(() => null),
	sidebar: {
		isOpen: true,
		counter: 0,
		model: {
			getActiveTabset: vi.fn(() => null),
			getNodeById: vi.fn(() => null),
		},
	},
});

test("renders sidebar and close button triggers closeSidebar", () => {
	// Partial stub — only the members RoomSidebar touches are mocked.
	const room = createMockRoom() as unknown as RoomStore;

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
