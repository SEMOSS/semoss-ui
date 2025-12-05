import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { RoomInput } from "./room-input";

test("pressing Enter calls onPrompt with textarea content", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));

	render(
		<RoomInput
			isLoading={false}
			isDisabled={false}
			minRows={2}
			maxRows={6}
			onPrompt={onPrompt}
		/>,
	);

	const textarea = screen.getByPlaceholderText(
		"What do you want to do today?",
	);

	// type some text
	fireEvent.change(textarea, { target: { value: "Hello world" } });

	// press Enter (without Shift) to submit
	fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", charCode: 13 });

	// onPrompt is async — wait a tick
	await Promise.resolve();

	expect(onPrompt).toHaveBeenCalledTimes(1);
	expect(onPrompt).toHaveBeenCalledWith("Hello world", []);
});

test("clicking send button calls onPrompt", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));

	render(
		<RoomInput
			isLoading={false}
			isDisabled={false}
			minRows={2}
			maxRows={6}
			onPrompt={onPrompt}
		/>,
	);

	const textarea = screen.getByPlaceholderText(
		"What do you want to do today?",
	);
	fireEvent.change(textarea, { target: { value: "Click send" } });

	// find the button by aria-label
	const sendButton = screen.getByLabelText("Prompt the Model");

	fireEvent.click(sendButton);

	await Promise.resolve();

	expect(onPrompt).toHaveBeenCalledTimes(1);
	expect(onPrompt).toHaveBeenCalledWith("Click send", []);
});

test("does not call onPrompt when loading or disabled", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));

	// isLoading true
	const { rerender } = render(
		<RoomInput
			isLoading={true}
			isDisabled={false}
			minRows={2}
			maxRows={6}
			onPrompt={onPrompt}
		/>,
	);

	const textarea = screen.getByPlaceholderText(
		"What do you want to do today?",
	);
	fireEvent.change(textarea, { target: { value: "Should not send" } });
	fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", charCode: 13 });

	await Promise.resolve();
	expect(onPrompt).not.toHaveBeenCalled();

	// isDisabled true
	rerender(
		<RoomInput
			isLoading={false}
			isDisabled={true}
			minRows={2}
			maxRows={6}
			onPrompt={onPrompt}
		/>,
	);

	fireEvent.change(textarea, { target: { value: "Should not send either" } });
	fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", charCode: 13 });

	await Promise.resolve();
	expect(onPrompt).not.toHaveBeenCalled();
});

test("shows toast when onPrompt fails or returns false", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(false));
	toast.error = vi.fn();

	render(
		<RoomInput
			isLoading={false}
			isDisabled={false}
			minRows={2}
			maxRows={6}
			onPrompt={onPrompt}
		/>,
	);

	const textarea = screen.getByPlaceholderText(
		"What do you want to do today?",
	);
	fireEvent.change(textarea, { target: { value: "Will fail" } });
	fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", charCode: 13 });

	await Promise.resolve();

	// toast.error should be called with the thrown message
	expect(toast.error).toHaveBeenCalled();
	// ensure onPrompt was called once
	expect(onPrompt).toHaveBeenCalledTimes(1);
});
