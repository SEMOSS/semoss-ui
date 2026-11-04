import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { RoomStore } from "@/stores/room/room.store";
import { type UseRoomToolboxResult, useRoomToolbox } from "../use-room-toolbox";
import { RoomToolboxSection } from "./room-toolbox-section";

const openSettings = vi.fn();

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}));
vi.mock("@/features/settings/settings-dialog.context", () => ({
	useSettingsDialog: () => ({ openSettings: openSettings }),
}));
vi.mock("@/features/connectors/use-connector-logins", () => ({
	useConnectorLogins: vi.fn(),
}));
vi.mock("@/features/connectors/use-connect-provider", () => ({
	useConnectProvider: () => vi.fn(),
}));
vi.mock("../use-room-toolbox", () => ({ useRoomToolbox: vi.fn() }));

const mockUseRoomToolbox = vi.mocked(useRoomToolbox);

const room = {
	connectors: {
		services: [],
		isSavingConnectors: false,
		connectedProviders: [],
		isProviderOffered: () => true,
		isServiceCovered: () => true,
	},
} as unknown as RoomStore;

const toolboxState = (
	state: Partial<UseRoomToolboxResult>,
): UseRoomToolboxResult => ({
	status: "ready",
	tools: [],
	reload: vi.fn(),
	...state,
});

beforeEach(() => {
	openSettings.mockReset();
});

test("links to the settings dialog's Connectors page, even with none switched on", () => {
	mockUseRoomToolbox.mockReturnValue(toolboxState({}));
	render(<RoomToolboxSection room={room} />);

	// said as a row of the list, as every section says it
	expect(screen.getByText("panel.toolboxEmpty").closest("li")).toBeVisible();
	expect(
		screen.getByRole("region", { name: "panel.connectorsTitle" }),
	).toBeVisible();
	fireEvent.click(
		screen.getByRole("button", { name: /panel.manageConnectors/ }),
	);
	expect(openSettings).toHaveBeenCalledWith("connectors");
});

test("lists tools that are not a connector's under Other Tools", () => {
	mockUseRoomToolbox.mockReturnValue(
		toolboxState({
			tools: [
				{
					name: "lookup",
					title: "Look Up",
					description: "Looks things up.",
					execution: "auto",
					parameters: [],
					reactor: "SomeOtherReactor",
				},
			],
		}),
	);
	render(<RoomToolboxSection room={room} />);

	expect(
		screen.getByRole("button", { name: /panel.otherTools/ }),
	).toBeVisible();
	expect(screen.getByRole("button", { name: /Look Up/ })).toBeVisible();
	// the header counts rows: one group, Other Tools
	const heading = screen.getByRole("heading", {
		name: "panel.connectorsTitle",
	});
	expect(heading.parentElement).toHaveTextContent(/^panel\.connectorsTitle1/);
});

test("says when the toolbox cannot be read, with a Retry", () => {
	const reload = vi.fn();
	mockUseRoomToolbox.mockReturnValue(
		toolboxState({ status: "error", reload: reload }),
	);
	render(<RoomToolboxSection room={room} />);

	expect(screen.getByRole("alert")).toHaveTextContent("panel.toolboxError");
	fireEvent.click(
		screen.getByRole("button", { name: "common:buttons.retry" }),
	);
	expect(reload).toHaveBeenCalledTimes(1);
});
