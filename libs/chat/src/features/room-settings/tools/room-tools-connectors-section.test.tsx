import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { RoomStore } from "../../room/store/room.store";
import { RoomToolsConnectorsSection } from "./room-tools-connectors-section";
import { useRoomToolbox } from "./use-room-toolbox";
import type { ToolsRead } from "./use-tools-read";

const openSettings = vi.fn();

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}));
vi.mock("../../chat/config/chat-config.context", async (original) => ({
	...(await original<
		typeof import("../../chat/config/chat-config.context")
	>()),
	useChatConfig: () => ({ callbacks: { onOpenSettings: openSettings } }),
}));
vi.mock("../../connectors/accounts/use-connector-logins", () => ({
	useConnectorLogins: vi.fn(),
}));
vi.mock("../../connectors/accounts/use-connect-provider", () => ({
	useConnectProvider: () => vi.fn(),
}));
vi.mock("./use-room-toolbox", () => ({ useRoomToolbox: vi.fn() }));

const mockUseRoomToolbox = vi.mocked(useRoomToolbox);

/** A room whose connectors are all on hand, with nothing switched on. */
const room = {
	connectors: {
		// a fixed store: its snapshot is itself
		getSnapshot() {
			return this;
		},
		subscribe: () => () => {},
		services: [],
		isSavingConnectors: false,
		connectedProviders: [],
		isProviderOffered: () => true,
		isServiceCovered: () => true,
	},
} as unknown as RoomStore;

/** What `useRoomToolbox` returns, read and empty unless overridden. */
const toolboxState = (state: Partial<ToolsRead>): ToolsRead => ({
	status: "ready",
	tools: [],
	load: vi.fn(),
	...state,
});

beforeEach(() => {
	openSettings.mockReset();
});

test("links to the settings dialog's Connectors page, even with none switched on", () => {
	mockUseRoomToolbox.mockReturnValue(toolboxState({}));
	render(<RoomToolsConnectorsSection room={room} />);

	// said as a row of the list, as every section says it
	expect(
		screen.getByText("sections.connectors.empty").closest("li"),
	).toBeVisible();
	expect(
		screen.getByRole("region", { name: "sections.connectors.title" }),
	).toBeVisible();
	fireEvent.click(
		screen.getByRole("button", { name: /sections.connectors.manage/ }),
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
	render(<RoomToolsConnectorsSection room={room} />);

	expect(
		screen.getByRole("button", { name: /sections.connectors.otherTools/ }),
	).toBeVisible();
	expect(screen.getByRole("button", { name: /Look Up/ })).toBeVisible();
	// the header counts rows: one group, Other Tools
	const heading = screen.getByRole("heading", {
		name: "sections.connectors.title",
	});
	expect(heading.parentElement).toHaveTextContent(
		/^sections\.connectors\.title1/,
	);
});

test("says when the toolbox cannot be read, with a Retry", () => {
	const load = vi.fn();
	mockUseRoomToolbox.mockReturnValue(
		toolboxState({ status: "error", load: load }),
	);
	render(<RoomToolsConnectorsSection room={room} />);

	expect(screen.getByRole("alert")).toHaveTextContent(
		"sections.connectors.error",
	);
	fireEvent.click(
		screen.getByRole("button", { name: "common:buttons.retry" }),
	);
	expect(load).toHaveBeenCalledTimes(1);
});
