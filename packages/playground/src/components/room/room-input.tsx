import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isElementNode,
	type LexicalEditor,
} from "lexical";
import {
	BookOpenIcon,
	Bot,
	ExternalLinkIcon,
	HammerIcon,
	MicIcon,
	PlusIcon,
	SendIcon,
	SparklesIcon,
	Square,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { EngineSelect } from "@semoss/shared";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import {
	EnterPlugin,
	FocusPlugin,
	MCPOverlay,
	PromptLibraryDialog,
	type PromptLibraryItem,
} from "@/components";
import { FilePreviewGrid } from "@/components/common/file-preview-grid";
import { AutoScrollOnPastePlugin } from "@/components/common/lexical/auto-scroll-on-paste-plugin";
import {
	$isSlashCommandNode,
	SlashCommandNode,
	SlashCommandProvider,
	SlashMentionPlugin,
} from "@/components/common/lexical/slash-command";
import { useFileDrag } from "@/contexts";
import { useGracefulErrors, useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { Engine, MCPConfig, Workspace } from "@/types";
import { isKnowledgeMcp } from "@/utility/mcp-utils";
import { PromptOptimizer } from "../../components/prompt/PromptOptimizer";

type WorkspaceRef = Pick<Workspace, "workspace_id"> &
	Partial<Pick<Workspace, "name">>;

let isIframed = false;
try {
	isIframed = window.self !== window.top;
} catch {
	isIframed = true;
}

// ============================================================================
// Constants & Helper Functions
// ============================================================================

const noop = () => {};

/**
 * Format token counts for display
 * Converts large numbers to readable format (e.g., 1500 -> 1.5k, 2000000 -> 2.0M)
 */
const formatTokens = (tokens: number | undefined) => {
	if (tokens === undefined) return "0";
	if (tokens >= 1000000) {
		return `${(tokens / 1000000).toFixed(1)}M`;
	}
	if (tokens >= 1000) {
		return `${(tokens / 1000).toFixed(1)}k`;
	}
	return tokens.toString();
};

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Appearance of the send/stop button, computed by the parent from the turn +
 * cancel state:
 *  - "send"    — idle; submit the prompt (disabled while empty / tools pending)
 *  - "stop"    — a turn is in flight (model streaming, or tools executing); the
 *                button cancels it. Cancelling tool execution is a no-op today
 *                but the affordance stays so it lights up once that's wired.
 *  - "loading" — a spinner: stop was pressed and is unwinding, or the context is
 *                busy but has nothing to cancel (the new-room flow).
 */
export type SendButtonState = "send" | "stop" | "loading";

interface RoomInputProps {
	/** Classes to override */
	className?: string;

	/** Track if it is loading */
	isLoading?: boolean;

	/** Model of the room */
	model: Engine | null;

	/** Update options on change */
	setModel: (model: Engine) => void;

	/** Menu component for + button dropdown */
	MenuComponent: React.ComponentType<{
		isOpen: boolean;
		onOpenChange: (isOpen: boolean) => void;
		/** Open the MCP overlay on the given tab */
		onOpenMcpOverlay: (
			defaultTab: "AGENT" | "TOOLBOX" | "KNOWLEDGE",
		) => void;
	}>;

	/**
	 * Callback when the full MCP list changes (e.g. via the MCP overlay's
	 * Save button). Receives the next merged `mcp` array.
	 */
	onMcpChange?: (mcp: MCPConfig[]) => void;

	/**
	 * When provided, the MCP overlay grows an Agent tab and this callback
	 * fires when the user changes the selected agent. Opting in by passing
	 * this prop is the signal that the caller supports agent selection
	 * (today: new-room flow only).
	 */
	onWorkspaceChange?: (next: WorkspaceRef | null) => void;

	/** Room options containing MCP configurations for slash menu */
	options: RoomStore["options"];

	/** Callback triggered to process the prompt. Throw an error if necessary */
	onPrompt: (prompt: string, files: File[]) => Promise<boolean>;

	/** Has outstanding tools */
	hasOutstandingTools?: boolean;

	/** Appearance of the send/stop button. Defaults to "send". */
	sendState?: SendButtonState;

	/** Cancel the in-flight turn — invoked when the button is in its "stop"
	 *  state. */
	onStop?: () => void;

	/** Predefined prompts shown in prompt library */
	predefinedPrompts?: PromptLibraryItem[];

	/** Initial value from prompt library */
	initialValue?: string;
	/** Current token usage for context window indicator */
	tokensUsed?: number;

	/** Maximum token capacity for context window */
	tokensMax?: number;

	/** Total tokens consumed across the entire chat */
	totalTokens?: number;

	/** Room store for prompt optimizer */
	room: RoomStore;

	/** Callback to compact conversation; passed through to EngineSelect context tooltip */
	onCompact?: () => void;

	/** Command IDs to suppress from the slash menu */
	excludeCommandIds?: string[];

	/** Callback to open the room settings/configuration panel */
	onOpenSettings?: () => void;
}

// ============================================================================
// CompactButton
// ============================================================================

const CompactButton: React.FC<{
	disabled: boolean;
	tooltipText: string;
	onClick: (e: React.MouseEvent) => void;
}> = ({ disabled, tooltipText, onClick }) => {
	const { t } = useTranslation("room");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="w-full">
					<Button
						size="sm"
						variant="outline"
						className="w-full text-foreground"
						disabled={disabled}
						onClick={onClick}
					>
						{t("settings.compact")}
					</Button>
				</span>
			</TooltipTrigger>
			<TooltipContent>{tooltipText}</TooltipContent>
		</Tooltip>
	);
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * RoomInput - A rich text input component for chat/AI interactions
 *
 * Features:
 * - Lexical editor with mention support (/ commands)
 * - File upload via drag/drop, paste, or file picker
 * - Speech-to-text input
 * - Image file previews
 * - Model selection
 * - Tool pause/resume controls
 */
export const RoomInput: React.FC<RoomInputProps> = observer(
	({
		className,
		isLoading,
		model,
		setModel,
		MenuComponent,
		options,
		onPrompt = () => null,
		onMcpChange,
		onWorkspaceChange,
		hasOutstandingTools = false,
		sendState = "send",
		onStop,
		predefinedPrompts = [],
		initialValue,
		tokensUsed,
		tokensMax,
		totalTokens,
		room,
		onCompact,
		excludeCommandIds,
		onOpenSettings,
	}) => {
		// ========================================================================
		// Hooks & State
		// ========================================================================

		const { t } = useTranslation("room");
		const { getGracefulErrorMessage } = useGracefulErrors();

		// Editor state
		const [isEmpty, setIsEmpty] = useState(true);
		const [menuOpen, setMenuOpen] = useState(false);
		const [isScrollable, setIsScrollable] = useState(false);
		const [inputText, setInputText] = useState("");
		const { root } = useRoot();

		// MCP overlay state — managed here so the overlay renders outside the DropdownMenu's React subtree
		const [mcpOverlay, setMcpOverlay] = useState<{
			open: boolean;
			defaultTab: "AGENT" | "TOOLBOX" | "KNOWLEDGE";
		}>({ open: false, defaultTab: "KNOWLEDGE" });

		const handleOpenMcpOverlay = useCallback(
			(defaultTab: "AGENT" | "TOOLBOX" | "KNOWLEDGE") =>
				setMcpOverlay({ open: true, defaultTab }),
			[],
		);

		const knowledgeCount = useMemo(
			() => options.mcp.filter(isKnowledgeMcp).length,
			[options.mcp],
		);
		const toolboxCount = options.mcp.length - knowledgeCount;
		// Agent chip indicates a current selection. The Agent tab inside the
		// modal is always visible; editability is gated on `onWorkspaceChange`.
		const agentChipWorkspace = options.workspace ?? null;

		// Refs for DOM elements and Lexical editor
		const ref = useRef<HTMLDivElement>(null);
		const editorRef = useRef<LexicalEditor>(null);
		const contentEditableRef = useRef<HTMLDivElement>(null);
		const scrollViewportRef = useRef<HTMLElement | null>(null);

		// Bridge setInput() (PromptOptimizer) -> Lexical editor content
		const setInputFromOptimizer: React.Dispatch<
			React.SetStateAction<string>
		> = (nextValue) => {
			setInputText((prev) => {
				const next =
					typeof nextValue === "function"
						? (nextValue as (p: string) => string)(prev)
						: nextValue;

				editorRef.current?.update(() => {
					const root = $getRoot();
					root.clear();

					const paragraphNode = $createParagraphNode();
					if (next?.length) {
						paragraphNode.append($createTextNode(next));
					}
					root.append(paragraphNode);
				});
				editorRef.current?.focus();
				return next;
			});
		};

		// File handling
		const { files, addFiles, removeFile, clearFiles, setShouldStayOpen } =
			useFileDrag();

		// Speech-to-text
		const [canListen, setCanListen] = useState(false);
		const [isListening, setIsListening] = useState(false);
		const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);

		const runPredefinedPrompt = async (prompt: string) => {
			if (isLoading || hasOutstandingTools) {
				return;
			}

			try {
				const success = await onPrompt(prompt, []);
				if (!success) {
					throw new Error("Error processing chat");
				}
			} catch (e) {
				toast.error(getGracefulErrorMessage(e as Error));
			}
		};
		const recognitionRef = useRef<SpeechRecognition | null>(null);

		// ========================================================================
		// Context Window Tooltip
		// ========================================================================

		const contextTooltipContent = useMemo(() => {
			const contextUsedPercent =
				tokensMax && tokensUsed !== undefined
					? (tokensUsed / tokensMax) * 100
					: undefined;

			if (contextUsedPercent === undefined && !onCompact) return null;

			const descriptionKey =
				contextUsedPercent !== undefined
					? contextUsedPercent >= 100
						? "contextWindow.descriptionExceeded"
						: contextUsedPercent < 50
							? "contextWindow.descriptionLow"
							: contextUsedPercent < 75
								? "contextWindow.descriptionMedium"
								: "contextWindow.descriptionHigh"
					: null;

			return (
				<div className="w-full space-y-1">
					{contextUsedPercent !== undefined && descriptionKey && (
						<p className="w-full">{t(descriptionKey)}</p>
					)}
					{contextUsedPercent !== undefined && (
						<p className="flex w-full items-baseline justify-between gap-3">
							<span>{t("contextWindow.memoryUsedTitle")}</span>
							<span className="whitespace-nowrap text-end tabular-nums">
								{t("contextWindow.memoryUsedValue", {
									used: formatTokens(tokensUsed),
									total: formatTokens(tokensMax),
									percent: contextUsedPercent.toFixed(1),
								})}
							</span>
						</p>
					)}
					{totalTokens !== undefined && (
						<p className="flex w-full items-baseline justify-between gap-3">
							<span>{t("contextWindow.totalUsedTitle")}</span>
							<span className="whitespace-nowrap text-end tabular-nums">
								{t("contextWindow.totalUsedValue", {
									total: formatTokens(totalTokens),
								})}
							</span>
						</p>
					)}
					{onCompact && (
						<CompactButton
							disabled={isLoading || hasOutstandingTools}
							tooltipText={
								isLoading
									? t("input.thinkingTooltip")
									: hasOutstandingTools
										? t("input.completeTool")
										: t("settings.compactTooltip")
							}
							onClick={(e) => {
								e.stopPropagation();
								onCompact();
							}}
						/>
					)}
				</div>
			);
		}, [
			tokensUsed,
			tokensMax,
			totalTokens,
			onCompact,
			t,
			isLoading,
			hasOutstandingTools,
		]);

		// ========================================================================
		// Speech Recognition Setup
		// ========================================================================

		useEffect(() => {
			// Check browser support for Web Speech API
			const SpeechRecognition =
				window.SpeechRecognition || window.webkitSpeechRecognition;

			if (SpeechRecognition) {
				setCanListen(true);

				const recognition = new SpeechRecognition();
				recognition.continuous = true; // Keep listening until stopped
				recognition.interimResults = true; // Get real-time results
				recognition.lang = "en-US";

				recognition.onstart = () => {
					setIsListening(true);
				};

				recognition.onresult = (event) => {
					let transcript = "";

					// Collect only finalized transcription results
					for (
						let i = event.resultIndex;
						i < event.results.length;
						i++
					) {
						if (event.results[i].isFinal) {
							transcript += event.results[i][0].transcript;
						}
					}

					transcript = transcript.trim();
					if (transcript) {
						// Update Lexical editor with appended transcribed text
						editorRef.current?.update(() => {
							const root = $getRoot();
							const currentText = root.getTextContent();

							root.clear();

							// Append new transcript to existing text
							const paragraphNode = $createParagraphNode();
							const textNode = $createTextNode(
								currentText
									? `${currentText} ${transcript}`
									: transcript,
							);
							paragraphNode.append(textNode);
							root.append(paragraphNode);
						});
					}
				};

				recognition.onerror = (event) => {
					console.error(event);
					setIsListening(false);
					editorRef.current?.focus();
				};

				recognition.onend = () => {
					setIsListening(false);
					editorRef.current?.focus();
				};

				recognitionRef.current = recognition;
			} else {
				setCanListen(false);
			}

			// Cleanup: stop recognition when component unmounts
			return () => {
				recognitionRef.current?.stop();
			};
		}, []);

		useEffect(() => {
			if (!initialValue) return;
			editorRef.current?.update(() => {
				const root = $getRoot();
				root.clear();
				const paragraph = $createParagraphNode();
				paragraph.append($createTextNode(initialValue));
				root.append(paragraph);
			});
		}, [initialValue]);
		// Find and cache the ScrollArea viewport element
		useEffect(() => {
			if (contentEditableRef.current) {
				const viewport = contentEditableRef.current.closest(
					"[data-radix-scroll-area-viewport]",
				);
				scrollViewportRef.current = viewport as HTMLElement | null;
			}
		}, []);

		// ========================================================================
		// Core Functions
		// ========================================================================

		/**
		 * Submit the current prompt to the AI model
		 *
		 * Behavior:
		 * - Extracts text from editor and captures files
		 * - Clears editor optimistically before sending
		 * - On success: clears files
		 * - On failure: restores editor content and files for retry
		 */
		const promptModel = async () => {
			// Extract current text from Lexical editor, converting slash command
			// chips to their plain-text label so they're included in the message.
			let userInput = "";
			editorRef.current?.getEditorState().read(() => {
				const root = $getRoot();
				userInput = root
					.getChildren()
					.map((paragraph) => {
						if (!$isElementNode(paragraph))
							return paragraph.getTextContent();
						return paragraph
							.getChildren()
							.map((node) =>
								$isSlashCommandNode(node)
									? node.getLabel()
									: node.getTextContent(),
							)
							.join("");
					})
					.join("\n");
			});

			// Capture files before clearing (for potential restore on error)
			const userFiles = [...files];

			// Guard: prevent submission if empty, loading, or waiting for tool response
			if (!userInput || isLoading || hasOutstandingTools) {
				return;
			}

			try {
				// Optimistically clear editor and files before sending
				editorRef.current?.update(() => {
					const root = $getRoot();
					root.clear();
					const paragraphNode = $createParagraphNode();
					root.append(paragraphNode);
				});
				clearFiles();
				setShouldStayOpen(false);

				// Submit to parent handler
				const result = Boolean(await onPrompt(userInput, userFiles));
				if (result === null || result === false) {
					throw new Error(`Error processing chat`);
				}
			} catch (e) {
				// Show error to user
				toast.error(getGracefulErrorMessage(e as Error as Error));

				// Restore files for retry
				addFiles(userFiles);

				// Restore original text in editor for editing/retry
				editorRef.current?.update(() => {
					const root = $getRoot();
					root.clear();

					const paragraphNode = $createParagraphNode();
					const textNode = $createTextNode(userInput);
					paragraphNode.append(textNode);
					root.append(paragraphNode);
				});
			}
		};

		// Button appearance is fully decided by sendState (computed by the
		// parent from the turn + cancel state); only the idle "send" case needs
		// the local editor/tool signals to decide enablement + tooltip.
		const sendDisabled =
			sendState === "loading" ||
			(sendState === "send" && (isEmpty || hasOutstandingTools));
		const handleSendClick = () => {
			if (sendState === "stop") {
				onStop?.();
			} else if (sendState === "send") {
				promptModel();
			}
		};
		const sendTooltip =
			sendState === "stop"
				? t("input.stopTooltip")
				: isEmpty
					? t("input.enterQuestion")
					: hasOutstandingTools
						? t("input.completeTool")
						: t("input.ask");

		// ========================================================================
		// Render
		// ========================================================================

		return (
			<div className="relative w-full" ref={ref} data-tour="tour-input">
				<SlashCommandProvider
					onOpenMcpOverlay={handleOpenMcpOverlay}
					onCompact={onCompact ?? noop}
					onAttachDocument={() => setShouldStayOpen(true)}
					onOpenSettings={onOpenSettings ?? noop}
					excludeCommandIds={excludeCommandIds}
				>
					<LexicalComposer
						initialConfig={{
							namespace: "RoomInput",
							theme: {},
							nodes: [SlashCommandNode],
							onError: (error) => {
								console.error(error);
							},
						}}
					>
						<div
							className={cn(
								"flex h-full w-full flex-col overflow-hidden rounded-md border border-input bg-card shadow-lg transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
								className,
							)}
						>
							{files.length > 0 && (
								// Need pb-1 for scroll bar
								<div className="bg-card p-4 pb-1">
									<FilePreviewGrid
										files={files}
										onRemoveFile={removeFile}
									/>
								</div>
							)}
							<PlainTextPlugin
								contentEditable={
									<ScrollArea
										type="always"
										className={cn(
											"min-h-0 flex-1 bg-card",
											isScrollable && "me-1",
										)}
										onClick={() =>
											editorRef.current?.focus()
										}
									>
										{/* Grid overlap: editor + our own placeholder
									    share one grid cell so the cell sizes to
									    the larger of the two. Lexical's built-in
									    placeholder is absolute and can't push
									    editor height, which causes the
									    placeholder to overflow into the buttons
									    row when the input is narrow. */}
										<div className="grid">
											<ContentEditable
												ref={contentEditableRef}
												className={cn(
													"col-start-1 row-start-1 px-4 pb-4 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
													files.length > 0
														? "pt-0"
														: "pt-4",
												)}
												aria-placeholder={t(
													"input.ariaPlaceholder",
												)}
												placeholder={<div />}
												onPaste={(e) => {
													const clipboardFiles =
														Array.from(
															e.clipboardData
																.files,
														);

													// Microsoft apps (Word, Outlook, etc.) include an image
													// representation alongside text in the clipboard. If text
													// content is present, filter out those images so the text
													// is pasted normally instead of attaching a screenshot.
													const hasText =
														e.clipboardData.types.includes(
															"text/plain",
														) ||
														e.clipboardData.types.includes(
															"text/html",
														);

													const updated = hasText
														? clipboardFiles.filter(
																(f) =>
																	!f.type.startsWith(
																		"image/",
																	),
															)
														: clipboardFiles;

													if (updated.length > 0) {
														e.preventDefault();
														addFiles(updated);
													}
												}}
											/>
											{isEmpty && (
												<div
													className={cn(
														"pointer-events-none col-start-1 row-start-1 select-none px-4 pb-4 text-muted-foreground text-sm",
														files.length > 0
															? "pt-0"
															: "pt-4",
													)}
												>
													{/* Inline-block + align-middle makes the icon
											    flow with text: when the placeholder wraps,
											    only the text after the icon wraps to the
											    next line, instead of the whole text
											    jumping below the icon. */}
													<SparklesIcon className="-translate-y-px me-1 inline-block size-4 align-middle" />
													{isLoading
														? t("input.thinking")
														: t("input.menuPrompt")}
												</div>
											)}
										</div>
									</ScrollArea>
								}
								ErrorBoundary={LexicalErrorBoundary}
							/>

							{/* Bottom controls. `+` and send are pinned to the corners and
						    never shrink. Chips sit right of `+`. The middle controls
						    (model, prompt library, mic, prompt optimizer) right-align
						    next to send and clip from the left when there isn't
						    enough room — they disappear rather than wrap. */}
							<div
								className="flex items-center gap-2 bg-card p-2"
								data-tour="tour-input-menu"
								role="none"
								onClick={(e) => {
									const target = e.target as HTMLElement;
									if (
										!target.closest("button") &&
										!target.closest('[role="button"]') &&
										!target.closest('[role="combobox"]')
									) {
										editorRef.current?.focus();
									}
								}}
								onKeyDown={(e) => {
									const target = e.target as HTMLElement;
									const tag = target.tagName.toLowerCase();
									if (
										tag === "input" ||
										tag === "textarea" ||
										target.isContentEditable
									) {
										return;
									}
									editorRef.current?.focus();
								}}
							>
								{/* Plus menu — pinned bottom-left */}
								<div className="shrink-0">
									{!(
										root.theme.featureFlags
											?.hideToolsInIframe && isIframed
									) && (
										<DropdownMenu
											open={menuOpen}
											onOpenChange={(open) => {
												setMenuOpen(open);
											}}
										>
											<Tooltip>
												<TooltipTrigger asChild>
													<DropdownMenuTrigger
														asChild
													>
														<Button
															variant="ghost"
															size="icon-sm"
															aria-label={t(
																"input.openSettings",
															)}
														>
															<PlusIcon />
														</Button>
													</DropdownMenuTrigger>
												</TooltipTrigger>
												<TooltipContent>
													{t("input.openSettings")}
												</TooltipContent>
											</Tooltip>
											<DropdownMenuContent
												align="start"
												className="w-72"
												onCloseAutoFocus={(e) => {
													// Prevent dropdown from restoring focus to trigger button
													e.preventDefault();
												}}
											>
												<MenuComponent
													isOpen={menuOpen}
													onOpenChange={setMenuOpen}
													onOpenMcpOverlay={
														handleOpenMcpOverlay
													}
												/>
											</DropdownMenuContent>
										</DropdownMenu>
									)}
								</div>
								{/* Body — holds chips and middle controls. Chips clip
							    out first (chips-region grows then shrinks to 0); only
							    after chips are fully gone do middle controls begin
							    clipping from the left. */}
								<div className="flex min-w-0 flex-1 items-center gap-2">
									{/* Chips region — grows to push middle right, shrinks
								    first when squeezed. Chips inside are shrink-0 and
								    clip past the region's right edge. */}
									<div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
										{agentChipWorkspace && (
											<div className="inline-flex h-7 shrink-0 items-center overflow-hidden rounded-md border border-border bg-background text-xs">
												{onWorkspaceChange ? (
													<button
														type="button"
														onClick={() =>
															handleOpenMcpOverlay(
																"AGENT",
															)
														}
														className="flex h-full items-center gap-1.5 px-2.5 transition-colors hover:bg-muted/50"
														title={
															agentChipWorkspace.name ??
															undefined
														}
													>
														<Bot className="size-3.5 shrink-0" />
														<span className="max-w-32 truncate">
															{agentChipWorkspace.name ||
																agentChipWorkspace.workspace_id}
														</span>
													</button>
												) : (
													<div
														className="flex h-full items-center gap-1.5 px-2.5"
														title={
															agentChipWorkspace.name ??
															undefined
														}
													>
														<Bot className="size-3.5 shrink-0" />
														<span className="max-w-32 truncate">
															{agentChipWorkspace.name ||
																agentChipWorkspace.workspace_id}
														</span>
													</div>
												)}
												{root.theme.featureFlags
													?.showPlatformLinks && (
													<a
														target="_blank"
														rel="noopener noreferrer"
														href={`#/agent/${agentChipWorkspace.workspace_id}`}
														className="flex h-full items-center border-border border-s px-1.5 transition-colors hover:bg-muted/50"
														onClick={(e) =>
															e.stopPropagation()
														}
													>
														<ExternalLinkIcon className="size-3" />
													</a>
												)}
											</div>
										)}
										{knowledgeCount > 0 && (
											<button
												type="button"
												onClick={() =>
													handleOpenMcpOverlay(
														"KNOWLEDGE",
													)
												}
												className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs transition-colors hover:bg-muted/50"
											>
												<BookOpenIcon className="size-3.5" />
												<span>{knowledgeCount}</span>
											</button>
										)}
										{toolboxCount > 0 && (
											<button
												type="button"
												onClick={() =>
													handleOpenMcpOverlay(
														"TOOLBOX",
													)
												}
												className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs transition-colors hover:bg-muted/50"
											>
												<HammerIcon className="size-3.5" />
												<span>{toolboxCount}</span>
											</button>
										)}
									</div>
									{/* Middle controls — sit at natural width on the right
								    until chips-region collapses; then clip from the
								    left (justify-end + overflow-hidden). */}
									<div className="flex min-w-0 items-center justify-end gap-2 overflow-hidden">
										<div data-tour="tour-model">
											{root.theme.featureFlags
												?.enableModelSelect && (
												<EngineSelect
													className="h-8 gap-0.5 px-2 py-1 text-xs [&>svg]:hidden"
													name={
														model?.engine_display_name ||
														model?.app_name ||
														""
													}
													value={model?.app_id || ""}
													engineTypes={["MODEL"]}
													metaFilters={[
														{
															tag: "text-generation",
														},
													]}
													onChange={(v) => {
														setModel(v);
													}}
													popoverContentProps={{
														align: "start",
													}}
													tokensUsed={tokensUsed}
													tokensMax={tokensMax}
													contextTooltipContent={
														contextTooltipContent
													}
												/>
											)}
										</div>
										{predefinedPrompts.length > 0 ? (
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														className="bg-background"
														variant="ghost"
														size="icon-sm"
														aria-label="Open prompt library"
														onClick={() =>
															setIsPromptLibraryOpen(
																true,
															)
														}
													>
														<BookOpenIcon />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													Prompt Library
												</TooltipContent>
											</Tooltip>
										) : null}
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													data-tour="tour-record"
													variant="ghost"
													aria-label={t(
														"input.recordLabel",
													)}
													size="icon-sm"
													disabled={!canListen}
													onClick={() => {
														if (isListening) {
															recognitionRef.current?.stop();
															editorRef.current?.focus();
														} else {
															recognitionRef.current?.start();
														}
													}}
													// -ms-1 to make spacing between engine select and mic look more like spacing between mic and send
													// this is because engine select and mic are ghost
													className="-ms-1"
												>
													<MicIcon
														className={`${isListening ? "animate-pulse text-destructive" : ""}`}
													/>
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												{isListening
													? t("input.stopRecording")
													: t("input.record")}
											</TooltipContent>
										</Tooltip>

										{root.theme.featureFlags
											?.enablePromptOptimizer && (
											<PromptOptimizer
												input={inputText}
												setInput={setInputFromOptimizer}
												disabled={hasOutstandingTools}
												modelId={
													model?.engine_id ||
													undefined
												}
												room={room}
											/>
										)}
									</div>
								</div>
								{/* Send button — pinned bottom-right, sibling of body */}
								<div className="shrink-0">
									<Tooltip>
										<TooltipTrigger asChild>
											<span data-tour="tour-send">
												<Button
													variant="default"
													size="icon-sm"
													aria-label={
														sendState === "stop"
															? t(
																	"input.stopLabel",
																)
															: t(
																	"input.askLabel",
																)
													}
													disabled={sendDisabled}
													onClick={handleSendClick}
												>
													{sendState === "stop" ? (
														<Square
															className="size-3"
															fill="currentColor"
														/>
													) : sendState ===
														"loading" ? (
														<Spinner />
													) : (
														<SendIcon />
													)}
												</Button>
											</span>
										</TooltipTrigger>
										<TooltipContent>
											{sendTooltip}
										</TooltipContent>
									</Tooltip>
								</div>
							</div>
						</div>
						<OnChangePlugin
							onChange={(editorState) => {
								editorState.read(() => {
									const root = $getRoot();

									// Track empty state to disable send button
									const text = root.getTextContent();
									const hasSlashCommands = root
										.getChildren()
										.some(
											(p) =>
												$isElementNode(p) &&
												p
													.getChildren()
													.some($isSlashCommandNode),
										);
									setIsEmpty(
										text.length === 0 && !hasSlashCommands,
									);
									setInputText(text);

									// Check if content is scrollable
									setTimeout(() => {
										const viewport =
											scrollViewportRef.current;
										if (viewport) {
											// Check if content is scrollable
											setIsScrollable(
												viewport.scrollHeight >
													viewport.clientHeight,
											);
										}
									}, 0);
								});
							}}
						/>
						<HistoryPlugin />
						<AutoFocusPlugin />
						<FocusPlugin />
						<EditorRefPlugin editorRef={editorRef} />
						<EnterPlugin onEnter={() => promptModel()} />
						<AutoScrollOnPastePlugin
							scrollContainerRef={scrollViewportRef}
						/>
						<SlashMentionPlugin isLoading={isLoading} />
						<PromptLibraryDialog
							open={isPromptLibraryOpen}
							onOpenChange={setIsPromptLibraryOpen}
							prompts={predefinedPrompts}
							isLoading={isLoading}
							onSelectPrompt={(prompt) =>
								runPredefinedPrompt(prompt.context)
							}
						/>
					</LexicalComposer>
				</SlashCommandProvider>
				{onMcpChange && (
					<MCPOverlay
						open={mcpOverlay.open}
						defaultTab={mcpOverlay.defaultTab}
						values={options.mcp}
						workspace={agentChipWorkspace}
						agentEditable={!!onWorkspaceChange}
						onClose={(next) => {
							setMcpOverlay((prev) => ({ ...prev, open: false }));
							editorRef.current?.focus();
							if (!next) return;
							onMcpChange(next.mcp);
							if (onWorkspaceChange && "workspace" in next) {
								onWorkspaceChange(next.workspace ?? null);
							}
						}}
					/>
				)}
			</div>
		);
	},
);
