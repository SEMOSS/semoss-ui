import {
	BookOpenIcon,
	BotIcon,
	ChevronsDownUpIcon,
	HammerIcon,
	MicIcon,
	PaperclipIcon,
	SendIcon,
	Settings2Icon,
	XIcon,
} from "lucide-react";
import {
	type ComponentType,
	type FormEvent,
	type KeyboardEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@semoss/ui";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { FileDragProvider, useFileDrag } from "../contexts/file-drag-context";
import type { Engine, MCPConfig } from "../types";
import { FileDragOverlay } from "./file-drag-overlay";
import {
	McpOverlay,
	type McpOverlayAgent,
	type McpOverlayOpenMode,
	type McpOverlayWorkspaceRef,
} from "./mcp-overlay";
import {
	PromptLibraryDialog,
	type PromptLibraryItem,
} from "./prompt-library-dialog";
import { RoomOptionsForm } from "./room-options-form";

export interface ChatInputSlashCommand {
	/** Stable identifier used for filtering and callbacks (matches playground). */
	id: string;
	/** Display label, typically including slash form (e.g. "/knowledge"). */
	label: string;
	/** Optional explicit insertion token (legacy/backward compatible). */
	command?: string;
	/** Optional helper copy shown in the command menu. */
	description?: string;
	/** Optional icon shown in the command menu. */
	icon?: ComponentType<{ className?: string }>;
	/** If true, hidden until at least one query character is typed. */
	hiddenInMenu?: boolean;
	/** If true, execute immediately (no text insertion) when selected. */
	noChip?: boolean;
	/** If true, disabled while the assistant is generating. */
	disableDuringLoading?: boolean;
	/** If true, command is always disabled (non-selectable). */
	disabled?: boolean;
	/** Command handler invoked for execute-style commands. */
	onExecute?: () => void;
}

export type ChatInputMcpTab = "AGENT" | "TOOLBOX" | "KNOWLEDGE";
export type ChatInputDefaultSlashCommandId =
	| "knowledge"
	| "toolbox"
	| "mcp"
	| "agent"
	| "workspace"
	| "compact"
	| "document"
	| "file"
	| "settings"
	| "room-options";

export interface ChatInputDefaultSlashCommandActions {
	onOpenMcpOverlay: (tab: ChatInputMcpTab) => void;
	onCompact: () => void;
	onAttachDocument: () => void;
	onOpenSettings: () => void;
}

/**
 * Playground-matching built-in slash commands for apps that want the same
 * core command workflow in ChatInput.
 */
export function createDefaultSlashCommands(
	actions: Partial<ChatInputDefaultSlashCommandActions>,
): ChatInputSlashCommand[] {
	const commands: ChatInputSlashCommand[] = [];

	if (actions.onOpenMcpOverlay) {
		commands.push(
			{
				id: "knowledge",
				label: "/knowledge",
				description: "Add knowledge sources to this conversation",
				icon: BookOpenIcon,
				noChip: true,
				onExecute: () => actions.onOpenMcpOverlay?.("KNOWLEDGE"),
			},
			{
				id: "toolbox",
				label: "/toolbox",
				description: "Add toolboxes to this conversation",
				icon: HammerIcon,
				noChip: true,
				onExecute: () => actions.onOpenMcpOverlay?.("TOOLBOX"),
			},
			{
				id: "mcp",
				label: "/mcp",
				icon: HammerIcon,
				hiddenInMenu: true,
				noChip: true,
				onExecute: () => actions.onOpenMcpOverlay?.("TOOLBOX"),
			},
			{
				id: "agent",
				label: "/agent",
				description: "Select an agent for this conversation",
				icon: BotIcon,
				noChip: true,
				onExecute: () => actions.onOpenMcpOverlay?.("AGENT"),
			},
			{
				id: "workspace",
				label: "/workspace",
				icon: BotIcon,
				hiddenInMenu: true,
				noChip: true,
				onExecute: () => actions.onOpenMcpOverlay?.("AGENT"),
			},
		);
	}

	if (actions.onCompact) {
		commands.push({
			id: "compact",
			label: "/compact",
			description: "Summarize conversation history to free up context",
			icon: ChevronsDownUpIcon,
			noChip: true,
			disableDuringLoading: true,
			onExecute: actions.onCompact,
		});
	}

	if (actions.onAttachDocument) {
		commands.push(
			{
				id: "document",
				label: "/document",
				description: "Attach a document to this message",
				icon: PaperclipIcon,
				noChip: true,
				onExecute: actions.onAttachDocument,
			},
			{
				id: "file",
				label: "/file",
				icon: PaperclipIcon,
				hiddenInMenu: true,
				noChip: true,
				onExecute: actions.onAttachDocument,
			},
		);
	}

	if (actions.onOpenSettings) {
		commands.push(
			{
				id: "settings",
				label: "/settings",
				description: "Open room configuration",
				icon: Settings2Icon,
				noChip: true,
				onExecute: actions.onOpenSettings,
			},
			{
				id: "room-options",
				label: "/room-options",
				icon: Settings2Icon,
				hiddenInMenu: true,
				noChip: true,
				onExecute: actions.onOpenSettings,
			},
		);
	}

	return commands;
}

function mergeSlashCommands(
	defaults: ChatInputSlashCommand[],
	overrides: ChatInputSlashCommand[],
): ChatInputSlashCommand[] {
	if (overrides.length === 0) {
		return defaults;
	}

	const overridesById = new Map(
		overrides.map((command) => [command.id, command]),
	);
	const merged: ChatInputSlashCommand[] = defaults.map(
		(command) => overridesById.get(command.id) ?? command,
	);

	for (const command of overrides) {
		if (!defaults.some((base) => base.id === command.id)) {
			merged.push(command);
		}
	}

	return merged;
}

function markDisabledDefaultSlashCommands(
	defaults: ChatInputSlashCommand[],
	disabledIds: ChatInputDefaultSlashCommandId[],
): ChatInputSlashCommand[] {
	if (disabledIds.length === 0) {
		return defaults;
	}

	const disabledSet = new Set(disabledIds);
	return defaults.map((command) =>
		disabledSet.has(command.id as ChatInputDefaultSlashCommandId)
			? { ...command, disabled: true }
			: command,
	);
}

function filterSlashCommands(
	commands: ChatInputSlashCommand[],
	query: string,
): ChatInputSlashCommand[] {
	const lowerQuery = query.toLowerCase();
	return commands.filter((cmd) => {
		if (!cmd.id.toLowerCase().startsWith(lowerQuery)) {
			return false;
		}
		if (cmd.hiddenInMenu && lowerQuery.length < 1) {
			return false;
		}
		return true;
	});
}

function getTrailingSlashQuery(value: string): string | null {
	const match = value.match(/(?:^|\s)\/([^\s/]*)$/);
	return match ? match[1] : null;
}

function getTextareaCaretPosition(textarea: HTMLTextAreaElement): {
	left: number;
	top: number;
	lineHeight: number;
} {
	const selectionIndex = textarea.selectionStart ?? 0;
	const style = window.getComputedStyle(textarea);
	const mirror = document.createElement("div");

	const propertiesToCopy = [
		"boxSizing",
		"width",
		"height",
		"overflowX",
		"overflowY",
		"borderTopWidth",
		"borderRightWidth",
		"borderBottomWidth",
		"borderLeftWidth",
		"paddingTop",
		"paddingRight",
		"paddingBottom",
		"paddingLeft",
		"fontStyle",
		"fontVariant",
		"fontWeight",
		"fontStretch",
		"fontSize",
		"lineHeight",
		"fontFamily",
		"textAlign",
		"textTransform",
		"textIndent",
		"textDecoration",
		"letterSpacing",
		"wordSpacing",
	] as const;

	for (const property of propertiesToCopy) {
		mirror.style[property] = style[property];
	}

	mirror.style.position = "absolute";
	mirror.style.visibility = "hidden";
	mirror.style.whiteSpace = "pre-wrap";
	mirror.style.wordWrap = "break-word";
	mirror.style.left = "-9999px";
	mirror.style.top = "0";

	const before = textarea.value.slice(0, selectionIndex);
	const after = textarea.value.slice(selectionIndex);

	mirror.textContent = before;
	const marker = document.createElement("span");
	marker.textContent = after.length > 0 ? after[0] : "\u200b";
	mirror.appendChild(marker);
	document.body.appendChild(mirror);

	const lineHeight = Number.parseFloat(style.lineHeight) || 20;
	const left = marker.offsetLeft - textarea.scrollLeft;
	const top = marker.offsetTop - textarea.scrollTop;

	document.body.removeChild(mirror);

	return { left, top, lineHeight };
}

interface SlashMenuPosition {
	top: number;
	bottom: number;
	left: number;
}

function SlashMenuPortal({
	menuPosition,
	onClose,
	children,
}: {
	menuPosition: SlashMenuPosition;
	onClose: () => void;
	children: ReactNode;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		const handler = (event: PointerEvent) => {
			if (!ref.current?.contains(event.target as Node)) {
				onCloseRef.current();
			}
		};
		document.addEventListener("pointerdown", handler, true);
		return () => document.removeEventListener("pointerdown", handler, true);
	}, []);

	return createPortal(
		<div
			ref={ref}
			style={{
				position: "fixed",
				...(window.innerHeight - menuPosition.bottom < 300
					? { bottom: window.innerHeight - menuPosition.top + 4 }
					: { top: menuPosition.bottom + 4 }),
				left: menuPosition.left,
				zIndex: 50,
			}}
			className="w-64 overflow-hidden rounded-md border border-border bg-popover shadow-md"
		>
			{children}
		</div>,
		document.body,
	);
}

