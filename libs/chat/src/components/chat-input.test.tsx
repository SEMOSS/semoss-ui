import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatInput } from "./chat-input";

describe("ChatInput", () => {
	it("sends the trimmed text on Enter and clears the field", async () => {
		const user = userEvent.setup();
		const onSend = vi.fn();
		render(<ChatInput onSend={onSend} />);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "  hello  ");
		await user.keyboard("{Enter}");

		expect(onSend).toHaveBeenCalledWith("hello");
		expect(textarea).toHaveValue("");
	});

	it("inserts a newline on Shift+Enter instead of sending", async () => {
		const user = userEvent.setup();
		const onSend = vi.fn();
		render(<ChatInput onSend={onSend} />);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "line one");
		await user.keyboard("{Shift>}{Enter}{/Shift}");
		await user.type(textarea, "line two");

		expect(onSend).not.toHaveBeenCalled();
		expect(textarea).toHaveValue("line one\nline two");
	});

	it("sends on clicking the Send button", async () => {
		const user = userEvent.setup();
		const onSend = vi.fn();
		render(<ChatInput onSend={onSend} />);

		await user.type(screen.getByPlaceholderText("Message..."), "hi");
		await user.click(screen.getByRole("button", { name: "Send" }));

		expect(onSend).toHaveBeenCalledWith("hi");
	});

	it("does not send empty or whitespace-only input", async () => {
		const user = userEvent.setup();
		const onSend = vi.fn();
		render(<ChatInput onSend={onSend} />);

		await user.type(screen.getByPlaceholderText("Message..."), "   ");
		await user.keyboard("{Enter}");

		expect(onSend).not.toHaveBeenCalled();
	});

	it("disables the textarea and button, and blocks sending, when disabled", async () => {
		const user = userEvent.setup();
		const onSend = vi.fn();
		render(<ChatInput onSend={onSend} disabled />);

		expect(screen.getByPlaceholderText("Message...")).toBeDisabled();
		expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

		await user.keyboard("{Enter}");
		expect(onSend).not.toHaveBeenCalled();
	});

	it("supports controlled value/onValueChange for composing with a PromptOptimizer", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		const { rerender } = render(
			<ChatInput
				onSend={vi.fn()}
				value="seeded text"
				onValueChange={onValueChange}
			/>,
		);

		expect(screen.getByPlaceholderText("Message...")).toHaveValue(
			"seeded text",
		);

		await user.type(screen.getByPlaceholderText("Message..."), "!");
		expect(onValueChange).toHaveBeenLastCalledWith("seeded text!");

		// Controlled mode means typing alone doesn't change what's rendered
		// until the host feeds the new value back in.
		rerender(
			<ChatInput
				onSend={vi.fn()}
				value="seeded text!"
				onValueChange={onValueChange}
			/>,
		);
		expect(screen.getByPlaceholderText("Message...")).toHaveValue(
			"seeded text!",
		);
	});

	it("clears a controlled value via onValueChange after sending", async () => {
		const user = userEvent.setup();
		const onSend = vi.fn();
		const onValueChange = vi.fn();
		render(
			<ChatInput
				onSend={onSend}
				value="hi"
				onValueChange={onValueChange}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Send" }));

		expect(onSend).toHaveBeenCalledWith("hi");
		expect(onValueChange).toHaveBeenLastCalledWith("");
	});

	it("shows a spinner instead of the Send icon while isGenerating", () => {
		render(<ChatInput onSend={vi.fn()} disabled isGenerating />);
		const button = screen.getByRole("button", {
			name: "Generating response",
		});
		expect(button.querySelector("svg.animate-spin")).toBeInTheDocument();
	});

	it("does not render a mic button when enableVoiceInput is left off", () => {
		render(<ChatInput onSend={vi.fn()} />);
		expect(
			screen.queryByRole("button", { name: "Record" }),
		).not.toBeInTheDocument();
	});

	it("does not render a mic button when the browser has no SpeechRecognition support", () => {
		render(<ChatInput onSend={vi.fn()} enableVoiceInput />);
		expect(
			screen.queryByRole("button", { name: "Record" }),
		).not.toBeInTheDocument();
	});

	describe("voice input, with SpeechRecognition support", () => {
		class FakeSpeechRecognition {
			continuous = false;
			interimResults = false;
			lang = "";
			onstart: (() => void) | null = null;
			onresult: ((event: unknown) => void) | null = null;
			onerror: (() => void) | null = null;
			onend: (() => void) | null = null;
			start = vi.fn(() => this.onstart?.());
			stop = vi.fn(() => this.onend?.());

			constructor() {
				lastInstance = this;
			}
		}
		let lastInstance: FakeSpeechRecognition;

		beforeEach(() => {
			// biome-ignore lint/suspicious/noExplicitAny: test stub for a browser API not in jsdom
			(window as any).SpeechRecognition = FakeSpeechRecognition;
		});

		afterEach(() => {
			// biome-ignore lint/suspicious/noExplicitAny: cleanup for the test stub above
			delete (window as any).SpeechRecognition;
		});

		it("renders a mic button and starts listening on click", async () => {
			const user = userEvent.setup();
			render(<ChatInput onSend={vi.fn()} enableVoiceInput />);

			await user.click(screen.getByRole("button", { name: "Record" }));

			expect(lastInstance.start).toHaveBeenCalled();
			expect(
				screen.getByRole("button", { name: "Stop recording" }),
			).toBeInTheDocument();
		});

		it("appends a finalized transcript to the textarea", async () => {
			const user = userEvent.setup();
			render(<ChatInput onSend={vi.fn()} enableVoiceInput />);

			await user.click(screen.getByRole("button", { name: "Record" }));
			await act(async () => {
				lastInstance.onresult?.({
					resultIndex: 0,
					results: [
						{ isFinal: true, 0: { transcript: "hello there" } },
					],
				});
			});

			expect(screen.getByPlaceholderText("Message...")).toHaveValue(
				"hello there",
			);
		});

		it("stops listening on a second click", async () => {
			const user = userEvent.setup();
			render(<ChatInput onSend={vi.fn()} enableVoiceInput />);

			const button = screen.getByRole("button", { name: "Record" });
			await user.click(button);
			await user.click(
				screen.getByRole("button", { name: "Stop recording" }),
			);

			expect(lastInstance.stop).toHaveBeenCalled();
			expect(
				screen.getByRole("button", { name: "Record" }),
			).toBeInTheDocument();
		});
	});

	it("renders trailingActions in the control row alongside Send", () => {
		render(
			<ChatInput
				onSend={vi.fn()}
				trailingActions={<button type="button">Pick engine</button>}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Pick engine" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Send" }),
		).toBeInTheDocument();
	});
});
