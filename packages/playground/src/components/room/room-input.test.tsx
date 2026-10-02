import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { ConversationWorkspaceActionsContext } from "@/features/conversation/conversation-workspace-actions.context";
import type { RoomStore } from "@/stores/room/room.store";
import { RoomInput } from "./room-input";
import { RoomInputMenuMCP } from "./room-input-menu-mcp";
import { RoomInputMenuUpload } from "./room-input-menu-upload";

// ---------------------------------------------------------------------------
// Fake editor state shared between mocks
// ---------------------------------------------------------------------------
const openFilePicker = vi.hoisted(() => vi.fn());
// stable, as the SDK's are, so views keep the same logins between renders
const sessionLogins = vi.hoisted(() => ({
	logins: {},
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

vi.mock("@/contexts/file-drag-context", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@/contexts/file-drag-context")>();
	return {
		...actual,
		useFileDrag: () => ({
			isDragging: false,
			files: [],
			addFiles: vi.fn(),
			removeFile: vi.fn(),
			clearFiles: vi.fn(),
			openFilePicker,
		}),
	};
});

vi.mock("@/contexts", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/contexts")>()),
	useFileDrag: () => ({ openFilePicker }),
}));
const featureFlags: Record<string, boolean> = {};
vi.mock("@/hooks/use-root", () => ({
	useRoot: () => ({
		root: { theme: { featureFlags, defaultCompactionStrategy: "AUTO" } },
	}),
}));
vi.mock("@/hooks/use-graceful-errors", () => ({
	useGracefulErrors: () => ({
		getGracefulErrorMessage: (error: Error) => error.message,
	}),
}));
vi.mock("@/hooks/use-chat", () => ({
	useChat: () => ({ chat: { models: { contextWindow: 0 } } }),
}));
vi.mock("@/hooks/use-sidebar-panel-active", () => ({
	useSidebarPanelActive: () => false,
}));
// Unchanged child components still use the package's hook barrel.
vi.mock("@/hooks", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/hooks")>()),
	useRoot: () => ({
		root: { theme: { featureFlags, defaultCompactionStrategy: "AUTO" } },
	}),
	useChat: () => ({ chat: { models: { contextWindow: 0 } } }),
}));
vi.mock("@/components/prompt/PromptOptimizer", () => ({
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
vi.mock("@/components/mcp/mcp-overlay", () => ({
	MCPOverlay: ({
		open,
		defaultTab,
		onClose,
	}: {
		open: boolean;
		defaultTab: string;
		onClose: () => void;
	}) =>
		open ? (
			<div role="dialog" aria-label={defaultTab}>
				<button type="button" onClick={() => onClose()}>
					Close picker
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
		$isElementNode: vi.fn(() => true),
		$isSlashCommandNode: vi.fn(() => false),
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
vi.mock("@/components/common/lexical/enter-plugin", () => ({
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

const defaultProps = {
	isLoading: false,
	onPrompt: vi.fn(() => Promise.resolve(true)),
	model: null,
	setModel: vi.fn(),
	MenuComponent: () => React.createElement("div", null),
	options: {
		instructions: "",
		mcp: [],
		workspace: null,
		predefinedPrompts: [],
	},
	// Only these room fields are consumed by the composer in this test.
	room: {
		teamwork: {
			isAgentMode: false,
			connectors: [],
			availableSources: [],
			openSourcePanel: vi.fn(),
			openToolsPanel: vi.fn(),
			contextItems: [],
			missingSignIns: [],
			uncoveredConnectors: [],
			unofferedProviders: [],
			setSessionLogins: vi.fn(),
		},
		roomId: "room",
		history: [],
		options: {},
		mode: "agent",
	} as unknown as RoomStore,
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
			onStop={onStop}
		/>,
	);
	fireEvent.click(screen.getByLabelText("input.stopLabel"));
	expect(onStop).toHaveBeenCalledTimes(1);
	expect(onPrompt).not.toHaveBeenCalled();
});

test("has one add menu and no standalone tools or mode chip", () => {
	render(<RoomInput {...defaultProps} />);
	expect(
		screen.getAllByRole("button", { name: "input.openSettings" }),
	).toHaveLength(1);
	expect(
		screen.queryByRole("button", { name: "menuUpload.attachDocument" }),
	).toBeNull();
	expect(
		screen.queryByRole("button", { name: "studio.moreActions" }),
	).toBeNull();
	expect(screen.queryByText("modes.agent")).toBeNull();
	expect(screen.queryByText("studio.tools")).toBeNull();
	expect(screen.getByRole("button", { name: "input.record" })).toBeVisible();
});

test("shows only a selected agent next to add and opens its picker when editable", () => {
	render(
		<RoomInput
			{...defaultProps}
			options={{
				...defaultProps.options,
				workspace: { workspace_id: "agent", name: "Example agent" },
			}}
			onMcpChange={vi.fn()}
			onWorkspaceChange={vi.fn()}
		/>,
	);
	const agent = screen.getByRole("button", { name: "Example agent" });
	const add = screen.getByRole("button", { name: "input.openSettings" });
	expect(add.parentElement).toBe(agent.parentElement);
	fireEvent.click(agent);
	expect(screen.getByRole("dialog", { name: "AGENT" })).toBeVisible();
});

test("keeps an existing room's agent read-only", () => {
	render(
		<RoomInput
			{...defaultProps}
			options={{
				...defaultProps.options,
				workspace: { workspace_id: "agent", name: "Locked agent" },
			}}
			onMcpChange={vi.fn()}
		/>,
	);
	const agent = screen.getByRole("button", { name: "Locked agent" });
	expect(agent).toHaveAttribute("aria-disabled", "true");
	fireEvent.click(agent);
	expect(screen.queryByRole("dialog")).toBeNull();
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

test("routes file, tool, and source actions from the single add menu", async () => {
	const user = userEvent.setup();
	render(
		<RoomInput
			{...defaultProps}
			onMcpChange={vi.fn()}
			MenuComponent={({ onOpenChange, onOpenMcpOverlay }) => (
				<>
					<RoomInputMenuUpload onSelect={() => onOpenChange(false)} />
					<RoomInputMenuMCP
						type="TOOLBOX"
						options={defaultProps.options}
						onSelect={() => {
							onOpenChange(false);
							onOpenMcpOverlay("TOOLBOX");
						}}
					/>
					<RoomInputMenuMCP
						type="KNOWLEDGE"
						options={defaultProps.options}
						onSelect={() => {
							onOpenChange(false);
							onOpenMcpOverlay("KNOWLEDGE");
						}}
					/>
				</>
			)}
		/>,
	);
	const add = screen.getByRole("button", { name: "input.openSettings" });
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
			predefinedPrompts={[
				{
					id: "prompt",
					title: "Example prompt",
					context: "Example text",
				},
			]}
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

test("keeps Workspace accessible during a turn while locking mutating menu actions", async () => {
	const user = userEvent.setup();
	const openWorkspace = vi.fn();
	render(
		<ConversationWorkspaceActionsContext.Provider value={openWorkspace}>
			<RoomInput
				{...defaultProps}
				MenuComponent={undefined}
				sendState="stop"
			/>
		</ConversationWorkspaceActionsContext.Provider>,
	);
	await user.click(
		screen.getByRole("button", { name: "input.openSettings" }),
	);
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
	expect(screen.getAllByRole("separator")).toHaveLength(1);
	await user.click(
		screen.getByRole("menuitem", { name: "studio.openWorkArea" }),
	);
	expect(openWorkspace).toHaveBeenCalledTimes(1);
});

test("new-chat Agent opens the picker without changing mode on cancel", async () => {
	featureFlags.enableAgentHarness = true;
	const user = userEvent.setup();
	const onWorkspaceChange = vi.fn();
	render(
		<RoomInput
			{...defaultProps}
			MenuComponent={undefined}
			room={{ ...defaultProps.room, mode: "chat" } as RoomStore}
			onMcpChange={vi.fn()}
			onWorkspaceChange={onWorkspaceChange}
		/>,
	);
	await user.click(
		screen.getByRole("button", { name: "input.openSettings" }),
	);
	expect(
		screen.queryByRole("menuitem", { name: "menuWorkspace.selectAgent" }),
	).toBeNull();
	await user.click(
		screen.getByRole("menuitemradio", { name: "modes.agent" }),
	);
	expect(screen.getByRole("dialog", { name: "AGENT" })).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Close picker" }));
	expect(onWorkspaceChange).not.toHaveBeenCalled();
});

test("connector attachments stay visible and removable without an uploaded file", () => {
	const removeContextItem = vi.fn();
	const room = {
		...defaultProps.room,
		teamwork: {
			...defaultProps.room.teamwork,
			contextItems: [
				{
					id: "email",
					name: "Email summary.md",
					path: "email.md",
					service: "gmail",
				},
			],
			removeContextItem,
		},
	} as unknown as RoomStore;
	render(<RoomInput {...defaultProps} room={room} />);
	expect(screen.getByText("Email summary.md")).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "context.remove" }));
	expect(removeContextItem).toHaveBeenCalledWith("email");
});
