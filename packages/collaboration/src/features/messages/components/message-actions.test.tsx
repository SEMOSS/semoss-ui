import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { copyTextToClipboard } from "@semoss/utility";
import type { ConversationMessage } from "../types/message";
import { MessageActions } from "./message-actions";

vi.mock("@semoss/utility", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/utility")>()),
	copyTextToClipboard: vi.fn().mockResolvedValue(undefined),
}));

const message: ConversationMessage = {
	id: "message",
	role: "assistant",
	createdAt: "2026-09-24T16:00:00Z",
	parts: [
		{ type: "text", text: "Answer" },
		{ type: "thinking", text: "Reasoning" },
	],
};

it("copies the original message content and confirms the action", async () => {
	render(<MessageActions message={message} />);
	fireEvent.click(screen.getByRole("button", { name: "Copy message" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Message copied" }),
		).toBeInTheDocument(),
	);
	expect(copyTextToClipboard).toHaveBeenCalledWith("Answer\n\nReasoning");
});

it("exposes the full timestamp and copy action through the More menu", async () => {
	render(<MessageActions message={message} />);
	fireEvent.keyDown(screen.getByRole("button", { name: "Message actions" }), {
		key: "Enter",
	});
	const menu = await screen.findByRole("menu");
	expect(menu.querySelector("time")).toHaveAttribute(
		"datetime",
		message.createdAt,
	);
	fireEvent.click(screen.getByRole("menuitem", { name: "Copy message" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Message copied" }),
		).toBeInTheDocument(),
	);
});

it("omits malformed timestamps and never renders a disabled empty copy action", () => {
	const { container, rerender } = render(
		<MessageActions message={{ ...message, createdAt: "invalid" }} />,
	);
	expect(container.querySelector("time")).toBeNull();
	rerender(
		<MessageActions
			message={{ ...message, createdAt: undefined, parts: [] }}
		/>,
	);
	expect(container).toBeEmptyDOMElement();
});
