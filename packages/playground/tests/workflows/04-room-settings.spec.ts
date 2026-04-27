import { expect, test } from "../fixtures";

test.describe("room settings panel", { tag: ["@rooms"] }, () => {
	test("settings panel exposes model + instructions @rooms", async ({
		page,
		chat,
		roomSettings,
	}) => {
		await chat.gotoNew();
		await chat.openRoomSettings();

		await expect(roomSettings.panel()).toBeVisible();
		await expect(roomSettings.instructionsInput()).toBeVisible();
		// Model select is behind the enableModelSelect feature flag — check only when present.
		const modelSelectCount = await roomSettings.modelSelect().count();
		if (modelSelectCount > 0) {
			await expect(roomSettings.modelSelect()).toBeVisible();
		}
	});

	test("toolbox picker opens and lists options @rooms", async ({
		page,
		chat,
		toolboxPicker,
	}) => {
		await chat.gotoNew();
		await chat.openToolboxPicker();

		await expect(toolboxPicker.dialog()).toBeVisible();
		await expect(toolboxPicker.searchInput()).toBeVisible();
		await expect(toolboxPicker.cancelButton()).toBeVisible();

		await toolboxPicker.cancel();
		await expect(toolboxPicker.dialog()).toBeHidden();
	});

	test("knowledge picker opens and closes @rooms", async ({
		page,
		chat,
		knowledgePicker,
	}) => {
		await chat.gotoNew();
		await chat.openKnowledgePicker();

		await expect(knowledgePicker.dialog()).toBeVisible();
		await knowledgePicker.cancel();
		await expect(knowledgePicker.dialog()).toBeHidden();
	});
});
