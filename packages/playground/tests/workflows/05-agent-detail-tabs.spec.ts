import { expect, test } from "../fixtures";
import { randomAgentName } from "../helpers/random";

/**
 * Agent detail page has four tabs: My Chats, Knowledge, Toolbox, Members.
 * This workflow creates a disposable agent, walks each tab, then deletes it.
 */
test.describe("agent detail tabs", { tag: ["@agents"] }, () => {
	test("each tab renders and is navigable @agents", async ({
		page,
		agents,
		agentEditor,
	}) => {
		const name = randomAgentName("tabs");

		// setup
		await agents.goto();
		await agents.startCreate();
		await agentEditor.fill({ name });
		await agentEditor.submit();
		await expect(page).toHaveURL(/#\/agent\/[a-f0-9-]+/i);

		for (const tab of ["My Chats", "Knowledge", "Toolbox", "Members"]) {
			await page.getByRole("tab", { name: new RegExp(tab, "i") }).click();
			await expect(
				page.getByRole("tab", {
					name: new RegExp(tab, "i"),
					selected: true,
				}),
			).toBeVisible();
		}

		// cleanup
		await agents.goto();
		await agents.searchInput().fill(name);
		await agents.deleteAgent(name);
	});
});
