import type { Locator, Page } from "@playwright/test";

/**
 * Left navigation rail that is present on every authenticated screen.
 */
export class Sidebar {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	get root(): Locator {
		return this.page.locator("aside, nav").first();
	}

	newChatLink(): Locator {
		// aria-label="New Chat" on the <Link> element
		return this.page.getByRole("link", { name: /new chat/i }).first();
	}

	agentsLink(): Locator {
		// aria-label="agent" on the <Link> element (only rendered if enableAgent feature flag is on)
		return this.page.getByRole("link", { name: /^agents?$/i }).first();
	}

	searchInput(): Locator {
		return this.page.getByPlaceholder(/search/i).first();
	}

	takeTourButton(): Locator {
		return this.page.locator('[data-tour="tour-take-tour"]');
	}

	userMenuTrigger(): Locator {
		return this.page.locator("button:has(.rounded-lg)").last();
	}

	chatByName(name: string | RegExp): Locator {
		return this.page
			.getByRole("link", { name: typeof name === "string" ? name : name })
			.filter({
				has: this.page.locator(
					"text=" + (typeof name === "string" ? name : ""),
				),
			})
			.first();
	}

	async gotoNew(): Promise<void> {
		await this.newChatLink().click();
		await this.page.waitForURL(/#\/new/);
	}

	async gotoAgents(): Promise<void> {
		await this.agentsLink().click();
		await this.page.waitForURL(/#\/agent(\b|\/)/);
	}

	async logout(): Promise<void> {
		await this.userMenuTrigger().click();
		await this.page.getByRole("menuitem", { name: /log ?out/i }).click();
		await this.page.waitForURL(/#\/login/);
	}
}
