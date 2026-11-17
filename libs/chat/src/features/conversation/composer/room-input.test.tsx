import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { fakeStore } from "../../../test/fake-store";
import type { RoomStore } from "../../room/store/room.store";
import type { MCPOverlay } from "../../tools/mcp/mcp-overlay";
import { ContextItemsStore } from "../attachments/context-items.store";
import { RoomInput, type RoomInputVariant } from "./room-input";
import type { ComposerSession } from "./use-composer-session";

// ---------------------------------------------------------------------------
// Fake editor state shared between mocks
// ---------------------------------------------------------------------------
const openFilePicker = vi.hoisted(() => vi.fn());
// stable, as the SDK's are, so views keep the same logins between renders
const sessionLogins = vi.hoisted(() => ({
	logins: {},
	accountIds: {},
	primaryLogin: null,
	connectorAccess: null,
	availableProviders: [],
	status: "ready" as const,
	refresh: vi.fn(),
	connect: vi.fn(),
	disconnect: vi.fn(),
}));
let fakeEditorText = "";
let triggerOnChange: (() => void) | null = null;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// the slash menu's commands have their own tests; the composer only hands them on
vi.mock("./use-room-slash-commands", () => ({
	useRoomSlashCommands: () => [],
}));

// the session's logins, without reading them from a server
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useLogins: () => sessionLogins,
}));
vi.mock("@semoss/i18n", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/i18n")>();
	return {
		...actual,
		useTranslation: () => ({
			t: (key: string) => {
				const map: Record<string, string> = {
					"input.ariaPlaceholder": "Enter text",
					"input.askLabel": "Ask the AI",
					"input.thinking": "Thinking...",
					"input.menuPrompt": "What do you want to do today?",
				};
				return map[key] ?? key;
			},
			i18n: { language: "en" },
		}),
	};
});

vi.mock("../attachments/file-drop.context", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("../attachments/file-drop.context")
		>();
	return {
		...actual,
		useFileDrop: () => ({
			isDragging: false,
			files: [],
			addFiles: vi.fn(),
			removeFile: vi.fn(),
			clearFiles: vi.fn(),
			openFilePicker,
		}),
	};
});

const featureFlags: Record<string, boolean> = {};
vi.mock("../../chat/config/use-chat-config", () => ({
	useChatConfig: () => ({
		theme: { featureFlags, defaultCompactionStrategy: "AUTO" },
	}),
}));
vi.mock("./use-graceful-errors", () => ({
	useGracefulErrors: () => ({
		getGracefulErrorMessage: (error: Error) => error.message,
	}),
}));
const CHAT = vi.hoisted(() => ({
	models: { contextWindow: 0 },
	getSnapshot() {
		return this;
	},
	subscribe: () => () => {},
}));
vi.mock("../../chat/provider/use-chat-session", () => ({
	// a fixed chat store: its snapshot is itself
	useChatSession: () => ({ chat: CHAT }),
}));
vi.mock("../../workbench/rail/use-sidebar-panel-active", () => ({
	useSidebarPanelActive: () => false,
}));
vi.mock("./prompt-optimizer", () => ({
	PromptOptimizer: ({
		input,
		disabled,
	}: {
		input: string;
		disabled: boolean;
	}) => (
		<button
			type="button"
			disabled={disabled || !input}
			aria-label="Optimize prompt"
		/>
	),
}));
vi.mock("../../tools/mcp/mcp-overlay", () => ({
	MCPOverlay: ({
		open,
		defaultTab,
		onClose,
		values,
		agent,
	}: React.ComponentProps<typeof MCPOverlay>) =>
		open ? (
			<div
				role="dialog"
				aria-label={defaultTab}
				data-allow-default-agent={String(
					agent.kind === "saved" && agent.withModeChoice,
				)}
				data-default-agent={String(
					agent.kind === "savedOrDefault"
						? agent.isDefaultAgent
						: undefined,
				)}
			>
				<button type="button" onClick={() => onClose()}>
					Close picker
				</button>
				<button
					type="button"
					onClick={() =>
						onClose({
							mcp: values,
							workspace: { workspace_id: "alpha", name: "Alpha" },
						})
					}
				>
					Save agent
				</button>
				<button
					type="button"
					onClick={() =>
						onClose({
							mcp: values,
							workspace: null,
							isDefaultAgent: true,
						})
					}
				>
					Save Default Agent
				</button>
			</div>
		) : null,
}));

