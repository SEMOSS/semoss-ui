import { describe, expect, it, vi } from "vitest";

vi.mock("@semoss/shared", () => ({ copyToClipboard: vi.fn() }));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { copyToClipboard } from "@semoss/shared";
import { MessageFeedbackToolbar } from "./message-feedback-toolbar";

describe("MessageFeedbackToolbar", () => {
	it("calls onRate(true)/onRate(false) for thumbs up/down", async () => {
		const user = userEvent.setup();
		const onRate = vi.fn();
		render(<MessageFeedbackToolbar onRate={onRate} textContent="hello" />);

		await user.click(screen.getByRole("button", { name: "Good response" }));
		expect(onRate).toHaveBeenCalledWith(true);

		await user.click(screen.getByRole("button", { name: "Poor response" }));
		expect(onRate).toHaveBeenCalledWith(false);
	});

	it("fills the thumbs-up icon when rating is true", () => {
		render(
			<MessageFeedbackToolbar
				rating={true}
				onRate={vi.fn()}
				textContent="hello"
			/>,
		);
		const button = screen.getByRole("button", { name: "Good response" });
		expect(button.querySelector("svg")).toHaveClass("fill-current");
	});

	it("copies the text content to the clipboard", async () => {
		const user = userEvent.setup();
		render(
			<MessageFeedbackToolbar onRate={vi.fn()} textContent="copy me" />,
		);
		await user.click(screen.getByRole("button", { name: "Copy response" }));

		expect(copyToClipboard).toHaveBeenCalledWith(
			"copy me",
			expect.any(Function),
			expect.any(Function),
		);
	});

	it("does not render a download action when onDownload is omitted", () => {
		render(<MessageFeedbackToolbar onRate={vi.fn()} textContent="hello" />);
		expect(
			screen.queryByRole("button", { name: "Download response" }),
		).not.toBeInTheDocument();
	});

	it("opens a format picker and calls onDownload with the chosen format", async () => {
		const user = userEvent.setup();
		const onDownload = vi.fn().mockResolvedValue(undefined);
		render(
			<MessageFeedbackToolbar
				onRate={vi.fn()}
				textContent="hello"
				onDownload={onDownload}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Download response" }),
		);
		await user.click(screen.getByRole("button", { name: "Word Document" }));

		expect(onDownload).toHaveBeenCalledWith("word");
	});
});
