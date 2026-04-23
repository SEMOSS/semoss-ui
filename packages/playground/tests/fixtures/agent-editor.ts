import type { Locator, Page } from "@playwright/test";

/**
 * /#/agent/new and /#/agent/:id/edit. The form uses `data-testid` attributes
 * from `workspace-form.tsx`, so selectors here are the most stable in the suite.
 */
export class AgentEditor {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	nameInput(): Locator {
		return this.page.getByTestId("workspaceForm-textField-name");
	}

	descriptionInput(): Locator {
		return this.page.getByTestId("workspaceForm-description-txt");
	}

	instructionsInput(): Locator {
		return this.page.getByTestId("workspaceForm-system_prompt-txt");
	}

	submitButton(): Locator {
		return this.page.getByTestId("workspaceForm-submit-btn");
	}

	backButton(): Locator {
		return this.page.getByRole("button", { name: /^back$/i });
	}

	/** Card representing an attached knowledge/toolbox item — identified by name. */
	attachedChip(name: string): Locator {
		return this.page
			.locator('[role="button"], button, [data-slot="badge"]')
			.filter({ hasText: name })
			.first();
	}

	async fill(opts: {
		name?: string;
		description?: string;
		instructions?: string;
	}): Promise<void> {
		if (opts.name !== undefined) {
			await this.nameInput().fill(opts.name);
		}
		if (opts.description !== undefined) {
			await this.descriptionInput().fill(opts.description);
		}
		if (opts.instructions !== undefined) {
			await this.instructionsInput().fill(opts.instructions);
		}
	}

	async submit(): Promise<void> {
		await this.submitButton().click();
	}
}
