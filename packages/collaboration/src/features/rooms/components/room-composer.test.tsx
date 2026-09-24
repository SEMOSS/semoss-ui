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

vi.mock("@/features/agents/api/use-agent-resources", () => ({
	useAgentResources: (kind: "KNOWLEDGE" | "TOOLBOX" | null) => ({
		resources:
			kind === "KNOWLEDGE"
				? [
						{
							id: "knowledge-1",
							name: "Room knowledge",
							type: "VECTOR",
							description: "Room reference material",
						},
						{
							id: "agent-knowledge",
							name: "Agent handbook",
							type: "VECTOR",
							description: "Inherited reference material",
						},
					]
				: [
						{
							id: "toolbox-1",
							name: "Room toolbox",
							type: "PROJECT",
							description: "Room actions",
						},
					],
		isLoading: false,
		error: null,
		hasMore: false,
		next: vi.fn(),
		refresh: vi.fn(),
	}),
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
	roomSettings: { instructions: "", mcp: [] },
	inheritedMcp: [],
	onModelChange: vi.fn(async () => undefined),
	onSaveRoomSettings: vi.fn(async () => undefined),
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

	it("accepts caller-owned layout classes and toolbar controls", () => {
		const { container } = renderComposer({
			className: "w-full",
			inputClassName: "min-h-48",
			children: <button type="button">Custom control</button>,
			onSent: undefined,
		});

		expect(
			container.querySelector('[data-slot="room-composer"]'),
		).toHaveClass("w-full");
		expect(
			screen.getByRole("textbox", { name: "Message Research agent" }),
		).toHaveClass("min-h-48");
		expect(
			screen
				.getByRole("textbox", { name: "Message Research agent" })
				.closest("fieldset"),
		).toHaveClass("rounded-md", "border-input");
		expect(
			screen.getByRole("button", { name: "Open composer actions" }),
		).toBeInTheDocument();
		const customControl = screen.getByRole("button", {
			name: "Custom control",
		});
		const modelSelect = screen.getByRole("button", {
			name: "Choose model",
		});
		expect(modelSelect).toHaveTextContent("Text model");
		const toolbar = screen.getByRole("button", {
			name: "Open composer actions",
		}).parentElement;
		expect(toolbar).not.toHaveClass("border-t");
		expect(toolbar).toContainElement(customControl);
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

	it("can omit the built-in model selector", () => {
		renderComposer({ showModelSelector: false });

		expect(
			screen.queryByRole("button", { name: "Choose model" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("textbox", { name: "Message Research agent" }),
		).toBeInTheDocument();
	});

	it("opens attachment and room settings actions from the plus popover", async () => {
		const user = userEvent.setup();
		renderComposer();
		const input = screen.getByLabelText("Choose attachments");
		const inputClick = vi.spyOn(input, "click");
		const actions = screen.getByRole("button", {
			name: "Open composer actions",
		});

		await user.click(actions);
		expect(
			screen.getByRole("button", { name: "Attach files" }),
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Open settings" }),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Attach files" }));
		await waitFor(() => expect(inputClick).toHaveBeenCalledOnce());
		expect(
			screen.queryByRole("button", { name: "Open settings" }),
		).not.toBeInTheDocument();

		await user.click(actions);
		await user.click(screen.getByRole("button", { name: "Open settings" }));
		expect(
			screen.getByRole("dialog", { name: "Room settings" }),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		await waitFor(() => expect(actions).toHaveFocus());
	});

	it("supports keyboard dismissal of the composer actions", async () => {
		const user = userEvent.setup();
		renderComposer();
		const actions = screen.getByRole("button", {
			name: "Open composer actions",
		});

		await waitFor(() =>
			expect(
				screen.getByRole("textbox", {
					name: "Message Research agent",
				}),
			).toHaveFocus(),
		);
		act(() => actions.focus());
		expect(actions).toHaveFocus();
		await user.keyboard("{Enter}");
		expect(
			screen.getByRole("button", { name: "Attach files" }),
		).toBeVisible();
		await user.keyboard("{Escape}");

		expect(
			screen.queryByRole("button", { name: "Attach files" }),
		).not.toBeInTheDocument();
		expect(actions).toHaveFocus();
	});

	it.each(["dialog", "drawer"] as const)(
		"discards an unsaved settings draft when the %s is reopened",
		async (settingsPresentation) => {
			const user = userEvent.setup();
			renderComposer({ settingsPresentation });
			const actions = screen.getByRole("button", {
				name: "Open composer actions",
			});

			await user.click(actions);
			await user.click(
				screen.getByRole("button", { name: "Open settings" }),
			);
			await user.type(
				screen.getByRole("textbox", { name: "Instructions" }),
				"Unsaved prompt",
			);
			await user.click(screen.getByRole("button", { name: "Cancel" }));

			await user.click(actions);
			await user.click(
				screen.getByRole("button", { name: "Open settings" }),
			);
			expect(
				screen.getByRole("textbox", { name: "Instructions" }),
			).toHaveValue("");
		},
	);

	it.each(["dialog", "drawer"] as const)(
		"closes the single %s from a picker view and discards its draft",
		async (settingsPresentation) => {
			const user = userEvent.setup();
			renderComposer({ settingsPresentation });
			const actions = screen.getByRole("button", {
				name: "Open composer actions",
			});

			await user.click(actions);
			await user.click(
				screen.getByRole("button", { name: "Open settings" }),
			);
			await user.type(
				screen.getByRole("textbox", { name: "Instructions" }),
				"Discard this prompt",
			);
			await user.click(
				screen.getByRole("button", { name: "Add knowledge" }),
			);
			await user.click(
				screen.getByRole("checkbox", { name: /Room knowledge/ }),
			);
			expect(screen.getAllByRole("dialog")).toHaveLength(1);

			await user.keyboard("{Escape}");
			await waitFor(() =>
				expect(
					screen.queryByRole("dialog", { name: "Add knowledge" }),
				).not.toBeInTheDocument(),
			);
			expect(actions).toHaveFocus();

			await user.click(actions);
			await user.click(
				screen.getByRole("button", { name: "Open settings" }),
			);
			expect(
				screen.getByRole("textbox", { name: "Instructions" }),
			).toHaveValue("");
			expect(
				screen.queryByText("Room knowledge"),
			).not.toBeInTheDocument();
		},
	);

	it.each(["dialog", "drawer"] as const)(
		"prevents %s dismissal while a save is pending",
		async (settingsPresentation) => {
			const user = userEvent.setup();
			let finishSave: (() => void) | undefined;
			const onSaveRoomSettings = vi.fn(
				() =>
					new Promise<void>((resolve) => {
						finishSave = resolve;
					}),
			);
			renderComposer({ onSaveRoomSettings, settingsPresentation });
			const actions = screen.getByRole("button", {
				name: "Open composer actions",
			});

			await user.click(actions);
			await user.click(
				screen.getByRole("button", { name: "Open settings" }),
			);
			await user.click(
				screen.getByRole("button", { name: "Save settings" }),
			);
			expect(
				screen.getByRole("button", { name: /Saving…/ }),
			).toBeDisabled();
			expect(
				screen.getByRole("button", { name: "Cancel" }),
			).toBeDisabled();
			expect(
				screen.queryByRole("button", { name: "Close" }),
			).not.toBeInTheDocument();
			const overlay = document.querySelector(
				`[data-slot="${settingsPresentation === "drawer" ? "sheet" : "dialog"}-overlay"]`,
			);
			if (!overlay) throw new Error("Settings overlay is missing");
			fireEvent.pointerDown(overlay, { button: 0, ctrlKey: false });

			await user.keyboard("{Escape}");
			expect(
				screen.getByRole("dialog", { name: "Room settings" }),
			).toBeVisible();

			await act(async () => finishSave?.());
			await waitFor(() =>
				expect(
					screen.queryByRole("dialog", { name: "Room settings" }),
				).not.toBeInTheDocument(),
			);
			expect(actions).toHaveFocus();
		},
	);

	it("validates the room system prompt limit before saving", async () => {
		const user = userEvent.setup();
		const onSaveRoomSettings = vi.fn(async () => undefined);
		renderComposer({ onSaveRoomSettings });

		await user.click(
			screen.getByRole("button", { name: "Open composer actions" }),
		);
		await user.click(screen.getByRole("button", { name: "Open settings" }));
		const instructions = screen.getByRole("textbox", {
			name: "Instructions",
		});
		expect(instructions).toHaveAttribute("maxlength", "8000");
		expect(instructions).toHaveClass("max-h-64", "overflow-y-auto");
		fireEvent.change(instructions, {
			target: { value: "a".repeat(8_001) },
		});
		await user.click(screen.getByRole("button", { name: "Save settings" }));

		expect(
			await screen.findByText(
				"The room system prompt cannot exceed 8,000 characters.",
			),
		).toBeVisible();
		expect(onSaveRoomSettings).not.toHaveBeenCalled();
	});

	it.each(["dialog", "drawer"] as const)(
		"saves %s settings with room-only resources while locking inherited resources",
		async (settingsPresentation) => {
			const user = userEvent.setup();
			const onSaveRoomSettings = vi.fn(async () => undefined);
			renderComposer({
				settingsPresentation,
				onSaveRoomSettings,
				inheritedMcp: [
					{
						id: "agent-knowledge",
						name: "Agent handbook",
						type: "VECTOR",
					},
				],
			});

			await user.click(
				screen.getByRole("button", { name: "Open composer actions" }),
			);
			await user.click(
				screen.getByRole("button", { name: "Open settings" }),
			);
			expect(screen.getAllByRole("dialog")).toHaveLength(1);
			expect(screen.getByText("Agent handbook")).toBeVisible();
			expect(screen.getByText("From agent")).toBeVisible();
			expect(
				screen.queryByRole("button", { name: "Remove Agent handbook" }),
			).not.toBeInTheDocument();

			await user.type(
				screen.getByRole("textbox", { name: "Instructions" }),
				"Answer for this room.",
			);
			await user.click(
				screen.getByRole("button", { name: "Add knowledge" }),
			);
			expect(screen.getAllByRole("dialog")).toHaveLength(1);
			expect(
				screen.getByRole("dialog", { name: "Add knowledge" }),
			).toBeVisible();
			await waitFor(() =>
				expect(
					screen.getByRole("textbox", { name: "Search knowledge" }),
				).toHaveFocus(),
			);
			const inheritedKnowledge = screen.getByRole("checkbox", {
				name: /Agent handbook Included by agent/,
			});
			expect(inheritedKnowledge).toBeChecked();
			expect(inheritedKnowledge).toBeDisabled();
			await user.click(
				await screen.findByRole("checkbox", { name: /Room knowledge/ }),
			);
			await user.click(screen.getByRole("button", { name: "Done" }));
			await waitFor(() =>
				expect(
					screen.getByRole("button", { name: "Add knowledge" }),
				).toHaveFocus(),
			);
			expect(screen.getByText("Room knowledge")).toBeVisible();
			await user.click(
				screen.getByRole("button", { name: "Add toolboxes" }),
			);
			expect(screen.getAllByRole("dialog")).toHaveLength(1);
			expect(
				screen.getByRole("dialog", { name: "Add toolboxes" }),
			).toBeVisible();
			await user.click(
				await screen.findByRole("checkbox", { name: /Room toolbox/ }),
			);
			await user.click(
				screen.getByRole("button", { name: "Back to room settings" }),
			);
			await waitFor(() =>
				expect(
					screen.getByRole("button", { name: "Add toolboxes" }),
				).toHaveFocus(),
			);
			expect(screen.getByText("Room toolbox")).toBeVisible();
			await user.click(
				screen.getByRole("button", { name: "Save settings" }),
			);

			await waitFor(() =>
				expect(onSaveRoomSettings).toHaveBeenCalledWith({
					modelId: "model-1",
					temperature: null,
					instructions: "Answer for this room.",
					mcp: [
						{
							id: "knowledge-1",
							name: "Room knowledge",
							type: "VECTOR",
						},
						{
							id: "toolbox-1",
							name: "Room toolbox",
							type: "PROJECT",
						},
					],
				}),
			);
			expect(
				screen.queryByRole("dialog", { name: "Room settings" }),
			).not.toBeInTheDocument();
		},
	);

	it("lets room resources be removed and gives inherited duplicates precedence", async () => {
		const user = userEvent.setup();
		const onSaveRoomSettings = vi.fn(async () => undefined);
		renderComposer({
			onSaveRoomSettings,
			roomSettings: {
				instructions: "",
				mcp: [
					{
						id: "room-resource",
						name: "Room resource",
						type: "VECTOR",
					},
					{
						id: "shared-resource",
						name: "Old room copy",
						type: "VECTOR",
					},
				],
			},
			inheritedMcp: [
				{
					id: "shared-resource",
					name: "Agent resource",
					type: "VECTOR",
				},
			],
		});

		await user.click(
			screen.getByRole("button", { name: "Open composer actions" }),
		);
		await user.click(screen.getByRole("button", { name: "Open settings" }));
		expect(screen.getByText("Agent resource")).toBeVisible();
		expect(screen.queryByText("Old room copy")).not.toBeInTheDocument();
		await user.click(
			screen.getByRole("button", { name: "Remove Room resource" }),
		);
		await user.click(screen.getByRole("button", { name: "Save settings" }));

		await waitFor(() =>
			expect(onSaveRoomSettings).toHaveBeenCalledWith({
				modelId: "model-1",
				temperature: null,
				instructions: "",
				mcp: [],
			}),
		);
	});

	it.each(["dialog", "drawer"] as const)(
		"keeps the %s draft open when saving fails",
		async (settingsPresentation) => {
			const user = userEvent.setup();
			renderComposer({
				settingsPresentation,
				onSaveRoomSettings: vi.fn(async () => {
					throw new Error("Options unavailable");
				}),
			});
			await user.click(
				screen.getByRole("button", { name: "Open composer actions" }),
			);
			await user.click(
				screen.getByRole("button", { name: "Open settings" }),
			);
			const prompt = screen.getByRole("textbox", {
				name: "Instructions",
			});
			await user.type(prompt, "Keep this prompt");
			await user.click(
				screen.getByRole("button", { name: "Save settings" }),
			);

			expect(await screen.findByRole("alert")).toHaveTextContent(
				"Room settings could not be saved. Options unavailable",
			);
			expect(prompt).toHaveValue("Keep this prompt");
		},
	);

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
