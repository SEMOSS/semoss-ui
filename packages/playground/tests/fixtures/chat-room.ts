import type { Locator, Page } from "@playwright/test";

/**
 * Interactions shared by the new-room page (/#/new) and an in-progress room
 * (/#/room/:id). The chat input is a Lexical editor, not a native input, so we
 * target it via its `role="textbox"` attribute.
 */
export class ChatRoom {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async gotoNew(): Promise<void> {
		await this.page.goto("#/new");
		await this.page.getByText(/Welcome,/i).waitFor();
	}

	welcomeHeader(): Locator {
		return this.page.getByText(/Welcome,/i);
	}

	/**
	 * The Lexical contenteditable where the user types their prompt.
	 * There may be more than one element with role=textbox on the page
	 * (e.g. search bar), so we scope to the visible placeholder we know.
	 */
	promptInput(): Locator {
		return this.page
			.locator('[role="textbox"][contenteditable="true"]')
			.filter({ has: this.page.locator(":scope") })
			.last();
	}

	sendButton(): Locator {
		// data-tour="tour-send" is on a wrapper <span>; target the <Button> inside it.
		return this.page.locator('[data-tour="tour-send"] button');
	}

	plusMenuButton(): Locator {
		// data-tour="tour-input-menu" is on the bottom-controls wrapper div.
		// The actual trigger button has aria-label="Add files, agents, and more".
		return this.page.getByRole("button", { name: /add files, agents/i });
	}

	micButton(): Locator {
		return this.page.getByRole("button", { name: /record|mic/i });
	}

	modelPill(): Locator {
		return this.page
			.getByText(/Claude|Anthropic|Sonnet|Opus|Haiku|GPT/i)
			.first();
	}

	thinkingBlock(): Locator {
		return this.page.getByText(/^Thinking/).first();
	}

	// User message bubble (the last one sent). Playground renders user turns
	// as text bubbles aligned to the right.
	lastUserMessage(): Locator {
		return this.page.locator('[data-message-role="user"]').last();
	}

	async openPlusMenu(): Promise<void> {
		await this.plusMenuButton().click();
	}

	async openRoomSettings(): Promise<void> {
		await this.openPlusMenu();
		await this.page
			.getByRole("menuitem", { name: /open room settings/i })
			.click();
	}

	async selectMode(mode: "Ask" | "Plan"): Promise<void> {
		await this.openPlusMenu();
		await this.page
			.getByRole("menuitem", { name: new RegExp(`^${mode}$`, "i") })
			.click();
	}

	async openToolboxPicker(): Promise<void> {
		await this.openPlusMenu();
		await this.page
			.getByRole("menuitem", { name: /add toolboxes?/i })
			.click();
	}

	async openKnowledgePicker(): Promise<void> {
		await this.openPlusMenu();
		await this.page
			.getByRole("menuitem", { name: /add knowledge/i })
			.click();
	}

	async type(text: string): Promise<void> {
		const input = this.promptInput();
		await input.click();
		await input.fill(text);
	}

	async send(text: string): Promise<void> {
		await this.type(text);
		await this.sendButton().click();
		// URL hops from /#/new to /#/room/:id once the first message lands
		await this.page.waitForURL(/#\/room\//, { timeout: 20_000 });
	}

	/**
	 * Wait for the assistant turn after a user message. Signals used:
	 *   - Thinking block appears then disappears, OR
	 *   - Any assistant-role message becomes visible.
	 * Falls back to polling the send button — once it re-enables, the turn is done.
	 */
	async waitForResponse(timeout = 45_000): Promise<void> {
		// When isLoading=true the button shows "Pause all tool execution…".
		// When the turn is done (isLoading=false) the aria-label reverts to "Ask the AI".
		// We can't poll `.disabled` because the button stays disabled when the input is empty.
		await this.page.waitForFunction(
			() => {
				const span = document.querySelector('[data-tour="tour-send"]');
				const btn = span?.querySelector(
					"button",
				) as HTMLButtonElement | null;
				return !!btn && btn.getAttribute("aria-label") === "Ask the AI";
			},
			undefined,
			{ timeout },
		);
	}
}
