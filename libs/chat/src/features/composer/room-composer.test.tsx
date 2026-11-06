import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import type { MCPOverlay } from "../../components/mcp/mcp-overlay";
import { asObservableFake } from "../../testing/observable-fake";
import type { RoomUiStore } from "../workbench/room-ui.store";
import { RoomComposer } from "./room-composer";
import { RoomInputMenuMCP } from "./room-input-menu-mcp";
import { RoomInputMenuUpload } from "./room-input-menu-upload";

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
vi.mock("../conversation/use-room-slash-commands", () => ({
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

vi.mock("../../contexts/file-drag.context", async (importOriginal) => {
	const actual =
		await importOriginal<
			typeof import("../../contexts/file-drag.context")
		>();
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

const featureFlags: Record<string, boolean> = {};
vi.mock("../../hooks/use-graceful-errors", () => ({
	useGracefulErrors: () => ({
		getGracefulErrorMessage: (error: Error) => error.message,
	}),
}));
vi.mock("../../host/chat.context", () => ({
	useChat: () => ({
		chat: {
			getSnapshot: () => ({ version: 0 }),
			subscribe: () => () => undefined,
			models: { contextWindow: 0 },
		},
		config: {
			featureFlags,
			defaultCompactionStrategy: "AUTO",
			allowedUrlPrefixes: [],
		},
	}),
}));
vi.mock("../../hooks/use-sidebar-panel-active", () => ({
	useSidebarPanelActive: () => false,
}));
vi.mock("../prompts/prompt-optimizer", () => ({
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
vi.mock("../../components/mcp/mcp-overlay", () => ({
	MCPOverlay: ({
		open,
		defaultTab,
		onClose,
		values,
		allowDefaultAgent,
		isDefaultAgent,
	}: React.ComponentProps<typeof MCPOverlay>) =>
		open ? (
			<div
				role="dialog"
				aria-label={defaultTab}
				data-allow-default-agent={String(Boolean(allowDefaultAgent))}
				data-default-agent={String(isDefaultAgent)}
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
vi.mock("../../components/lexical/enter-plugin", () => ({
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
	room: asObservableFake({
		chatTools: {
			isAgentMode: false,
		},
		// the host runs no integrations
		integrations: [],
		getIntegrationRailPanels: () => [],
		contextItems: asObservableFake({ items: [], remove: vi.fn() }),
		roomId: "room",
		history: [],
		options: {},
		mode: "agent",
	}) as unknown as RoomUiStore,
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
	render(<RoomComposer {...defaultProps} onPrompt={onPrompt} />);

	setEditorText("Hello world");

	fireEvent.keyDown(document, { key: "Enter", code: "Enter", bubbles: true });

	await vi.waitFor(() => expect(onPrompt).toHaveBeenCalledTimes(1));
	expect(onPrompt).toHaveBeenCalledWith("Hello world", []);
});

test("clicking send button calls onPrompt", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));
	render(<RoomComposer {...defaultProps} onPrompt={onPrompt} />);

	setEditorText("Click send");

	const sendButton = screen.getByLabelText("Ask the AI");
	fireEvent.click(sendButton);

	await vi.waitFor(() => expect(onPrompt).toHaveBeenCalledTimes(1));
	expect(onPrompt).toHaveBeenCalledWith("Click send", []);
});

test("does not call onPrompt when loading", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(true));
	render(
		<RoomComposer {...defaultProps} isLoading={true} onPrompt={onPrompt} />,
	);

	setEditorText("Should not send");

	fireEvent.keyDown(document, { key: "Enter", code: "Enter", bubbles: true });

	await new Promise((r) => setTimeout(r, 50));
	expect(onPrompt).not.toHaveBeenCalled();
});

test("shows toast when onPrompt returns false", async () => {
	const onPrompt = vi.fn(() => Promise.resolve(false));
	toast.error = vi.fn();

	render(<RoomComposer {...defaultProps} onPrompt={onPrompt} />);

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
	render(<RoomComposer {...defaultProps} onPrompt={onPrompt} />);
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
		<RoomComposer
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
	render(<RoomComposer {...defaultProps} />);
	expect(
		screen.getAllByRole("button", { name: "input.addToChat" }),
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
		<RoomComposer
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
	const add = screen.getByRole("button", { name: "input.addToChat" });
	expect(add.parentElement).toBe(agent.parentElement);
	fireEvent.click(agent);
	expect(screen.getByRole("dialog", { name: "AGENT" })).toBeVisible();
});

test("keeps an existing room's agent read-only", () => {
	render(
		<RoomComposer
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

test("an existing agent room without a saved agent shows a read-only Default Agent pill", () => {
	const { rerender } = render(
		<RoomComposer
			{...defaultProps}
			room={{ ...defaultProps.room, mode: "agent" } as RoomUiStore}
			onMcpChange={vi.fn()}
		/>,
	);
	const pill = screen.getByRole("button", { name: "modes.defaultAgent" });
	expect(pill).toHaveAttribute("aria-disabled", "true");
	fireEvent.click(pill);
	expect(screen.queryByRole("dialog")).toBeNull();
	rerender(
		<RoomComposer
			{...defaultProps}
			room={{ ...defaultProps.room, mode: "chat" } as RoomUiStore}
			onMcpChange={vi.fn()}
		/>,
	);
	expect(
		screen.queryByRole("button", { name: "modes.defaultAgent" }),
	).toBeNull();
});

test("a new chat in agent mode without a saved agent shows an editable Default Agent pill", () => {
	render(
		<RoomComposer
			{...defaultProps}
			room={{ ...defaultProps.room, mode: "agent" } as RoomUiStore}
			onMcpChange={vi.fn()}
			onWorkspaceChange={vi.fn()}
		/>,
	);
	const pill = screen.getByRole("button", { name: "modes.defaultAgent" });
	expect(pill).not.toHaveAttribute("aria-disabled");
	fireEvent.click(pill);
	expect(screen.getByRole("dialog", { name: "AGENT" })).toBeVisible();
});

test("keeps optimizer beside the editor after typing and disables it while busy", () => {
	featureFlags.enablePromptOptimizer = true;
	const { rerender } = render(<RoomComposer {...defaultProps} />);
	expect(
		screen.getByRole("button", { name: "Optimize prompt" }),
	).toBeDisabled();
	setEditorText("Improve this draft");
	expect(
		screen.getByRole("button", { name: "Optimize prompt" }),
	).toBeEnabled();
	rerender(<RoomComposer {...defaultProps} sendState="stop" />);
	expect(
		screen.getByRole("button", { name: "Optimize prompt" }),
	).toBeDisabled();
});

test("routes file and tool actions from the single add menu", async () => {
	const user = userEvent.setup();
	render(
		<RoomComposer
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
		<RoomComposer
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

test("locks mutating menu actions during a turn", async () => {
	const user = userEvent.setup();
	render(
		<RoomComposer
			{...defaultProps}
			MenuComponent={undefined}
			sendState="stop"
		/>,
	);
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
	const onWorkspaceChange = vi.fn();
	const onSwitchToAgentHarness = vi.fn();
	const onExitAgentHarness = vi.fn();
	const props = {
		...defaultProps,
		MenuComponent: undefined,
		onMcpChange: vi.fn(),
		onWorkspaceChange,
		onSwitchToAgentHarness,
		onExitAgentHarness,
	};
	const { rerender } = render(
		<RoomComposer
			{...props}
			room={{ ...defaultProps.room, mode: "chat" } as RoomUiStore}
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
	expect(onWorkspaceChange).not.toHaveBeenCalled();
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(add).toHaveFocus();
	rerender(<RoomComposer {...props} room={defaultProps.room} />);
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
	expect(onWorkspaceChange).not.toHaveBeenCalled();
	expect(onSwitchToAgentHarness).toHaveBeenCalledTimes(1);
	expect(onExitAgentHarness).toHaveBeenCalledTimes(1);
	expect(fakeEditorText).toBe("Keep composed text");
});

test.each([true, false])(
	"saving an agent only changes its profile with the harness flag %s",
	async (enableAgentHarness) => {
		featureFlags.enableAgentHarness = enableAgentHarness;
		const user = userEvent.setup();
		const onWorkspaceChange = vi.fn();
		const onSwitchToAgentHarness = vi.fn();
		const onExitAgentHarness = vi.fn();
		render(
			<RoomComposer
				{...defaultProps}
				room={{ ...defaultProps.room, mode: "chat" } as RoomUiStore}
				MenuComponent={undefined}
				onMcpChange={vi.fn()}
				onWorkspaceChange={onWorkspaceChange}
				onSwitchToAgentHarness={onSwitchToAgentHarness}
				onExitAgentHarness={onExitAgentHarness}
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
		expect(onWorkspaceChange).toHaveBeenCalledExactlyOnceWith({
			workspace_id: "alpha",
			name: "Alpha",
		});
		expect(onSwitchToAgentHarness).not.toHaveBeenCalled();
		expect(onExitAgentHarness).not.toHaveBeenCalled();
	},
);

test("when the agent decides the mode, new chats pick a saved agent, Default Agent, or No Agent", async () => {
	featureFlags.enableAgentHarness = true;
	featureFlags.modeFollowsAgent = true;
	const user = userEvent.setup();
	const onWorkspaceChange = vi.fn();
	const onDefaultAgentChange = vi.fn();
	const props = {
		...defaultProps,
		MenuComponent: undefined,
		onMcpChange: vi.fn(),
		onWorkspaceChange,
		onDefaultAgentChange,
	};
	const { rerender } = render(
		<RoomComposer
			{...props}
			room={{ ...defaultProps.room, mode: "chat" } as RoomUiStore}
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
	expect(onWorkspaceChange).toHaveBeenCalledExactlyOnceWith({
		workspace_id: "alpha",
		name: "Alpha",
	});
	expect(onDefaultAgentChange).not.toHaveBeenCalled();

	await user.click(add);
	await user.click(
		screen.getByRole("menuitem", { name: "menuWorkspace.selectAgent" }),
	);
	await user.click(
		screen.getByRole("button", { name: "Save Default Agent" }),
	);
	expect(onWorkspaceChange).toHaveBeenLastCalledWith(null);
	expect(onDefaultAgentChange).toHaveBeenCalledExactlyOnceWith(true);

	// the draft now runs Default Agent: the chip and the menu name it
	rerender(
		<RoomComposer
			{...props}
			room={{ ...defaultProps.room, mode: "agent" } as RoomUiStore}
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
	const remove = vi.fn();
	const room = {
		...defaultProps.room,
		contextItems: asObservableFake({
			items: [
				{
					id: "email",
					name: "Email summary.md",
					path: "email.md",
					service: "gmail",
				},
			],
			remove,
		}),
	} as unknown as RoomUiStore;
	render(<RoomComposer {...defaultProps} room={room} />);
	expect(screen.getByText("Email summary.md")).toBeVisible();
	fireEvent.click(
		screen.getByRole("button", { name: "contextItems.remove" }),
	);
	expect(remove).toHaveBeenCalledWith("email");
});
