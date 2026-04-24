import { expect, test } from "../fixtures";
import { randomAgentName } from "../helpers/random";

test.describe("agent: create, edit, delete", { tag: ["@agents"] }, () => {
	test("full CRUD lifecycle @agents", async ({
		page,
		agents,
		agentEditor,
	}) => {
		const name = randomAgentName("crud");

		// --- CREATE ---
		await agents.goto();
		await agents.startCreate();

		await agentEditor.fill({
			name,
			description: `Created by e2e workflow at ${new Date().toISOString()}`,
			instructions: "You are an e2e test agent. Respond with 'ok'.",
		});
		await agentEditor.submit();

		// Playground redirects to /#/agent/:id after creation; the create pixel can take >10s on cold start
		await page.waitForURL(/#\/agent\/[a-f0-9-]+$/, { timeout: 20_000 });

		// --- READ (list view) ---
		await agents.goto();
		await agents.searchInput().fill(name);
		await expect(agents.agentCard(name)).toBeVisible();

		// --- UPDATE ---
		await agents.openAgent(name);
		// The agent detail "..." button: Radix DropdownMenuTrigger sets aria-haspopup="menu".
		await page.locator('button[aria-haspopup="menu"]').first().click();
		await page
			.locator('[role="menu"][data-state="open"]')
			.waitFor({ state: "visible" });
		await page.getByRole("menuitem", { name: /^edit$/i }).click();
		await expect(page).toHaveURL(/#\/agent\/[a-f0-9-]+\/edit/i);

		// WorkspaceForm pre-populates from a useEffect — wait for the name field to
		// have a value before interacting, otherwise it may submit with an empty name.
		await agentEditor.nameInput().waitFor({ state: "visible" });
		await expect(agentEditor.nameInput()).not.toHaveValue("");

		const newDescription = `Edited by e2e at ${Date.now()}`;
		// Re-pass name explicitly so the form always ends up with the correct name
		// regardless of useEffect timing.
		await agentEditor.fill({ name, description: newDescription });
		await agentEditor.submit();
		// The form's onSubmit is async — wait for it to finish and navigate to the detail page
		// before we navigate away. Without this, our goto() races with the form's navigate().
		await page.waitForURL(/#\/agent\/[a-f0-9-]+$/, { timeout: 15_000 });

		// --- DELETE ---
		await agents.goto();
		await agents.searchInput().fill(name);
		await agents.deleteAgent(name);

		await expect(agents.agentCard(name)).toHaveCount(0);
	});
});
