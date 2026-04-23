import type { Locator, Page } from "@playwright/test";

/** /#/agent — the landing page listing all agents. */
export class AgentManager {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto(): Promise<void> {
		await this.page.goto("#/agent");
		await this.welcomeBanner().waitFor();
	}

	welcomeBanner(): Locator {
		return this.page.getByText(/Welcome to Agent Manager/i);
	}

	createAgentButton(): Locator {
		return this.page.getByRole("button", { name: /create an agent/i });
	}

	searchInput(): Locator {
		// Scope to the main content area (SidebarInset renders as <main>) to avoid
		// matching the sidebar's search input which has the same placeholder.
		return this.page.locator("main").getByPlaceholder(/search/i);
	}

	agentCard(name: string | RegExp): Locator {
		const re =
			typeof name === "string"
				? new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
				: name;
		// CardTitle renders as <div data-slot="card-title"> (not a heading).
		// Find the card that contains a card-title matching the agent name.
		return this.page
			.locator('[data-slot="card"]')
			.filter({
				has: this.page
					.locator('[data-slot="card-title"]')
					.filter({ hasText: re }),
			})
			.first();
	}

	async startCreate(): Promise<void> {
		await this.createAgentButton().click();
		await this.page.waitForURL(/#\/agent\/new/);
	}

	async openAgent(name: string | RegExp): Promise<void> {
		await this.agentCard(name).click();
		await this.page.waitForURL(/#\/agent\/[a-f0-9-]+/);
	}

	async deleteAgent(name: string | RegExp): Promise<void> {
		const card = this.agentCard(name);
		// Wait for the card (search may be debounced — give it up to 10s to appear).
		await card.waitFor({ state: "visible", timeout: 10_000 });
		// Hover first in case the button is only visible on hover.
		await card.hover();
		// Radix DropdownMenuTrigger (asChild) sets aria-haspopup="menu" on the trigger button.
		await card.locator('button[aria-haspopup="menu"]').click();
		// Wait for the dropdown to fully open.
		await this.page
			.locator('[role="menu"][data-state="open"]')
			.waitFor({ state: "visible" });
		// Use force:true to bypass Radix animation instability.
		await this.page
			.getByRole("menuitem", { name: /^delete$/i })
			.click({ force: true });
		// Confirm dialog — also force:true for same animation reason.
		await this.page
			.getByTestId("workspace-card--confirm-delete-btn")
			.click({ force: true });
		await card.waitFor({ state: "detached", timeout: 15_000 });
	}
}
