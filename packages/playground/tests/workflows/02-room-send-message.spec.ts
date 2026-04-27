import { expect, test } from "../fixtures";
import { randomRoomMessage } from "../helpers/random";

test.describe("room: send a message", { tag: ["@rooms"] }, () => {
	test("send a prompt and receive a reply @rooms", async ({ page, chat }) => {
		await chat.gotoNew();

		const message = randomRoomMessage();
		await chat.send(message);

		// URL should land on a persistent room
		await expect(page).toHaveURL(/#\/room\/[a-f0-9-]+/i);

		// User turn should echo the prompt
		await expect(
			page.getByText(message, { exact: false }).first(),
		).toBeVisible({ timeout: 10_000 });

		// Assistant turn: either a Thinking block or the send button re-enabling
		await chat.waitForResponse();
	});
});