// Mock $getRoot so promptModel can read fakeEditorText
vi.mock("lexical", async (importOriginal) => {
	const actual = await importOriginal<typeof import("lexical")>();
	return {
		...actual,
		$getRoot: vi.fn(() => ({
			getTextContent: () => fakeEditorText,
			getChildren: () =>
				fakeEditorText
					? [
							{
								getTextContent: () => fakeEditorText,
								getChildren: () => [
									{ getTextContent: () => fakeEditorText },
								],
							},
						]
					: [],
			clear: vi.fn(() => {
				fakeEditorText = "";
			}),
			append: vi.fn((node: { text: string }) => {
				fakeEditorText = node.text;
			}),
			getFirstChild: () => ({
				insertBefore: (node: { text: string }) => {
					fakeEditorText = `${node.text}\n${fakeEditorText}`;
				},
			}),
		})),
		$createParagraphNode: vi.fn(() => ({
			text: "",
			append(node: string) {
				this.text = node;
			},
		})),
		$createTextNode: vi.fn((text: string) => text),
	};
});

// Mock EditorRefPlugin to inject a fake editor that uses fakeEditorText
vi.mock("@lexical/react/LexicalEditorRefPlugin", () => ({
	EditorRefPlugin: ({
		editorRef,
	}: {
		editorRef: React.MutableRefObject<unknown>;
	}) => {
		React.useEffect(() => {
			editorRef.current = {
				getEditorState: () => ({ read: (cb: () => void) => cb() }),
				update: (cb: () => void) => cb(),
				focus: vi.fn(),
				dispatchCommand: vi.fn(),
			};
		});
		return null;
	},
}));

// Mock OnChangePlugin to expose a trigger so tests can update isEmpty state
vi.mock("@lexical/react/LexicalOnChangePlugin", () => ({
	OnChangePlugin: ({
		onChange,
	}: {
		onChange: (state: { read: (cb: () => void) => void }) => void;
	}) => {
		triggerOnChange = () => onChange({ read: (cb) => cb() });
		React.useEffect(() => {
			triggerOnChange?.();
		}, []);
		return null;
	},
}));

