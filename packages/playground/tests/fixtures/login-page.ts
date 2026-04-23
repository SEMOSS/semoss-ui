import type { Locator, Page } from "@playwright/test";

export class LoginPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async goto(): Promise<void> {
		await this.page.goto("#/login");
	}

	heading(): Locator {
		return this.page.getByRole("heading", { name: /sign in/i });
	}

	usernameInput(): Locator {
		return this.page.getByPlaceholder("Username");
	}

	passwordInput(): Locator {
		return this.page.getByPlaceholder("Password");
	}

	submitButton(): Locator {
		return this.page.getByRole("button", { name: /login|sign in/i });
	}

	async login(username: string, password: string): Promise<void> {
		await this.usernameInput().fill(username);
		await this.passwordInput().fill(password);
		await this.submitButton().click();
	}
}