export interface ChatInputProps {
	onSubmit: (text: string, files?: File[]) => void;
	/** Enables built-in slash command workflow. */
	useSlashCommands?: boolean;
	disabled?: boolean;
	/**
	 * True while the assistant is generating a response — swaps the Send
	 * button to a Spinner (matching playground's real room-input.tsx, whose
	 * send/pause button shows a Spinner once `isLoading` and there's no
	 * tool-execution loop to pause). Doesn't stop generation — @semoss/chat
	 * has no cancel-in-flight-stream or pause-the-agent's-tool-loop concept
	 * yet (playground's own pause button targets pausing agent-mode's
	 * automatic tool-execution loop specifically, via `toggleToolsPaused`,
	 * not stopping the LLM stream itself — a session concept this library
	 * doesn't model). See docs/chat-components/PLAN.md.
	 */
	isGenerating?: boolean;
	/**
	 * Adds a mic button that appends browser Web Speech API transcripts to
	 * the textarea — ported from room-input.tsx's real speech-to-text
	 * feature (continuous + interim results, only finalized segments get
	 * appended). Opt-in (default off) since it needs mic permission and
	 * isn't supported in every browser — silently renders nothing if
	 * `window.SpeechRecognition`/`webkitSpeechRecognition` isn't available.
	 */
	enableVoiceInput?: boolean;
	/**
	 * Controlled composer text — omit for the default uncontrolled mode
	 * (ChatInput manages its own value, clearing itself after send). Pass
	 * both `value`/`onValueChange` to lift the text out, e.g. so a
	 * `PromptOptimizer` (which needs to read/rewrite the composer's current
	 * text) can be composed alongside `trailingActions` — matches
	 * playground's own room-input.tsx, which bridges `PromptOptimizer`'s
	 * `setInput()` into its Lexical editor's content the same way.
	 */
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
	/**
	 * Rendered in the bottom-right control cluster before the built-in
	 * prompt-library and mic buttons — e.g. an EngineSelect, matching
	 * playground's right-side control ordering. Deliberately a slot rather
	 * than a baked-in engine picker: ChatInput doesn't know about
	 * engines/models at all, so any composable control can go here. See
	 * docs/chat-components/PLAN.md.
	 */
	trailingActions?: ReactNode;
	/**
	 * Optional predefined prompts for a built-in Prompt Library trigger.
	 * When provided, ChatInput renders a prompt-library button in the same
	 * right-side control cluster placement as playground (between
	 * trailingActions and the mic button).
	 */
	predefinedPrompts?: PromptLibraryItem[];
	/** Disables prompt selection while the list is being refreshed. */
	isPromptLibraryLoading?: boolean;
	/** Optional MCP list used by the fallback slash command overlay behavior. */
	mcp?: MCPConfig[];
	/** Fired when the fallback MCP overlay saves updates. */
	onMcpChange?: (mcp: MCPConfig[]) => void;
	/** Fallback MCP overlay presentation mode. */
	mcpOverlayOpenMode?: McpOverlayOpenMode;
	/** Optional selected workspace/agent for MCP overlay's agent tab. */
	workspace?: McpOverlayWorkspaceRef | null;
	/** Fixed agents shown before agents discovered from MyProjects. */
	agents?: readonly McpOverlayAgent[];
	/** Fired when workspace/agent selection changes in MCP overlay. */
	onWorkspaceChange?: (workspace: McpOverlayWorkspaceRef | null) => void;
	/** Optional room settings consumed by built-in settings dialog fallback. */
	roomSettings?: {
		instructions?: string;
	};
	/** Fired when room settings are saved from the built-in settings dialog. */
	onRoomSettingsChange?: (settings: { instructions?: string }) => void;
	/** Optional model shown in the playground-style settings page. */
	model?: Engine | null;
	onModelChange?: (model: Engine) => void;
	/**
	 * Optional handler for prompt-library selection. When omitted,
	 * selecting a prompt inserts its context into the composer.
	 */
	onPromptLibrarySelect?: (prompt: PromptLibraryItem) => void;
	/**
	 * Optional slash-command shortcuts rendered as a menu in the control
	 * row. Selecting one inserts the command into the composer.
	 */
	slashCommands?: ChatInputSlashCommand[];
	/** Fired after a slash command is inserted into the composer. */
	onSlashCommandSelect?: (command: ChatInputSlashCommand) => void;
	/**
	 * Enables the built-in playground-style command set. When provided, the
	 * default commands are created from these handlers and merged with
	 * `slashCommands` (same id = override, new id = append).
	 */
	defaultSlashCommandActions?: Partial<ChatInputDefaultSlashCommandActions>;
	/**
	 * Disable specific built-in playground commands without redefining
	 * them via `slashCommands` overrides.
	 */
	disableDefaultSlashCommandIds?: ChatInputDefaultSlashCommandId[];
	/**
	 * Opt out of the built-in command set even when
	 * `defaultSlashCommandActions` is provided.
	 */
	disableDefaultSlashCommands?: boolean;
	/**
	 * Custom icon for the send button. Defaults to SendIcon from lucide-react.
	 */
	submitIcon?: ComponentType<{ className?: string }>;
	/**
	 * Custom icon for the voice input button. Defaults to MicIcon from lucide-react.
	 */
	voiceIcon?: ComponentType<{ className?: string }>;
}