// Mock EnterPlugin to listen for keydown directly (bypasses Lexical command system)
vi.mock("../../../components/lexical/enter-plugin", () => ({
	EnterPlugin: ({ onEnter }: { onEnter: () => void }) => {
		React.useEffect(() => {
			const handler = (e: KeyboardEvent) => {
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
					onEnter();
				}
			};
			document.addEventListener("keydown", handler);
			return () => document.removeEventListener("keydown", handler);
		}, [onEnter]);
		return null;
	},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Only these room fields are consumed by the composer in this test. */
const room = fakeStore({
	chatTools: {
		isAgentMode: false,
	},
	connectors: {
		// a fixed store: its snapshot is itself
		getSnapshot() {
			return this;
		},
		subscribe: () => () => {},
		services: [],
		availableSources: [],
		openSourcePanel: vi.fn(),
		missingSignIns: [],
		uncoveredConnectors: [],
		unofferedProviders: [],
		setSessionLogins: vi.fn(),
	},
	contextItems: new ContextItemsStore(),
	roomId: "room",
	history: [],
	options: {},
	agentTools: [],
	mode: "agent",
}) as unknown as RoomStore;

/**
 * A composer session, as an open room hands one in: an agent run with no
 * saved agent, which runs Default Agent, unless the overrides say otherwise.
 *
 * @param overrides - The fields that differ.
 */
function sessionWith(
	overrides: Partial<ComposerSession> = {},
): ComposerSession {
	return {
		model: null,
		options: {
			instructions: "",
			mcp: [],
			predefinedPrompts: [],
		},
		agentTools: [],
		isAgentMode: true,
		agent: { kind: "fixed" },
		onModelChange: vi.fn(),
		onOptionsChange: vi.fn(),
		...overrides,
	};
}

/** An open room's composer. */
const roomVariant: RoomInputVariant = {
	kind: "room",
	onStop: vi.fn(),
	onCompact: vi.fn(),
	hasOutstandingTools: false,
};

/**
 * A new chat's composer.
 *
 * @param overrides - The mode switches the test watches.
 */
function draftVariant(
	overrides: Partial<Extract<RoomInputVariant, { kind: "draft" }>> = {},
): RoomInputVariant {
	return {
		kind: "draft",
		onSwitchToAgentHarness: vi.fn(),
		onExitAgentHarness: vi.fn(),
		workbenchPanels: {
			room,
			newRoomPanels: {
				onOpenPanel: vi.fn(),
				isBusy: false,
				connectors: room.connectors,
			},
		},
		isSubmitDisabled: false,
		...overrides,
	};
}

const defaultProps = {
	isLoading: false,
	onPrompt: vi.fn(() => Promise.resolve(true)),
	session: sessionWith(),
	room,
	variant: roomVariant,
};

/** Set fake editor text and trigger the OnChangePlugin callback to update isEmpty */
function setEditorText(text: string) {
	fakeEditorText = text;
	act(() => triggerOnChange?.());
}

beforeEach(() => {
	openFilePicker.mockClear();
	fakeEditorText = "";
	triggerOnChange = null;
	for (const flag of Object.keys(featureFlags)) delete featureFlags[flag];
});

/** A saved agent, as the input shows one. */
const savedAgentOptions = (name: string) => ({
	...sessionWith().options,
	workspace: { workspace_id: "agent", name },
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("pressing Enter calls onPrompt with editor content", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));
	render(<RoomInput {...defaultProps} onPrompt={onPrompt} />);

	setEditorText("Hello world");

	fireEvent.keyDown(document, { key: "Enter", code: "Enter", bubbles: true });

	await vi.waitFor(() => expect(onPrompt).toHaveBeenCalledTimes(1));
	expect(onPrompt).toHaveBeenCalledWith("Hello world", []);
});

test("clicking send button calls onPrompt", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));
	render(<RoomInput {...defaultProps} onPrompt={onPrompt} />);

	setEditorText("Click send");

	const sendButton = screen.getByLabelText("Ask the AI");
	fireEvent.click(sendButton);

	await vi.waitFor(() => expect(onPrompt).toHaveBeenCalledTimes(1));
	expect(onPrompt).toHaveBeenCalledWith("Click send", []);
});

test("does not call onPrompt when loading", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));
	render(
		<RoomInput {...defaultProps} isLoading={true} onPrompt={onPrompt} />,
	);

	setEditorText("Should not send");

	fireEvent.keyDown(document, { key: "Enter", code: "Enter", bubbles: true });

	await new Promise((r) => setTimeout(r, 50));
	expect(onPrompt).not.toHaveBeenCalled();
});

test("shows toast when onPrompt returns false", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(false));
	toast.error = vi.fn();

	render(<RoomInput {...defaultProps} onPrompt={onPrompt} />);

	setEditorText("Will fail");

	const sendButton = screen.getByLabelText("Ask the AI");
	fireEvent.click(sendButton);

	await vi.waitFor(() => expect(toast.error).toHaveBeenCalled());
	expect(onPrompt).toHaveBeenCalledTimes(1);
});

test("restores a failed prompt before text typed while waiting", async () => {
	let finish: (result: boolean) => void = () => {};
	const onPrompt = vi.fn(
		() =>
			new Promise<boolean>((resolve) => {
				finish = resolve;
			}),
	);
	render(<RoomInput {...defaultProps} onPrompt={onPrompt} />);
	setEditorText("Original message");
	fireEvent.click(screen.getByLabelText("Ask the AI"));
	setEditorText("Next draft");
	fireEvent.keyDown(document, { key: "Enter" });
	expect(onPrompt).toHaveBeenCalledTimes(1);
	await act(async () => finish(false));
	expect(fakeEditorText).toBe("Original message\nNext draft");
});

test("stop delegates cancellation and never submits a message", () => {
	const onStop = vi.fn();
	const onPrompt = vi.fn();
	render(
		<RoomInput
			{...defaultProps}
			onPrompt={onPrompt}
			sendState="stop"
			variant={{ ...roomVariant, onStop }}
		/>,
	);
	fireEvent.click(screen.getByLabelText("input.stopLabel"));
	expect(onStop).toHaveBeenCalledTimes(1);
	expect(onPrompt).not.toHaveBeenCalled();
});

