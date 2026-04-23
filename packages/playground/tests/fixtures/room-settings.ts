import type { Locator, Page } from "@playwright/test";

/**
 * The Room Settings side panel — opened via the `+` menu → "Open Room Settings".
 * Mirrors the English labels in libs/i18n/.../room.json → "form".
 */
export class RoomSettingsPanel {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	panel(): Locator {
		// The settings panel is a ResizablePanel containing a <form> from RoomOptionsForm.
		// The form has a unique "Update Instructions" placeholder — use it to confirm the panel is open.
		return this.page
			.locator("form")
			.filter({
				has: this.page.getByPlaceholder(/Update Instructions/i),
			});
	}

	modelSelect(): Locator {
		// EngineSelect renders a combobox; scoped to the panel form.
		return this.panel().getByRole("combobox").first();
	}

	instructionsInput(): Locator {
		return this.page.getByPlaceholder(/Update Instructions/i);
	}

	maxTokenInput(): Locator {
		return this.panel().getByPlaceholder(/Update token length/i);
	}

	knowledgeSection(): Locator {
		return this.panel()
			.locator("section, div")
			.filter({ hasText: /^Knowledge$/i })
			.first();
	}

	toolboxSection(): Locator {
		return this.panel()
			.locator("section, div")
			.filter({ hasText: /^Toolbox$/i })
			.first();
	}

	async close(): Promise<void> {
		await this.panel()
			.getByRole("button", { name: /close|✕|×/i })
			.first()
			.click();
	}
}
