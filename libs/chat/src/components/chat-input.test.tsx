import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatInput } from "./chat-input";

describe("ChatInput", () => {
	it("sends the trimmed text on Enter and clears the field", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<ChatInput onSubmit={onSubmit} />);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "  hello  ");
		await user.keyboard("{Enter}");

		expect(onSubmit).toHaveBeenCalledWith("hello");
		expect(textarea).toHaveValue("");
	});

	it("inserts a newline on Shift+Enter instead of sending", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<ChatInput onSubmit={onSubmit} />);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "line one");
		await user.keyboard("{Shift>}{Enter}{/Shift}");
		await user.type(textarea, "line two");

		expect(onSubmit).not.toHaveBeenCalled();
		expect(textarea).toHaveValue("line one\nline two");
	});

	it("sends on clicking the Send button", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<ChatInput onSubmit={onSubmit} />);

		await user.type(screen.getByPlaceholderText("Message..."), "hi");
		await user.click(screen.getByRole("button", { name: "Send" }));

		expect(onSubmit).toHaveBeenCalledWith("hi");
	});

	it("does not send empty or whitespace-only input", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<ChatInput onSubmit={onSubmit} />);

		await user.type(screen.getByPlaceholderText("Message..."), "   ");
		await user.keyboard("{Enter}");

		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("shows attached file chips in the composer", () => {
		render(<ChatInput onSubmit={vi.fn()} />);

		const textarea = screen.getByPlaceholderText("Message...");
		const file = new File(["hello"], "receipt.pdf", {
			type: "application/pdf",
		});

		fireEvent.paste(textarea, {
			clipboardData: {
				files: [file],
			},
		});

		expect(screen.getByText("receipt.pdf")).toBeInTheDocument();
	});

	it("disables the textarea and button, and blocks sending, when disabled", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<ChatInput onSubmit={onSubmit} disabled />);

		expect(screen.getByPlaceholderText("Message...")).toBeDisabled();
		expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

		await user.keyboard("{Enter}");
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("supports controlled value/onValueChange for composing with a PromptOptimizer", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		const { rerender } = render(
			<ChatInput
				onSubmit={vi.fn()}
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
				onSubmit={vi.fn()}
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
		const onSubmit = vi.fn();
		const onValueChange = vi.fn();
		render(
			<ChatInput
				onSubmit={onSubmit}
				value="hi"
				onValueChange={onValueChange}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Send" }));

		expect(onSubmit).toHaveBeenCalledWith("hi");
		expect(onValueChange).toHaveBeenLastCalledWith("");
	});

	it("shows a spinner instead of the Send icon while isGenerating", () => {
		render(<ChatInput onSubmit={vi.fn()} disabled isGenerating />);
		const button = screen.getByRole("button", {
			name: "Generating response",
		});
		expect(button.querySelector("svg.animate-spin")).toBeInTheDocument();
	});

	it("does not render a mic button when enableVoiceInput is left off", () => {
		render(<ChatInput onSubmit={vi.fn()} />);
		expect(
			screen.queryByRole("button", { name: "Record" }),
		).not.toBeInTheDocument();
	});

	it("does not render a mic button when the browser has no SpeechRecognition support", () => {
		render(<ChatInput onSubmit={vi.fn()} enableVoiceInput />);
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
			render(<ChatInput onSubmit={vi.fn()} enableVoiceInput />);

			await user.click(screen.getByRole("button", { name: "Record" }));

			expect(lastInstance.start).toHaveBeenCalled();
			expect(
				screen.getByRole("button", { name: "Stop recording" }),
			).toBeInTheDocument();
		});

		it("appends a finalized transcript to the textarea", async () => {
			const user = userEvent.setup();
			render(<ChatInput onSubmit={vi.fn()} enableVoiceInput />);

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
			render(<ChatInput onSubmit={vi.fn()} enableVoiceInput />);

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
				onSubmit={vi.fn()}
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

	it("does not render a slash-command button trigger", () => {
		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				slashCommands={[
					{
						id: "summarize",
						label: "/summarize",
					},
				]}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Slash commands" }),
		).not.toBeInTheDocument();
	});

	it("inserts a selected slash command into an empty composer", async () => {
		const user = userEvent.setup();
		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				slashCommands={[
					{
						id: "summarize",
						label: "Summarize",
						command: "/summarize",
						description: "Summarize selected data",
					},
				]}
			/>,
		);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "/s");
		await user.click(screen.getByText("/summarize"));

		expect(textarea).toHaveValue("/summarize ");
	});

	it("appends slash commands to existing composer text with spacing", async () => {
		const user = userEvent.setup();
		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				slashCommands={[{ id: "fix", label: "/fix", command: "fix" }]}
			/>,
		);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "please /f");
		await user.click(screen.getByText("/fix"));

		expect(textarea).toHaveValue("please /fix ");
	});

	it("fires onSlashCommandSelect after inserting a slash command", async () => {
		const user = userEvent.setup();
		const onSlashCommandSelect = vi.fn();
		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				onSlashCommandSelect={onSlashCommandSelect}
				slashCommands={[
					{ id: "help", label: "/help", command: "/help" },
				]}
			/>,
		);

		await user.type(screen.getByPlaceholderText("Message..."), "/h");
		await user.click(screen.getByText("/help"));

		expect(onSlashCommandSelect).toHaveBeenCalledWith({
			id: "help",
			label: "/help",
			command: "/help",
		});
	});

	it("hides hiddenInMenu commands until a query is typed", async () => {
		const user = userEvent.setup();
		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				slashCommands={[
					{ id: "knowledge", label: "/knowledge" },
					{
						id: "mcp",
						label: "/mcp",
						hiddenInMenu: true,
					},
				]}
			/>,
		);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "/");
		expect(screen.getByText("/knowledge")).toBeInTheDocument();
		expect(screen.queryByText("/mcp")).not.toBeInTheDocument();

		await user.type(textarea, "m");
		expect(screen.getByText("/mcp")).toBeInTheDocument();
	});

	it("executes noChip commands immediately without inserting text", async () => {
		const user = userEvent.setup();
		const onExecute = vi.fn();
		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				slashCommands={[
					{
						id: "settings",
						label: "/settings",
						noChip: true,
						onExecute,
					},
				]}
			/>,
		);

		await user.type(screen.getByPlaceholderText("Message..."), "/s");
		await user.click(screen.getByText("/settings"));

		expect(onExecute).toHaveBeenCalledTimes(1);
		expect(screen.getByPlaceholderText("Message...")).toHaveValue("");
	});

	it("opens the slash menu while typing a trailing slash query", async () => {
		const user = userEvent.setup();
		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				slashCommands={[
					{ id: "knowledge", label: "/knowledge" },
					{ id: "toolbox", label: "/toolbox" },
				]}
			/>,
		);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "/k");

		expect(screen.getByText("/knowledge")).toBeInTheDocument();
		expect(screen.queryByText("/toolbox")).not.toBeInTheDocument();
		expect(
			screen.queryByPlaceholderText("Type a command..."),
		).not.toBeInTheDocument();
		expect(document.activeElement).toBe(textarea);
	});

	it("replaces a typed slash query when selecting with Enter", async () => {
		const user = userEvent.setup();
		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				slashCommands={[
					{ id: "knowledge", label: "/knowledge" },
					{ id: "toolbox", label: "/toolbox" },
				]}
			/>,
		);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "please /kn");
		await user.keyboard("{Enter}");

		expect(textarea).toHaveValue("please /knowledge ");
	});

	it("executes typed noChip commands on Enter without inserting text", async () => {
		const user = userEvent.setup();
		const onExecute = vi.fn();
		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				slashCommands={[
					{
						id: "settings",
						label: "/settings",
						noChip: true,
						onExecute,
					},
				]}
			/>,
		);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "/s");
		await user.keyboard("{Enter}");

		expect(onExecute).toHaveBeenCalledTimes(1);
		expect(textarea).toHaveValue("");
	});

	it("enables the playground default command set when defaultSlashCommandActions is provided", async () => {
		const user = userEvent.setup();
		const onOpenMcpOverlay = vi.fn();
		const onCompact = vi.fn();
		const onAttachDocument = vi.fn();
		const onOpenSettings = vi.fn();

		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				defaultSlashCommandActions={{
					onOpenMcpOverlay,
					onCompact,
					onAttachDocument,
					onOpenSettings,
				}}
			/>,
		);

		await user.type(screen.getByPlaceholderText("Message..."), "/k");
		await user.click(screen.getByText("/knowledge"));

		expect(onOpenMcpOverlay).toHaveBeenCalledWith("KNOWLEDGE");
		expect(screen.getByPlaceholderText("Message...")).toHaveValue("");
	});

	it("merges custom slashCommands with defaults by id and appends new ids", async () => {
		const user = userEvent.setup();
		const onOpenMcpOverlay = vi.fn();
		const onCompact = vi.fn();
		const onAttachDocument = vi.fn();
		const onOpenSettings = vi.fn();
		const onCustomCompact = vi.fn();

		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				defaultSlashCommandActions={{
					onOpenMcpOverlay,
					onCompact,
					onAttachDocument,
					onOpenSettings,
				}}
				slashCommands={[
					{
						id: "compact",
						label: "/compact",
						noChip: true,
						onExecute: onCustomCompact,
					},
					{ id: "custom", label: "/custom", noChip: true },
				]}
			/>,
		);

		await user.type(screen.getByPlaceholderText("Message..."), "/c");
		expect(screen.getByText("/custom")).toBeInTheDocument();

		await user.click(screen.getByText("/compact"));

		expect(onCustomCompact).toHaveBeenCalledTimes(1);
		expect(onCompact).not.toHaveBeenCalled();
	});

	it("can disable specific default commands without redefining them", async () => {
		const user = userEvent.setup();
		const onOpenMcpOverlay = vi.fn();
		const onCompact = vi.fn();
		const onAttachDocument = vi.fn();
		const onOpenSettings = vi.fn();

		render(
			<ChatInput
				onSubmit={vi.fn()}
				useSlashCommands
				defaultSlashCommandActions={{
					onOpenMcpOverlay,
					onCompact,
					onAttachDocument,
					onOpenSettings,
				}}
				disableDefaultSlashCommandIds={["agent"]}
			/>,
		);

		await user.type(screen.getByPlaceholderText("Message..."), "/a");

		expect(screen.getByText("/agent")).toBeInTheDocument();
		const agentItem = screen.getByText("/agent").closest("[cmdk-item]");
		expect(agentItem).not.toBeNull();
		if (agentItem) {
			expect(agentItem).toHaveAttribute("data-disabled", "true");
		}

		await user.click(screen.getByText("/agent"));
		expect(onOpenMcpOverlay).not.toHaveBeenCalledWith("AGENT");
	});

	it("shows built-in defaults when useSlashCommands is true", async () => {
		const user = userEvent.setup();
		render(<ChatInput onSubmit={vi.fn()} useSlashCommands />);

		const textarea = screen.getByPlaceholderText("Message...");
		await user.type(textarea, "/");

		expect(screen.getByText("/compact")).toBeInTheDocument();
		expect(screen.getByText("/document")).toBeInTheDocument();
	});
});