test("has one add menu and no standalone tools or mode chip", () => {
	render(<RoomInput {...defaultProps} />);
	expect(
		screen.getAllByRole("button", { name: "input.addToChat" }),
	).toHaveLength(1);
	expect(
		screen.queryByRole("button", { name: "menuUpload.attachDocument" }),
	).toBeNull();
	expect(screen.queryByText("modes.agent")).toBeNull();
	expect(screen.queryByText("studio.tools")).toBeNull();
	expect(screen.getByRole("button", { name: "input.record" })).toBeVisible();
});

test("shows only a selected agent next to add and opens its picker when editable", () => {
	render(
		<RoomInput
			{...defaultProps}
			session={sessionWith({
				options: savedAgentOptions("Example agent"),
				agent: { kind: "saved", withModeChoice: false },
			})}
			variant={draftVariant()}
		/>,
	);
	const agent = screen.getByRole("button", { name: "Example agent" });
	const add = screen.getByRole("button", { name: "input.addToChat" });
	expect(add.parentElement).toBe(agent.parentElement);
	fireEvent.click(agent);
	expect(screen.getByRole("dialog", { name: "AGENT" })).toBeVisible();
});

test("keeps an existing room's agent read-only", () => {
	render(
		<RoomInput
			{...defaultProps}
			session={sessionWith({
				options: savedAgentOptions("Locked agent"),
			})}
		/>,
	);
	const agent = screen.getByRole("button", { name: "Locked agent" });
	expect(agent).toHaveAttribute("aria-disabled", "true");
	fireEvent.click(agent);
	expect(screen.queryByRole("dialog")).toBeNull();
});

test("an existing agent room without a saved agent shows a read-only Default Agent pill", () => {
	const { rerender } = render(<RoomInput {...defaultProps} />);
	const pill = screen.getByRole("button", { name: "modes.defaultAgent" });
	expect(pill).toHaveAttribute("aria-disabled", "true");
	fireEvent.click(pill);
	expect(screen.queryByRole("dialog")).toBeNull();
	rerender(
		<RoomInput
			{...defaultProps}
			session={sessionWith({ isAgentMode: false })}
		/>,
	);
	expect(
		screen.queryByRole("button", { name: "modes.defaultAgent" }),
	).toBeNull();
});

test("a new chat in agent mode without a saved agent shows an editable Default Agent pill", () => {
	render(
		<RoomInput
			{...defaultProps}
			session={sessionWith({
				agent: { kind: "saved", withModeChoice: false },
			})}
			variant={draftVariant()}
		/>,
	);
	const pill = screen.getByRole("button", { name: "modes.defaultAgent" });
	expect(pill).not.toHaveAttribute("aria-disabled");
	fireEvent.click(pill);
	expect(screen.getByRole("dialog", { name: "AGENT" })).toBeVisible();
});

test("keeps optimizer beside the editor after typing and disables it while busy", () => {
	featureFlags.enablePromptOptimizer = true;
	const { rerender } = render(<RoomInput {...defaultProps} />);
	expect(
		screen.getByRole("button", { name: "Optimize prompt" }),
	).toBeDisabled();
	setEditorText("Improve this draft");
	expect(
		screen.getByRole("button", { name: "Optimize prompt" }),
	).toBeEnabled();
	rerender(<RoomInput {...defaultProps} sendState="stop" />);
	expect(
		screen.getByRole("button", { name: "Optimize prompt" }),
	).toBeDisabled();
});

