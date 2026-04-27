import { expect, test } from "../fixtures";

test.describe("smoke", { tag: ["@smoke"] }, () => {
	test("authenticated home shell renders @smoke @auth", async ({
		page,
		chat,
		sidebar,
	}) => {
		await page.goto("#/new");

		await expect(chat.welcomeHeader()).toBeVisible();
		await expect(sidebar.newChatLink()).toBeVisible();
		await expect(chat.promptInput()).toBeVisible();
		// Agents link is feature-flag gated — check it only when present
		const agentsCount = await sidebar.agentsLink().count();
		if (agentsCount > 0) {
			await expect(sidebar.agentsLink()).toBeVisible();
		}
	});

	test("agent manager page renders @smoke @agents", async ({
		page,
		agents,
	}) => {
		await agents.goto();

		await expect(agents.welcomeBanner()).toBeVisible();
		await expect(agents.createAgentButton()).toBeVisible();
		await expect(page).toHaveURL(/#\/agent(\b|\/)/);
	});

	test("sidebar navigation round-trips @smoke", async ({ page, sidebar }) => {
		await page.goto("#/new");
		await sidebar.gotoAgents();
		await expect(page).toHaveURL(/#\/agent(\b|\/)/);

		await sidebar.gotoNew();
		await expect(page).toHaveURL(/#\/new/);
	});
});
