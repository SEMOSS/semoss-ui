import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import type { Engine } from "@semoss/shared";
import { TooltipProvider } from "@semoss/ui/next";
import { RoomComposer } from "./room-composer";

const engineSelectSpy = vi.hoisted(() => vi.fn());

vi.mock("@semoss/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/shared")>()),
	EngineSelect: (props: {
		name: string;
		disabled?: boolean;
		engineTypes?: string[];
		metaFilters?: unknown[];
		onChange: (engine: Engine) => void;
	}) => {
		engineSelectSpy(props);
		return (
			<button
				type="button"
				disabled={props.disabled}
				aria-label="Choose model"
			>
				{props.name}
			</button>
		);
	},
}));

const defaultProps: ComponentProps<typeof RoomComposer> = {
	agentName: "Research agent",
	isSubmitting: false,
	isRunning: false,
	isCancelling: false,
	modelId: "model-1",
	modelName: "Text model",
	isModelSaving: false,
	modelError: null,
	roomInstructions: "Research carefully.",
	onModelChange: vi.fn(async () => undefined),
	onOptimizePrompt: vi.fn(async (draft) => `Improved ${draft}`),
	onSend: vi.fn(async () => undefined),
	onStop: vi.fn(async () => undefined),
	onSent: vi.fn(),
};

function renderComposer(
	props: Partial<ComponentProps<typeof RoomComposer>> = {},
) {
	return render(
		<TooltipProvider>
			<RoomComposer {...defaultProps} {...props} />
		</TooltipProvider>,
	);
}

function pasteText(editor: HTMLElement, text: string) {
	fireEvent.paste(editor, {
		clipboardData: {
			items: [],
			types: ["text/plain"],
			getData: (type: string) => (type === "text/plain" ? text : ""),
		},
	});
}

