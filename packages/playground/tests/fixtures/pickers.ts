import type { Locator, Page } from "@playwright/test";

/**
 * Shared behavior for the "Configure Toolboxes" and "Configure Knowledge"
 * pickers. Both render a dialog with a search input, a grid of selectable
 * cards, a chip row at the bottom showing the current selection, and a
 * Save/Cancel footer.
 */
class MCPPicker {
	readonly page: Page;
	readonly title: RegExp;

	constructor(page: Page, title: RegExp) {
		this.page = page;
		this.title = title;
	}

	dialog(): Locator {
		return this.page.getByRole("dialog").filter({ hasText: this.title });
	}

	searchInput(): Locator {
		return this.dialog().getByPlaceholder(/search/i);
	}

	cardByName(name: string | RegExp): Locator {
		return this.dialog()
			.locator('[data-slot="card"], [class*="card"]')
			.filter({ hasText: name })
			.first();
	}

	selectedChip(name: string | RegExp): Locator {
		return this.dialog()
			.locator('[data-slot="badge"], [class*="badge"]')
			.filter({ hasText: name })
			.first();
	}

	saveButton(): Locator {
		return this.dialog().getByRole("button", { name: /^save$/i });
	}

	cancelButton(): Locator {
		return this.dialog().getByRole("button", { name: /^cancel$/i });
	}

	async search(query: string): Promise<void> {
		await this.searchInput().fill(query);
	}

	async selectByName(name: string): Promise<void> {
		await this.cardByName(name).click();
	}

	async save(): Promise<void> {
		await this.saveButton().click();
		await this.dialog().waitFor({ state: "hidden" });
	}

	async cancel(): Promise<void> {
		await this.cancelButton().click();
		await this.dialog().waitFor({ state: "hidden" });
	}
}

export class ToolboxPicker extends MCPPicker {
	constructor(page: Page) {
		super(page, /Configure Toolboxes/i);
	}
}

export class KnowledgePicker extends MCPPicker {
	constructor(page: Page) {
		super(page, /Configure Knowledge/i);
	}
}
