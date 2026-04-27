import { test as base, expect } from "@playwright/test";
import { AgentEditor } from "./agent-editor";
import { AgentManager } from "./agent-manager";
import { ChatRoom } from "./chat-room";
import { LoginPage } from "./login-page";
import { KnowledgePicker, ToolboxPicker } from "./pickers";
import { RoomSettingsPanel } from "./room-settings";
import { Sidebar } from "./sidebar";

type Fixtures = {
	loginPage: LoginPage;
	sidebar: Sidebar;
	chat: ChatRoom;
	agents: AgentManager;
	agentEditor: AgentEditor;
	toolboxPicker: ToolboxPicker;
	knowledgePicker: KnowledgePicker;
	roomSettings: RoomSettingsPanel;
};

export const test = base.extend<Fixtures>({
	loginPage: async ({ page }, use) => {
		await use(new LoginPage(page));
	},
	sidebar: async ({ page }, use) => {
		await use(new Sidebar(page));
	},
	chat: async ({ page }, use) => {
		await use(new ChatRoom(page));
	},
	agents: async ({ page }, use) => {
		await use(new AgentManager(page));
	},
	agentEditor: async ({ page }, use) => {
		await use(new AgentEditor(page));
	},
	toolboxPicker: async ({ page }, use) => {
		await use(new ToolboxPicker(page));
	},
	knowledgePicker: async ({ page }, use) => {
		await use(new KnowledgePicker(page));
	},
	roomSettings: async ({ page }, use) => {
		await use(new RoomSettingsPanel(page));
	},
});

export { expect };
export * from "./agent-editor";
export * from "./agent-manager";
export * from "./chat-room";
export * from "./login-page";
export * from "./pickers";
export * from "./room-settings";
export * from "./sidebar";