describe("RoomComposer", () => {
	beforeAll(() => {
		HTMLElement.prototype.hasPointerCapture = () => false;
		HTMLElement.prototype.releasePointerCapture = vi.fn();
	});

	beforeEach(() => {
		engineSelectSpy.mockClear();
		window.SpeechRecognition = undefined;
		window.webkitSpeechRecognition = undefined;
	});

	it("focuses the composer when a fresh room opens", async () => {
		renderComposer();

		await waitFor(() =>
			expect(
				screen.getByRole("textbox", {
					name: "Message Research agent",
				}),
			).toHaveFocus(),
		);
	});

	it("renders the full composer in its larger landing layout", () => {
		renderComposer({
			variant: "landing",
			agentId: "research-agent",
			agentOptions: [
				{ id: "research-agent", name: "Research agent" },
				{ id: "writing-agent", name: "Writing agent" },
			],
			onAgentChange: vi.fn(),
			onSent: undefined,
		});

		expect(
			screen.getByRole("textbox", { name: "Message Research agent" }),
		).toHaveClass("min-h-48");
		expect(
			screen
				.getByRole("textbox", { name: "Message Research agent" })
				.closest("fieldset"),
		).toHaveClass("rounded-md", "border-input", "shadow-lg");
		expect(
			screen.getByRole("button", { name: "Attach files" }),
		).toBeInTheDocument();
		const agentSelect = screen.getByRole("combobox", {
			name: "Choose agent",
		});
		const modelSelect = screen.getByRole("button", {
			name: "Choose model",
		});
		expect(agentSelect).toHaveTextContent("Research agent");
		expect(modelSelect).toHaveTextContent("Text model");
		const toolbar = screen.getByRole("button", {
			name: "Attach files",
		}).parentElement;
		expect(toolbar).not.toHaveClass("border-t");
		expect(toolbar).toContainElement(agentSelect);
		expect(toolbar).toContainElement(modelSelect);
		expect(
			screen.getByRole("button", { name: "Optimize prompt" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", {
				name: "Send message to Research agent",
			}),
		).toBeInTheDocument();
	});

	it("changes the landing agent from the composer toolbar", async () => {
		const user = userEvent.setup();
		const onAgentChange = vi.fn();
		renderComposer({
			variant: "landing",
			agentId: "research-agent",
			agentOptions: [
				{ id: "research-agent", name: "Research agent" },
				{ id: "writing-agent", name: "Writing agent" },
			],
			onAgentChange,
		});

		await user.click(
			screen.getByRole("combobox", { name: "Choose agent" }),
		);
		await user.click(
			await screen.findByRole("option", { name: "Writing agent" }),
		);

		expect(onAgentChange).toHaveBeenCalledWith("writing-agent");
	});

	it("can move the model selector outside the landing composer", () => {
		renderComposer({ variant: "landing", showModelSelector: false });

		expect(
			screen.queryByRole("button", { name: "Choose model" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("textbox", { name: "Message Research agent" }),
		).toBeInTheDocument();
	});

	it("submits with Enter, keeps Shift+Enter as a newline, and ignores IME Enter", async () => {
		const user = userEvent.setup();
		const onSend = vi.fn(async () => undefined);
		renderComposer({ onSend });
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});

		await user.click(editor);
		pasteText(editor, "first line\nsecond line");
		await user.keyboard("{Shift>}{Enter}{/Shift}");
		expect(onSend).not.toHaveBeenCalled();
		expect(editor).toHaveTextContent("first line");
		expect(editor).toHaveTextContent("second line");

		fireEvent.keyDown(editor, {
			key: "Enter",
			code: "Enter",
			keyCode: 229,
			isComposing: true,
		});
		expect(onSend).not.toHaveBeenCalled();

		await user.keyboard("{Enter}");
		await waitFor(() =>
			expect(onSend).toHaveBeenCalledWith({
				text: "first line\nsecond line",
				files: [],
			}),
		);
	});

	it("requires text, prevents duplicate submissions, and restores a failed draft", async () => {
		const user = userEvent.setup();
		let rejectSend: (cause: Error) => void = () => undefined;
		const onSend = vi.fn(
			() =>
				new Promise<void>((_, reject) => {
					rejectSend = reject;
				}),
		);
		renderComposer({ onSend });
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		const send = screen.getByRole("button", {
			name: "Send message to Research agent",
		});
		const attachment = new File(["contents"], "draft.txt", {
			type: "text/plain",
		});

		expect(send).toBeDisabled();
		fireEvent.change(screen.getByLabelText("Choose attachments"), {
			target: { files: [attachment] },
		});
		await user.click(editor);
		pasteText(editor, "Keep this draft");
		await user.keyboard("{Enter}{Enter}");
		expect(onSend).toHaveBeenCalledTimes(1);

		rejectSend(new Error("Upload failed"));
		await waitFor(() =>
			expect(editor).toHaveTextContent("Keep this draft"),
		);
		expect(
			screen.getByRole("button", { name: "Remove draft.txt" }),
		).toBeInTheDocument();
		expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
	});

	it("requires a selected model before enabling Send", async () => {
		const user = userEvent.setup();
		const onSend = vi.fn(async () => undefined);
		renderComposer({ modelId: "", modelName: "Select model", onSend });
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		await user.click(editor);
		pasteText(editor, "Ready to send");

		expect(
			screen.getByRole("button", {
				name: "Send message to Research agent",
			}),
		).toBeDisabled();
		await user.keyboard("{Enter}");
		expect(onSend).not.toHaveBeenCalled();
	});

	it("can disable Send while the selected agent is loading", async () => {
		const user = userEvent.setup();
		const onSend = vi.fn(async () => undefined);
		renderComposer({ isSendDisabled: true, onSend });
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		await user.click(editor);
		pasteText(editor, "Wait for the agent");

		await waitFor(() =>
			expect(
				screen.getByRole("button", {
					name: "Send message to Research agent",
				}),
			).toBeDisabled(),
		);
		await user.keyboard("{Enter}");
		expect(onSend).not.toHaveBeenCalled();
	});

	it("locks a created room's model without blocking a submission retry", async () => {
		const user = userEvent.setup();
		const onSend = vi.fn(async () => undefined);
		renderComposer({ isModelLocked: true, onSend });
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		await user.click(editor);
		pasteText(editor, "Retry this submission");

		expect(
			screen.getByRole("button", { name: "Choose model" }),
		).toBeDisabled();
		await waitFor(() =>
			expect(
				screen.getByRole("button", {
					name: "Send message to Research agent",
				}),
			).toBeEnabled(),
		);
		await user.keyboard("{Enter}");
		await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
	});

	it("limits the editor to 8,000 characters", async () => {
		const user = userEvent.setup();
		renderComposer();
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		await user.click(editor);
		pasteText(editor, "a".repeat(8_001));

		await waitFor(() => expect(editor.textContent).toHaveLength(8_000));
	});

	it("adds and removes picker, drop, and clipboard attachments within limits", async () => {
		const user = userEvent.setup();
		renderComposer();
		const input = screen.getByLabelText("Choose attachments");
		const document = new File(["document"], "brief.txt", {
			type: "text/plain",
		});
		const dropped = new File(["dropped"], "notes.pdf", {
			type: "application/pdf",
		});

		fireEvent.change(input, { target: { files: [document] } });
		expect(
			await screen.findByRole("button", { name: "Remove brief.txt" }),
		).toBeInTheDocument();

		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		fireEvent.drop(editor.closest("fieldset") as HTMLElement, {
			dataTransfer: { files: [dropped] },
		});
		expect(
			await screen.findByRole("button", { name: "Remove notes.pdf" }),
		).toBeInTheDocument();

		fireEvent.paste(editor, {
			clipboardData: {
				items: [
					{
						kind: "file",
						getAsFile: () =>
							new File(["clipboard"], "clipboard.txt", {
								type: "text/plain",
							}),
					},
				],
				getData: () => "",
			},
		});
		expect(
			await screen.findByRole("button", { name: "Remove clipboard.txt" }),
		).toBeInTheDocument();

		await user.click(
			screen.getByRole("button", { name: "Remove brief.txt" }),
		);
		expect(
			screen.queryByRole("button", { name: "Remove brief.txt" }),
		).not.toBeInTheDocument();
	});

	it("rejects attachment count and size violations", async () => {
		const { rerender } = renderComposer();
		const input = screen.getByLabelText("Choose attachments");
		fireEvent.change(input, {
			target: {
				files: Array.from(
					{ length: 6 },
					(_, index) => new File(["x"], `file-${index}.txt`),
				),
			},
		});
		expect(screen.getByRole("alert")).toHaveTextContent(
			"You can attach up to five files.",
		);

		rerender(
			<TooltipProvider>
				<RoomComposer {...defaultProps} />
			</TooltipProvider>,
		);
		const large = new File(["x"], "large.bin");
		Object.defineProperty(large, "size", { value: 10 * 1024 * 1024 + 1 });
		fireEvent.change(screen.getByLabelText("Choose attachments"), {
			target: { files: [large] },
		});
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Each attachment must be 10 MiB or smaller.",
		);
	});

	it("offers only text-generation models and moves cancellation into the composer", () => {
		const onStop = vi.fn(async () => undefined);
		const { rerender } = renderComposer({ isRunning: true, onStop });
		const engineProps = engineSelectSpy.mock.calls.at(-1)?.[0];
		expect(engineProps.engineTypes).toEqual(["MODEL"]);
		expect(engineProps.metaFilters).toEqual([{ tag: "text-generation" }]);
		expect(
			screen.getByRole("button", { name: "Choose model" }),
		).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Stop response" }));
		expect(onStop).toHaveBeenCalledTimes(1);

		rerender(
			<TooltipProvider>
				<RoomComposer
					{...defaultProps}
					isRunning
					isCancelling
					onStop={onStop}
				/>
			</TooltipProvider>,
		);
		expect(
			screen.getByRole("button", { name: "Cancelling turn" }),
		).toBeDisabled();
	});

	it("shows only collaboration's attachment and optimize slash actions", async () => {
		const user = userEvent.setup();
		renderComposer();
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		await user.click(editor);
		pasteText(editor, "/");

		expect(await screen.findByText("/document")).toBeInTheDocument();
		expect(screen.getByText("/optimize")).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Open prompt library" }),
		).not.toBeInTheDocument();
		for (const prohibited of [
			"/agent",
			"/harness",
			"/mode",
			"/prompts",
			"/knowledge",
			"/toolbox",
			"/settings",
			"/compact",
		]) {
			expect(screen.queryByText(prohibited)).not.toBeInTheDocument();
		}
	});

	it("operates slash actions from the keyboard", async () => {
		const user = userEvent.setup();
		renderComposer();
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		await user.click(editor);
		pasteText(editor, "/");
		await screen.findByText("/document");
		await user.keyboard("{ArrowDown}{Enter}");

		expect(screen.queryByText("/document")).not.toBeInTheDocument();
		expect(editor.textContent).toBe("");
	});

	it("removes the slash token before optimizing", async () => {
		const user = userEvent.setup();
		const onOptimizePrompt = vi.fn(async () => "Improved prompt");
		renderComposer({ onOptimizePrompt });
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		await user.click(editor);
		pasteText(editor, "improve me /optimize");
		await screen.findByText("/optimize");
		await user.keyboard("{Enter}");

		await waitFor(() =>
			expect(onOptimizePrompt).toHaveBeenCalledWith(
				"improve me",
				"Research carefully.",
			),
		);
	});

	it("optimizes and reverts a prompt", async () => {
		const user = userEvent.setup();
		renderComposer();
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		await user.click(editor);
		pasteText(editor, "draft");
		await user.click(
			screen.getByRole("button", { name: "Optimize prompt" }),
		);
		await waitFor(() => expect(editor).toHaveTextContent("Improved draft"));
		await user.click(
			screen.getByRole("button", { name: "Revert optimized prompt" }),
		);
		await waitFor(() => expect(editor).toHaveTextContent("draft"));
	});

	it("preserves the draft when optimization fails", async () => {
		const user = userEvent.setup();
		renderComposer({
			onOptimizePrompt: vi.fn(async () => {
				throw new Error("Optimizer unavailable");
			}),
		});
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		await user.click(editor);
		pasteText(editor, "original draft");
		await user.click(
			screen.getByRole("button", { name: "Optimize prompt" }),
		);

		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Optimizer unavailable",
			),
		);
		expect(editor).toHaveTextContent("original draft");
	});

	it("appends final speech transcripts and returns focus after stopping", async () => {
		const user = userEvent.setup();
		class TestRecognition extends EventTarget implements SpeechRecognition {
			static instance: TestRecognition;
			continuous = false;
			interimResults = false;
			lang = "";
			onstart: (() => void) | null = null;
			onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
			onerror: ((event: SpeechRecognitionErrorEvent) => void) | null =
				null;
			onend: (() => void) | null = null;

			constructor() {
				super();
				TestRecognition.instance = this;
			}

			start() {
				this.onstart?.();
			}

			stop() {
				this.onend?.();
			}
		}
		window.SpeechRecognition = TestRecognition;
		renderComposer();
		const editor = screen.getByRole("textbox", {
			name: "Message Research agent",
		});
		await user.click(
			screen.getByRole("button", { name: "Start dictation" }),
		);
		act(() => {
			TestRecognition.instance.onresult?.({
				resultIndex: 0,
				results: Object.assign(
					[
						Object.assign([{ transcript: "spoken words" }], {
							isFinal: true,
						}),
					],
					{ item: () => null },
				) as unknown as SpeechRecognitionResultList,
			} as SpeechRecognitionEvent);
		});
		await waitFor(() => expect(editor).toHaveTextContent("spoken words"));
		await user.click(
			screen.getByRole("button", { name: "Stop dictation" }),
		);
		await waitFor(() => expect(editor).toHaveFocus());
		window.SpeechRecognition = undefined;
	});
});
