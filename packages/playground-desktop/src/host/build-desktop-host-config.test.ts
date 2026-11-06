import { expect, test, vi } from "vitest";
import { ROOM_PANEL_COMPONENTS } from "@semoss/chat";
import { CONNECTOR_PANEL_COMPONENTS } from "@semoss/chat/connectors";
import { CHAT_FILE_PANEL_COMPONENTS } from "@semoss/chat/panels";
import type { ChatPreferencesAdapter } from "@semoss/sdk";
import {
	buildDesktopHostConfig,
	readInstanceChatTheme,
} from "./build-desktop-host-config";

const preferences: ChatPreferencesAdapter = {
	readSelectedModel: () => null,
	writeSelectedModel: () => undefined,
};

test("the instance's playground theme sets up the chat", () => {
	const navigate = vi.fn();
	const config = buildDesktopHostConfig({
		theme: readInstanceChatTheme({
			playground: {
				name: "Acme",
				featureFlags: { enableTemperature: true },
				toolAutoExecutionLimit: 3,
			},
		}),
		preferences: preferences,
		navigate: navigate,
	});
	expect(config.appName).toBe("Acme");
	expect(config.engine.sendTemperature).toBe(true);
	expect(config.engine.toolAutoExecutionLimit).toBe(3);
	// the room's files, the connectors and the desktop's own tools
	expect(config.engine.clientTools?.map((provider) => provider.id)).toEqual([
		"chat-files",
		"connectors",
		"desktop",
	]);
	expect(config.integrations).toHaveLength(2);
	// the shared file panels, the room's and the connectors'; none of its own
	expect(Object.keys(config.panelComponents ?? {}).sort()).toEqual(
		Object.keys({
			...CHAT_FILE_PANEL_COMPONENTS,
			...ROOM_PANEL_COMPONENTS,
			...CONNECTOR_PANEL_COMPONENTS,
		}).sort(),
	);
	expect(config.filePanels?.explorerType).toBe("file-explorer");
});

test("an instance without a theme gets the defaults", () => {
	expect(readInstanceChatTheme(null)).toEqual({});
	const config = buildDesktopHostConfig({
		theme: {},
		preferences: preferences,
		navigate: vi.fn(),
	});
	expect(config.appName).toBe("SEMOSS Playground");
	expect(config.featureFlags).toEqual({});
});

test("the chat's navigation goes through the app's routes", () => {
	const navigate = vi.fn();
	const { navigation } = buildDesktopHostConfig({
		theme: {},
		preferences: preferences,
		navigate: navigate,
	});
	navigation.onOpenRoom("r1");
	navigation.onNewRoom({ agentId: "a1", prompt: "hi there" });
	navigation.onLeaveRoom();
	expect(navigate.mock.calls).toEqual([
		["/room/r1"],
		["/new?agentId=a1&prompt=hi+there"],
		["/new"],
	]);
	expect(navigation.getRoomHref("r1")).toBe("#/room/r1");
});