/**
 * Composer chrome matches room-input.tsx's outer container (border-input,
 * bg-card, shadow-lg, rounded-md, focus ring) and send button
 * (@semoss/ui's Button, variant="default" size="icon-sm") — see
 * docs/chat-components/PLAN.md. Deliberately still a plain <textarea>,
 * not playground's Lexical rich-text editor — but it now includes the
 * prompt-library trigger in the same right-side control cluster position
 * as playground for composition parity.
 */
export function ChatInput({ ...props }: ChatInputProps) {
	return (
		<FileDragProvider>
			<ChatInputInner {...props} />
		</FileDragProvider>
	);
}

function ChatInputInner({
	onSubmit,
	useSlashCommands = true,
	disabled = false,
	isGenerating = false,
	enableVoiceInput = false,
	value: controlledValue,
	onValueChange,
	placeholder = "Message...",
	className,
	trailingActions,
	predefinedPrompts = [],
	isPromptLibraryLoading = false,
	mcp,
	onMcpChange,
	mcpOverlayOpenMode = "side",
	workspace,
	agents,
	onWorkspaceChange,
	roomSettings,
	onRoomSettingsChange,
	model,
	onModelChange,
	onPromptLibrarySelect,
	slashCommands,
	onSlashCommandSelect,
	defaultSlashCommandActions,
	disableDefaultSlashCommandIds,
	disableDefaultSlashCommands = false,
	submitIcon,
	voiceIcon,
}: ChatInputProps) {
	const {
		files,
		addFiles,
		removeFile,
		clearFiles,
		containerRef,
		setShouldStayOpen,
		handleContainerDragOver,
	} = useFileDrag();
	const isControlled = controlledValue !== undefined;
	const [internalValue, setInternalValue] = useState("");
	const value = isControlled ? controlledValue : internalValue;
	const setValue = (next: string | ((prev: string) => string)) => {
		const resolved = typeof next === "function" ? next(value) : next;
		if (isControlled) {
			onValueChange?.(resolved);
		} else {
			setInternalValue(resolved);
		}
	};
	const [canListen, setCanListen] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
	const [internalMcp, setInternalMcp] = useState<MCPConfig[]>([]);
	const [mcpOverlayTab, setMcpOverlayTab] = useState<
		"AGENT" | "KNOWLEDGE" | "TOOLBOX" | null
	>(null);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [internalWorkspace, setInternalWorkspace] =
		useState<McpOverlayWorkspaceRef | null>(null);
	const [internalRoomSettings, setInternalRoomSettings] = useState<{
		instructions?: string;
	}>({});
	const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
	const [slashQuery, setSlashQuery] = useState("");
	const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
	const [typedMenuPosition, setTypedMenuPosition] =
		useState<SlashMenuPosition | null>(null);
	const formRef = useRef<HTMLFormElement | null>(null);
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	// Mirrors value/setValue for the mic effect below, which only sets up
	// its onresult handler once (per enableVoiceInput toggle) — reading
	// through refs instead of closing over value/setValue directly avoids
	// the handler acting on a stale value across re-renders.
	const valueRef = useRef(value);
	valueRef.current = value;
	const setValueRef = useRef(setValue);
	setValueRef.current = setValue;

	const handleCompact = useCallback(() => {
		onSubmit("/compact");
	}, [onSubmit]);

	const handleAttachDocument = useCallback(() => {
		setShouldStayOpen(true);
	}, [setShouldStayOpen]);

	const effectiveMcp = mcp ?? internalMcp;
	const effectiveWorkspace = workspace ?? internalWorkspace;
	const effectiveRoomSettings = roomSettings ?? internalRoomSettings;

	const handleSaveMcp = useCallback(
		(nextMcp: MCPConfig[]) => {
			if (onMcpChange) {
				onMcpChange(nextMcp);
				return;
			}
			setInternalMcp(nextMcp);
		},
		[onMcpChange],
	);

	const handleSaveWorkspace = useCallback(
		(nextWorkspace: McpOverlayWorkspaceRef | null) => {
			if (onWorkspaceChange) {
				onWorkspaceChange(nextWorkspace);
				return;
			}
			setInternalWorkspace(nextWorkspace);
		},
		[onWorkspaceChange],
	);

	const handleOpenMcpOverlay = useCallback((tab: ChatInputMcpTab) => {
		setMcpOverlayTab(tab);
	}, []);

	const handleOpenSettings = useCallback(() => {
		setIsSettingsOpen(true);
	}, []);

	const builtInDefaultSlashActions: Partial<ChatInputDefaultSlashCommandActions> =
		{
			onOpenMcpOverlay: handleOpenMcpOverlay,
			onCompact: handleCompact,
			onAttachDocument: handleAttachDocument,
			onOpenSettings: handleOpenSettings,
		};
	const resolvedDefaultSlashActions: Partial<ChatInputDefaultSlashCommandActions> =
		{
			...builtInDefaultSlashActions,
			...defaultSlashCommandActions,
		};

	const defaultSlashCommands =
		useSlashCommands && !disableDefaultSlashCommands
			? createDefaultSlashCommands(resolvedDefaultSlashActions)
			: [];
	const effectiveDefaultSlashCommands = markDisabledDefaultSlashCommands(
		defaultSlashCommands,
		disableDefaultSlashCommandIds ?? [],
	);
	const effectiveSlashCommands = mergeSlashCommands(
		effectiveDefaultSlashCommands,
		useSlashCommands ? (slashCommands ?? []) : [],
	);

	useEffect(() => {
		if (!enableVoiceInput) {
			return;
		}

		const SpeechRecognitionCtor =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognitionCtor) {
			setCanListen(false);
			return;
		}
		setCanListen(true);

		const recognition = new SpeechRecognitionCtor();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = "en-US";

		recognition.onstart = () => setIsListening(true);

		recognition.onresult = (event) => {
			let transcript = "";
			for (let i = event.resultIndex; i < event.results.length; i++) {
				if (event.results[i].isFinal) {
					transcript += event.results[i][0].transcript;
				}
			}
			transcript = transcript.trim();
			if (transcript) {
				const prev = valueRef.current;
				setValueRef.current(
					prev ? `${prev} ${transcript}` : transcript,
				);
			}
		};

		recognition.onerror = () => {
			setIsListening(false);
			textareaRef.current?.focus();
		};

		recognition.onend = () => {
			setIsListening(false);
			textareaRef.current?.focus();
		};

		recognitionRef.current = recognition;

		return () => {
			recognitionRef.current?.stop();
			recognitionRef.current = null;
		};
	}, [enableVoiceInput]);

	function submit() {
		const trimmed = value.trim();
		if ((!trimmed && files.length === 0) || disabled) {
			return;
		}
		onSubmit(trimmed, [...files]);
		setValue("");
		clearFiles();
		setShouldStayOpen(false);
	}

	const updateTypedSlashMenuPosition = useCallback(() => {
		if (!textareaRef.current) {
			setTypedMenuPosition(null);
			return;
		}

		const caret = getTextareaCaretPosition(textareaRef.current);
		const textareaRect = textareaRef.current.getBoundingClientRect();

		const menuWidth = 256;
		const caretViewportTop = textareaRect.top + caret.top;
		const caretViewportBottom = caretViewportTop + caret.lineHeight;
		const left = Math.max(
			8,
			Math.min(
				textareaRect.left + caret.left,
				window.innerWidth - menuWidth - 8,
			),
		);

		setTypedMenuPosition({
			top: caretViewportTop,
			bottom: caretViewportBottom,
			left,
		});
	}, []);

	useEffect(() => {
		if (!isSlashMenuOpen) {
			return;
		}

		const syncPosition = () => updateTypedSlashMenuPosition();
		syncPosition();
		window.addEventListener("resize", syncPosition);
		window.addEventListener("scroll", syncPosition, true);

		return () => {
			window.removeEventListener("resize", syncPosition);
			window.removeEventListener("scroll", syncPosition, true);
		};
	}, [isSlashMenuOpen, updateTypedSlashMenuPosition]);

	function syncSlashMenuFromComposer(nextValue: string) {
		if (effectiveSlashCommands.length === 0 || disabled) {
			setIsSlashMenuOpen(false);
			setSlashQuery("");
			setSelectedSlashIndex(0);
			setTypedMenuPosition(null);
			return;
		}

		const trailingSlashQuery = getTrailingSlashQuery(nextValue);
		if (trailingSlashQuery === null) {
			setIsSlashMenuOpen(false);
			setSlashQuery("");
			setSelectedSlashIndex(0);
			setTypedMenuPosition(null);
			return;
		}

		setIsSlashMenuOpen(true);
		setSlashQuery(trailingSlashQuery);
		setSelectedSlashIndex(0);
		updateTypedSlashMenuPosition();
	}

	function updateComposerValue(nextValue: string) {
		setValue(nextValue);
		syncSlashMenuFromComposer(nextValue);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (isSlashMenuOpen) {
			if (event.key === "Escape") {
				event.preventDefault();
				setIsSlashMenuOpen(false);
				setSlashQuery("");
				setSelectedSlashIndex(0);
				setTypedMenuPosition(null);
				return;
			}

			if (
				(event.key === "ArrowDown" || event.key === "ArrowUp") &&
				filteredSlashCommands.length > 0
			) {
				event.preventDefault();
				setSelectedSlashIndex((currentIndex) => {
					const delta = event.key === "ArrowDown" ? 1 : -1;
					return (
						(currentIndex + delta + filteredSlashCommands.length) %
						filteredSlashCommands.length
					);
				});
				return;
			}

			if (event.key === "Enter" && filteredSlashCommands.length > 0) {
				event.preventDefault();
				handleSlashCommandSelect(
					filteredSlashCommands[selectedSlashIndex] ??
						filteredSlashCommands[0],
				);
				return;
			}
		}

		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	}

	function handleSubmit(event: FormEvent) {
		event.preventDefault();
		submit();
	}

	function toggleListening() {
		if (isListening) {
			recognitionRef.current?.stop();
			textareaRef.current?.focus();
		} else {
			recognitionRef.current?.start();
		}
	}

	function getCommandToken(selected: ChatInputSlashCommand): string {
		const candidate = selected.command ?? selected.label;
		const raw = candidate.trim();
		if (!raw) {
			return `/${selected.id}`;
		}
		return raw.startsWith("/") ? raw : `/${raw}`;
	}

	function replaceTrailingSlashCommand(selected: ChatInputSlashCommand) {
		const normalized = getCommandToken(selected);
		const current = valueRef.current;
		const next = current.replace(
			/(^|\s)\/[^\s/]*$/,
			(_, separator: string) => `${separator}${normalized} `,
		);
		updateComposerValue(
			next === current ? `${current} ${normalized} ` : next,
		);
		onSlashCommandSelect?.(selected);
		textareaRef.current?.focus();
	}

	function clearTrailingSlashQuery() {
		const current = valueRef.current;
		const next = current.replace(/(^|\s)\/[^\s/]*$/, "$1");
		updateComposerValue(next);
	}

	function handlePromptLibrarySelect(prompt: PromptLibraryItem) {
		onPromptLibrarySelect?.(prompt);
		if (!onPromptLibrarySelect) {
			updateComposerValue(prompt.context);
		}
		setIsPromptLibraryOpen(false);
		textareaRef.current?.focus();
	}

	const filteredSlashCommands = filterSlashCommands(
		effectiveSlashCommands,
		slashQuery,
	);

	useEffect(() => {
		if (selectedSlashIndex < filteredSlashCommands.length) {
			return;
		}
		setSelectedSlashIndex(filteredSlashCommands.length > 0 ? 0 : 0);
	}, [filteredSlashCommands.length, selectedSlashIndex]);

	function handleSlashCommandSelect(selected: ChatInputSlashCommand) {
		const isDisabled = !!(
			selected.disabled ||
			(selected.disableDuringLoading && isGenerating)
		);
		if (isDisabled) {
			return;
		}

		if (selected.noChip) {
			clearTrailingSlashQuery();
			selected.onExecute?.();
			onSlashCommandSelect?.(selected);
			setIsSlashMenuOpen(false);
			setSlashQuery("");
			setSelectedSlashIndex(0);
			setTypedMenuPosition(null);
			textareaRef.current?.focus();
			return;
		}

		replaceTrailingSlashCommand(selected);
		setIsSlashMenuOpen(false);
		setSlashQuery("");
		setSelectedSlashIndex(0);
		setTypedMenuPosition(null);
	}

	const closeSlashMenu = useCallback(() => {
		setIsSlashMenuOpen(false);
		setSlashQuery("");
		setSelectedSlashIndex(0);
		setTypedMenuPosition(null);
	}, []);

	return (
		<form
			ref={(node) => {
				formRef.current = node;
				containerRef.current = node;
			}}
			data-slot="chat-input"
			onSubmit={handleSubmit}
			onDragOver={handleContainerDragOver}
			className={cn(
				"relative flex flex-col rounded-md border border-input bg-card shadow-lg transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
				className,
			)}
		>
			<textarea
				ref={textareaRef}
				data-slot="chat-input-textarea"
				value={value}
				onChange={(event) => updateComposerValue(event.target.value)}
				onPaste={(event) => {
					const pastedFiles = Array.from(event.clipboardData.files);
					if (pastedFiles.length === 0) {
						return;
					}

					event.preventDefault();
					addFiles(pastedFiles);
					setShouldStayOpen(true);
				}}
				onKeyDown={handleKeyDown}
				disabled={disabled}
				placeholder={placeholder}
				rows={1}
				className="max-h-40 resize-none bg-transparent px-4 pt-4 pb-4 text-foreground text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
			/>
			{files.length > 0 && (
				<div className="flex flex-wrap gap-2 px-4 pb-2">
					{files.map((file, index) => (
						<div
							key={`${file.name}-${file.size}-${index}`}
							className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1 text-xs"
						>
							<PaperclipIcon className="size-3 shrink-0 text-muted-foreground" />
							<span className="max-w-52 truncate">
								{file.name}
							</span>
							<button
								type="button"
								onClick={() => removeFile(index)}
								aria-label={`Remove ${file.name}`}
								className="text-muted-foreground hover:text-foreground"
							>
								<XIcon className="size-3" />
							</button>
						</div>
					))}
				</div>
			)}
			{isSlashMenuOpen && typedMenuPosition && (
				<SlashMenuPortal
					menuPosition={typedMenuPosition}
					onClose={closeSlashMenu}
				>
					<Command
						shouldFilter={false}
						value={
							filteredSlashCommands[selectedSlashIndex]?.id ?? ""
						}
						onValueChange={(value) => {
							const nextIndex = filteredSlashCommands.findIndex(
								(command) => command.id === value,
							);
							if (nextIndex !== -1) {
								setSelectedSlashIndex(nextIndex);
							}
						}}
						className="w-full"
					>
						<CommandList>
							{filteredSlashCommands.length === 0 ? (
								<CommandEmpty>No commands found</CommandEmpty>
							) : (
								<CommandGroup>
									{filteredSlashCommands.map(
										(slashCommand) => {
											const Icon = slashCommand.icon;
											const isDisabled = !!(
												slashCommand.disabled ||
												(slashCommand.disableDuringLoading &&
													isGenerating)
											);
											return (
												<CommandItem
													key={slashCommand.id}
													value={slashCommand.id}
													disabled={isDisabled}
													onSelect={() =>
														handleSlashCommandSelect(
															slashCommand,
														)
													}
												>
													{Icon && (
														<Icon className="mr-2 size-4 shrink-0" />
													)}
													<div className="flex min-w-0 flex-col gap-0.5">
														<span className="font-medium text-sm">
															{getCommandToken(
																slashCommand,
															)}
														</span>
														{slashCommand.description && (
															<span className="text-muted-foreground text-xs">
																{
																	slashCommand.description
																}
															</span>
														)}
													</div>
												</CommandItem>
											);
										},
									)}
								</CommandGroup>
							)}
						</CommandList>
					</Command>
				</SlashMenuPortal>
			)}
			<div className="flex items-center justify-end gap-2 bg-card p-2">
				{trailingActions}
				{predefinedPrompts.length > 0 && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								data-slot="chat-input-prompt-library"
								type="button"
								variant="ghost"
								size="icon-sm"
								className="bg-background"
								disabled={disabled || isGenerating}
								aria-label="Open prompt library"
								onClick={() => setIsPromptLibraryOpen(true)}
							>
								<BookOpenIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Prompt Library</TooltipContent>
					</Tooltip>
				)}
				{enableVoiceInput && canListen && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								data-slot="chat-input-mic"
								type="button"
								variant="ghost"
								size="icon-sm"
								disabled={disabled}
								aria-label={
									isListening ? "Stop recording" : "Record"
								}
								onClick={toggleListening}
							>
								{(() => {
									const MicIconComponent =
										voiceIcon || MicIcon;
									return (
										<MicIconComponent
											className={cn(
												isListening &&
													"animate-pulse text-destructive",
											)}
										/>
									);
								})()}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{isListening ? "Stop recording" : "Record"}
						</TooltipContent>
					</Tooltip>
				)}
				<Button
					data-slot="chat-input-send"
					type="submit"
					variant="default"
					size="icon-sm"
					aria-label={isGenerating ? "Generating response" : "Send"}
					disabled={disabled || !value.trim()}
				>
					{isGenerating ? (
						<Spinner />
					) : (
						(() => {
							const SendIconComponent = submitIcon || SendIcon;
							return <SendIconComponent />;
						})()
					)}
				</Button>
			</div>
			<PromptLibraryDialog
				open={isPromptLibraryOpen}
				onOpenChange={setIsPromptLibraryOpen}
				prompts={predefinedPrompts}
				isLoading={isPromptLibraryLoading}
				onSelectPrompt={handlePromptLibrarySelect}
			/>
			<McpOverlay
				open={mcpOverlayTab !== null}
				defaultTab={mcpOverlayTab ?? "KNOWLEDGE"}
				openMode={mcpOverlayOpenMode}
				values={effectiveMcp}
				workspace={effectiveWorkspace}
				agentEditable
				agents={agents}
				onSave={handleSaveMcp}
				onSaveWorkspace={handleSaveWorkspace}
				onOpenChange={(open) => {
					if (!open) {
						setMcpOverlayTab(null);
					}
				}}
			/>
			<Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
				<DialogContent className="flex h-[80vh] max-h-160 w-full flex-col gap-4 sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle>Room Settings</DialogTitle>
						<DialogDescription>
							Configure room options.
						</DialogDescription>
					</DialogHeader>
					<ScrollArea className="min-h-0 flex-1">
						<RoomOptionsForm
							model={model}
							onModelChange={onModelChange}
							options={{
								instructions:
									effectiveRoomSettings.instructions,
								mcp: effectiveMcp,
								workspace: effectiveWorkspace ?? undefined,
							}}
							agents={agents}
							onOptionsChange={(nextOptions) => {
								if (nextOptions.instructions !== undefined) {
									if (onRoomSettingsChange) {
										onRoomSettingsChange({
											instructions:
												nextOptions.instructions,
										});
									} else {
										setInternalRoomSettings((prev) => ({
											...prev,
											instructions:
												nextOptions.instructions,
										}));
									}
								}
								if (nextOptions.mcp) {
									handleSaveMcp(nextOptions.mcp);
								}
								if ("workspace" in nextOptions) {
									handleSaveWorkspace(
										nextOptions.workspace ?? null,
									);
								}
							}}
							agentEditable
						/>
					</ScrollArea>
				</DialogContent>
			</Dialog>
			<FileDragOverlay />
		</form>
	);
}
