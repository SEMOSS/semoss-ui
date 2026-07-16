import {
	BookOpenIcon,
	BotIcon,
	ChevronsDownUpIcon,
	HammerIcon,
	MicIcon,
	PaperclipIcon,
	SendIcon,
	Settings2Icon,
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
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { cn } from "../lib/utils";

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

const NOOP = () => {};

/**
 * Playground-matching built-in slash commands for apps that want the same
 * core command workflow in ChatInput.
 */
export function createDefaultSlashCommands(
	actions?: ChatInputDefaultSlashCommandActions,
): ChatInputSlashCommand[] {
	const resolvedActions = {
		onOpenMcpOverlay: actions?.onOpenMcpOverlay ?? ((_tab) => {}),
		onCompact: actions?.onCompact ?? NOOP,
		onAttachDocument: actions?.onAttachDocument ?? NOOP,
		onOpenSettings: actions?.onOpenSettings ?? NOOP,
	};

	return [
		{
			id: "knowledge",
			label: "/knowledge",
			description: "Add knowledge sources to this conversation",
			icon: BookOpenIcon,
			noChip: true,
			onExecute: () => resolvedActions.onOpenMcpOverlay("KNOWLEDGE"),
		},
		{
			id: "toolbox",
			label: "/toolbox",
			description: "Add toolboxes to this conversation",
			icon: HammerIcon,
			noChip: true,
			onExecute: () => resolvedActions.onOpenMcpOverlay("TOOLBOX"),
		},
		{
			id: "mcp",
			label: "/mcp",
			icon: HammerIcon,
			hiddenInMenu: true,
			noChip: true,
			onExecute: () => resolvedActions.onOpenMcpOverlay("TOOLBOX"),
		},
		{
			id: "agent",
			label: "/agent",
			description: "Select an agent for this conversation",
			icon: BotIcon,
			noChip: true,
			onExecute: () => resolvedActions.onOpenMcpOverlay("AGENT"),
		},
		{
			id: "workspace",
			label: "/workspace",
			icon: BotIcon,
			hiddenInMenu: true,
			noChip: true,
			onExecute: () => resolvedActions.onOpenMcpOverlay("AGENT"),
		},
		{
			id: "compact",
			label: "/compact",
			description: "Summarize conversation history to free up context",
			icon: ChevronsDownUpIcon,
			noChip: true,
			disableDuringLoading: true,
			onExecute: resolvedActions.onCompact,
		},
		{
			id: "document",
			label: "/document",
			description: "Attach a document to this message",
			icon: PaperclipIcon,
			noChip: true,
			onExecute: resolvedActions.onAttachDocument,
		},
		{
			id: "file",
			label: "/file",
			icon: PaperclipIcon,
			hiddenInMenu: true,
			noChip: true,
			onExecute: resolvedActions.onAttachDocument,
		},
		{
			id: "settings",
			label: "/settings",
			description: "Open room configuration",
			icon: Settings2Icon,
			noChip: true,
			onExecute: resolvedActions.onOpenSettings,
		},
		{
			id: "room-options",
			label: "/room-options",
			icon: Settings2Icon,
			hiddenInMenu: true,
			noChip: true,
			onExecute: resolvedActions.onOpenSettings,
		},
	];
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

export interface ChatInputProps {
	onSend: (text: string) => void;
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
	 * Rendered in the bottom-right control cluster, immediately before the
	 * send button — e.g. an EngineSelect, matching playground's own
	 * bottom-right cluster (model picker, mic, sparkles, send all grouped
	 * together). Named "trailing" because it renders at the end of the
	 * control row, next to Send — not the start. Deliberately a slot rather
	 * than a baked-in engine picker: ChatInput doesn't know about
	 * engines/models at all, so any composable control can go here. See
	 * docs/chat-components/PLAN.md.
	 */
	trailingActions?: ReactNode;
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
	defaultSlashCommandActions?: ChatInputDefaultSlashCommandActions;
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
 * not playground's Lexical rich-text editor (file attach, MCP menu,
 * prompt library) — that's out of scope, not something this component is
 * trying to approximate.
 */
export function ChatInput({
	onSend,
	useSlashCommands = true,
	disabled = false,
	isGenerating = false,
	enableVoiceInput = false,
	value: controlledValue,
	onValueChange,
	placeholder = "Message...",
	className,
	trailingActions,
	slashCommands,
	onSlashCommandSelect,
	defaultSlashCommandActions,
	disableDefaultSlashCommandIds,
	disableDefaultSlashCommands = false,
	submitIcon,
	voiceIcon,
}: ChatInputProps) {
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
	const [isSlashMenuOpen, setIsSlashMenuOpen] = useState(false);
	const [slashMenuTrigger, setSlashMenuTrigger] = useState<
		"button" | "typing" | null
	>(null);
	const [slashQuery, setSlashQuery] = useState("");
	const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
	const [typedMenuPosition, setTypedMenuPosition] = useState<{
		left: number;
		top: number;
		openUpward: boolean;
	} | null>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const commandInputRef = useRef<HTMLInputElement>(null);
	// Mirrors value/setValue for the mic effect below, which only sets up
	// its onresult handler once (per enableVoiceInput toggle) — reading
	// through refs instead of closing over value/setValue directly avoids
	// the handler acting on a stale value across re-renders.
	const valueRef = useRef(value);
	valueRef.current = value;
	const setValueRef = useRef(setValue);
	setValueRef.current = setValue;

	const defaultSlashCommands =
		useSlashCommands && !disableDefaultSlashCommands
			? createDefaultSlashCommands(defaultSlashCommandActions)
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

	useEffect(() => {
		if (isSlashMenuOpen && slashMenuTrigger === "button") {
			commandInputRef.current?.focus();
		}
	}, [isSlashMenuOpen, slashMenuTrigger]);

	function submit() {
		const trimmed = value.trim();
		if (!trimmed || disabled) {
			return;
		}
		onSend(trimmed);
		setValue("");
	}

	const updateTypedSlashMenuPosition = useCallback(() => {
		if (!textareaRef.current || !formRef.current) {
			setTypedMenuPosition(null);
			return;
		}

		const caret = getTextareaCaretPosition(textareaRef.current);
		const textareaRect = textareaRef.current.getBoundingClientRect();
		const formRect = formRef.current.getBoundingClientRect();

		const menuWidth = 288;
		const estimatedMenuHeight = 280;
		const menuGap = 6;
		const caretViewportTop = textareaRect.top + caret.top;
		const caretViewportBottom = caretViewportTop + caret.lineHeight;
		const spaceBelow = window.innerHeight - caretViewportBottom;
		const spaceAbove = caretViewportTop;
		const openUpward =
			spaceBelow < estimatedMenuHeight + menuGap &&
			spaceAbove > estimatedMenuHeight + menuGap;
		const viewportTop = openUpward
			? caretViewportTop - estimatedMenuHeight - menuGap
			: caretViewportBottom + menuGap;
		const top = viewportTop - formRect.top;
		const left = Math.max(
			8,
			Math.min(
				textareaRect.left - formRect.left + caret.left,
				formRect.width - menuWidth - 8,
			),
		);

		setTypedMenuPosition({
			left,
			top,
			openUpward,
		});
	}, []);

	useEffect(() => {
		if (!isSlashMenuOpen || slashMenuTrigger !== "typing") {
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
	}, [isSlashMenuOpen, slashMenuTrigger, updateTypedSlashMenuPosition]);

	function syncSlashMenuFromComposer(nextValue: string) {
		if (effectiveSlashCommands.length === 0 || disabled) {
			setIsSlashMenuOpen(false);
			setSlashMenuTrigger(null);
			setSlashQuery("");
			setSelectedSlashIndex(0);
			setTypedMenuPosition(null);
			return;
		}

		const trailingSlashQuery = getTrailingSlashQuery(nextValue);
		if (trailingSlashQuery === null) {
			if (slashMenuTrigger === "typing") {
				setIsSlashMenuOpen(false);
				setSlashMenuTrigger(null);
				setSlashQuery("");
				setSelectedSlashIndex(0);
				setTypedMenuPosition(null);
			}
			return;
		}

		setSlashMenuTrigger("typing");
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
		if (isSlashMenuOpen && slashMenuTrigger === "typing") {
			if (event.key === "Escape") {
				event.preventDefault();
				setIsSlashMenuOpen(false);
				setSlashMenuTrigger(null);
				setSlashQuery("");
				setSelectedSlashIndex(0);
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
		if (slashMenuTrigger !== "typing") {
			insertSlashCommand(selected);
			return;
		}

		const next = current.replace(
			/(^|\s)\/[^\s/]*$/,
			(_, separator: string) => `${separator}${normalized} `,
		);
		updateComposerValue(
			next === current ? `${current}${normalized} ` : next,
		);
		onSlashCommandSelect?.(selected);
		textareaRef.current?.focus();
	}

	function clearTrailingSlashQuery() {
		const current = valueRef.current;
		if (slashMenuTrigger !== "typing") {
			return;
		}
		const next = current.replace(/(^|\s)\/[^\s/]*$/, "$1");
		updateComposerValue(next);
	}

	function insertSlashCommand(selected: ChatInputSlashCommand) {
		const normalized = getCommandToken(selected);
		const current = valueRef.current;
		const next = !current.trim()
			? `${normalized} `
			: current.endsWith(" ") || current.endsWith("\n")
				? `${current}${normalized} `
				: `${current} ${normalized} `;

		setValueRef.current(next);
		onSlashCommandSelect?.(selected);
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
			setSlashMenuTrigger(null);
			setSlashQuery("");
			setSelectedSlashIndex(0);
			setTypedMenuPosition(null);
			textareaRef.current?.focus();
			return;
		}

		replaceTrailingSlashCommand(selected);
		setIsSlashMenuOpen(false);
		setSlashMenuTrigger(null);
		setSlashQuery("");
		setSelectedSlashIndex(0);
		setTypedMenuPosition(null);
	}

	return (
		<form
			ref={formRef}
			data-slot="chat-input"
			onSubmit={handleSubmit}
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
				onKeyDown={handleKeyDown}
				disabled={disabled}
				placeholder={placeholder}
				rows={1}
				className="max-h-40 resize-none bg-transparent px-4 pt-4 pb-4 text-foreground text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
			/>
			{isSlashMenuOpen &&
				slashMenuTrigger === "typing" &&
				typedMenuPosition && (
					<div
						className="absolute z-50 w-72 overflow-hidden rounded-md border border-border bg-popover shadow-md"
						style={{
							left: typedMenuPosition.left,
							top: typedMenuPosition.top,
						}}
						data-open-direction={
							typedMenuPosition.openUpward ? "up" : "down"
						}
					>
						<Command
							shouldFilter={false}
							value={
								filteredSlashCommands[selectedSlashIndex]?.id ??
								""
							}
							onValueChange={(value) => {
								const nextIndex =
									filteredSlashCommands.findIndex(
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
									<CommandEmpty>
										No commands found
									</CommandEmpty>
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
					</div>
				)}
			<div className="flex items-center justify-end gap-2 bg-card p-2">
				{effectiveSlashCommands.length > 0 && (
					<DropdownMenu
						modal={false}
						open={isSlashMenuOpen && slashMenuTrigger === "button"}
						onOpenChange={(open) => {
							setIsSlashMenuOpen(open);
							setSlashMenuTrigger(open ? "button" : null);
							if (!open) {
								setSlashQuery("");
								setSelectedSlashIndex(0);
								setTypedMenuPosition(null);
							} else {
								setSlashQuery("");
								setSelectedSlashIndex(0);
							}
						}}
					>
						<DropdownMenuTrigger asChild>
							<Button
								data-slot="chat-input-slash"
								type="button"
								variant="ghost"
								size="icon-sm"
								disabled={disabled}
								aria-label="Slash commands"
							>
								/
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-72 p-0">
							<Command
								shouldFilter={false}
								value={
									filteredSlashCommands[selectedSlashIndex]
										?.id ?? ""
								}
								onValueChange={(value) => {
									const nextIndex =
										filteredSlashCommands.findIndex(
											(command) => command.id === value,
										);
									if (nextIndex !== -1) {
										setSelectedSlashIndex(nextIndex);
									}
								}}
								className="w-full"
							>
								{slashMenuTrigger === "button" && (
									<CommandInput
										ref={commandInputRef}
										placeholder="Type a command..."
										value={slashQuery}
										onValueChange={(nextValue) => {
											setSlashQuery(nextValue);
											setSelectedSlashIndex(0);
										}}
									/>
								)}
								<CommandList>
									{filteredSlashCommands.length === 0 ? (
										<CommandEmpty>
											No commands found
										</CommandEmpty>
									) : (
										<CommandGroup>
											{filteredSlashCommands.map(
												(slashCommand) => {
													const Icon =
														slashCommand.icon;
													const isDisabled = !!(
														slashCommand.disabled ||
														(slashCommand.disableDuringLoading &&
															isGenerating)
													);
													return (
														<CommandItem
															key={
																slashCommand.id
															}
															value={
																slashCommand.id
															}
															disabled={
																isDisabled
															}
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
						</DropdownMenuContent>
					</DropdownMenu>
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
				{trailingActions}
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
		</form>
	);
}