test("routes file and tool actions from the single add menu", async () => {
	const user = userEvent.setup();
	render(<RoomInput {...defaultProps} />);
	const add = screen.getByRole("button", { name: "input.addToChat" });
	await user.click(add);
	await user.click(
		screen.getByRole("menuitem", { name: "menuUpload.attachDocument" }),
	);
	expect(openFilePicker).toHaveBeenCalledTimes(1);
	for (const [label, tab] of [
		["menuToolbox.addToolbox", "TOOLBOX"],
		["menuKnowledge.addKnowledge", "KNOWLEDGE"],
	]) {
		await user.click(add);
		await user.click(screen.getByRole("menuitem", { name: `${label} 0` }));
		expect(screen.getByRole("dialog", { name: tab })).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Close picker" }));
	}
});
test("opens prompts from the inline action before the microphone", async () => {
	const user = userEvent.setup();
	render(
		<RoomInput
			{...defaultProps}
			session={sessionWith({
				options: {
					...sessionWith().options,
					// only what the prompt library shows
					predefinedPrompts: [
						{
							id: "prompt",
							title: "Example prompt",
							context: "Example text",
						} as RoomStore["options"]["predefinedPrompts"][number],
					],
				},
			})}
		/>,
	);
	const prompts = screen.getByRole("button", { name: "studio.prompts" });
	const microphone = screen.getByRole("button", { name: "input.record" });
	expect(
		prompts.compareDocumentPosition(microphone) &
			Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();
	await user.click(prompts);
	expect(
		screen.getByRole("dialog", { name: "form.promptsLabel" }),
	).toBeVisible();
	expect(
		screen.getByRole("button", { name: "Example prompt Example text" }),
	).toBeVisible();
});

test("locks mutating menu actions during a turn", async () => {
	const user = userEvent.setup();
	render(<RoomInput {...defaultProps} sendState="stop" />);
	await user.click(screen.getByRole("button", { name: "input.addToChat" }));
	for (const name of [
		"menuUpload.attachDocument",
		"menuKnowledge.addKnowledge 0",
		"menuToolbox.addToolbox 0",
	]) {
		expect(screen.getByRole("menuitem", { name })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
	}
});

test("new chats choose execution mode separately from the saved agent", async () => {
	featureFlags.enableAgentHarness = true;
	const user = userEvent.setup();
	const onOptionsChange = vi.fn();
	const onSwitchToAgentHarness = vi.fn();
	const onExitAgentHarness = vi.fn();
	const variant = draftVariant({
		onSwitchToAgentHarness,
		onExitAgentHarness,
	});
	const agent = { kind: "saved", withModeChoice: true } as const;
	const { rerender } = render(
		<RoomInput
			{...defaultProps}
			variant={variant}
			session={sessionWith({
				agent,
				isAgentMode: false,
				onOptionsChange,
			})}
		/>,
	);
	setEditorText("Keep composed text");
	const add = screen.getByRole("button", { name: "input.addToChat" });
	await user.click(add);
	expect(
		screen.getByRole("menuitemradio", { name: "modes.ask" }),
	).toHaveAttribute("aria-checked", "true");
	await user.click(
		screen.getByRole("menuitemradio", { name: "modes.agent" }),
	);
	expect(onSwitchToAgentHarness).toHaveBeenCalledTimes(1);
	expect(onOptionsChange).not.toHaveBeenCalled();
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(add).toHaveFocus();
	rerender(
		<RoomInput
			{...defaultProps}
			variant={variant}
			session={sessionWith({ agent, onOptionsChange })}
		/>,
	);
	// agent mode with no saved agent runs Default Agent, which the pill names
	expect(
		screen.getByRole("button", { name: "modes.defaultAgent" }),
	).toBeVisible();
	await user.click(add);
	expect(
		screen.getByRole("menuitemradio", { name: "modes.agent" }),
	).toHaveAttribute("aria-checked", "true");
	await user.click(screen.getByRole("menuitemradio", { name: "modes.ask" }));
	expect(onExitAgentHarness).toHaveBeenCalledTimes(1);
	await user.click(add);
	await user.click(
		screen.getByRole("menuitem", { name: "modes.selectedAgent" }),
	);
	expect(screen.getByRole("dialog", { name: "AGENT" })).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Close picker" }));
	expect(onOptionsChange).not.toHaveBeenCalled();
	expect(onSwitchToAgentHarness).toHaveBeenCalledTimes(1);
	expect(onExitAgentHarness).toHaveBeenCalledTimes(1);
	expect(fakeEditorText).toBe("Keep composed text");
});

test.each([true, false])(
	"saving an agent only changes its profile with the harness flag %s",
	async (enableAgentHarness) => {
		featureFlags.enableAgentHarness = enableAgentHarness;
		const user = userEvent.setup();
		const onOptionsChange = vi.fn();
		const onSwitchToAgentHarness = vi.fn();
		const onExitAgentHarness = vi.fn();
		render(
			<RoomInput
				{...defaultProps}
				session={sessionWith({
					isAgentMode: false,
					agent: {
						kind: "saved",
						withModeChoice: enableAgentHarness,
					},
					onOptionsChange,
				})}
				variant={draftVariant({
					onSwitchToAgentHarness,
					onExitAgentHarness,
				})}
			/>,
		);
		await user.click(
			screen.getByRole("button", { name: "input.addToChat" }),
		);
		expect(screen.queryAllByRole("menuitemradio")).toHaveLength(
			enableAgentHarness ? 2 : 0,
		);
		await user.click(
			screen.getByRole("menuitem", { name: "menuWorkspace.selectAgent" }),
		);
		await user.click(screen.getByRole("button", { name: "Save agent" }));
		expect(onOptionsChange).toHaveBeenCalledExactlyOnceWith({
			mcp: [],
			workspace: { workspace_id: "alpha", name: "Alpha" },
		});
		expect(onSwitchToAgentHarness).not.toHaveBeenCalled();
		expect(onExitAgentHarness).not.toHaveBeenCalled();
	},
);

test("when the agent decides the mode, new chats pick a saved agent, Default Agent, or No Agent", async () => {
	featureFlags.enableAgentHarness = true;
	featureFlags.modeFollowsAgent = true;
	const user = userEvent.setup();
	const onOptionsChange = vi.fn();
	const onDefaultAgentChange = vi.fn();
	const draftSession = (isDefaultAgent: boolean) =>
		sessionWith({
			isAgentMode: isDefaultAgent,
			agent: { kind: "savedOrDefault", isDefaultAgent },
			onOptionsChange,
			onDefaultAgentChange,
		});
	const { rerender } = render(
		<RoomInput
			{...defaultProps}
			session={draftSession(false)}
			variant={draftVariant()}
		/>,
	);
	const add = screen.getByRole("button", { name: "input.addToChat" });
	await user.click(add);
	expect(screen.queryAllByRole("menuitemradio")).toHaveLength(0);
	await user.click(
		screen.getByRole("menuitem", { name: "menuWorkspace.selectAgent" }),
	);
	const picker = screen.getByRole("dialog", { name: "AGENT" });
	expect(picker).toHaveAttribute("data-allow-default-agent", "false");
	expect(picker).toHaveAttribute("data-default-agent", "false");
	await user.click(screen.getByRole("button", { name: "Save agent" }));
	expect(onOptionsChange).toHaveBeenCalledExactlyOnceWith({
		mcp: [],
		workspace: { workspace_id: "alpha", name: "Alpha" },
	});
	expect(onDefaultAgentChange).not.toHaveBeenCalled();

	await user.click(add);
	await user.click(
		screen.getByRole("menuitem", { name: "menuWorkspace.selectAgent" }),
	);
	await user.click(
		screen.getByRole("button", { name: "Save Default Agent" }),
	);
	expect(onOptionsChange).toHaveBeenLastCalledWith({
		mcp: [],
		workspace: undefined,
	});
	expect(onDefaultAgentChange).toHaveBeenCalledExactlyOnceWith(true);

	// the draft now runs Default Agent: the chip and the menu name it
	rerender(
		<RoomInput
			{...defaultProps}
			session={draftSession(true)}
			variant={draftVariant()}
		/>,
	);
	const chip = screen.getByRole("button", { name: "modes.defaultAgent" });
	await user.click(chip);
	expect(screen.getByRole("dialog", { name: "AGENT" })).toHaveAttribute(
		"data-default-agent",
		"true",
	);
	await user.click(screen.getByRole("button", { name: "Close picker" }));
	await user.click(add);
	expect(
		screen.getByRole("menuitem", { name: "modes.selectedAgent" }),
	).toBeVisible();
});

test("connector attachments stay visible and removable without an uploaded file", () => {
	const contextItems = new ContextItemsStore();
	contextItems.add({
		name: "Email summary.md",
		path: "email.md",
		service: "gmail",
	});
	const withContext = {
		...defaultProps.room,
		contextItems,
	} as unknown as RoomStore;
	render(<RoomInput {...defaultProps} room={withContext} />);
	expect(screen.getByText("Email summary.md")).toBeVisible();
	fireEvent.click(
		screen.getByRole("button", { name: "contextItems.remove" }),
	);
	expect(screen.queryByText("Email summary.md")).toBeNull();
	expect(contextItems.items).toEqual([]);
});
