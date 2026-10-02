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
	ArrowUpIcon,
	BookOpenIcon,
	Bot,
	MicIcon,
	PlusIcon,
	Square,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import {
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import type { ConnectorViewerService } from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { EngineSelect } from "@semoss/shared";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Label,
	P,
	ScrollArea,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { FilePreviewGrid } from "@/components/common/file-preview-grid";
import { AutoScrollOnPastePlugin } from "@/components/common/lexical/auto-scroll-on-paste-plugin";
import { BackspacePlugin } from "@/components/common/lexical/backspace-plugin";
import { EnterPlugin } from "@/components/common/lexical/enter-plugin";
import { FocusPlugin } from "@/components/common/lexical/focus-plugin";
import { SlashCommandProvider } from "@/components/common/lexical/slash-command/context";
import {
	$isSlashCommandNode,
	SlashCommandNode,
} from "@/components/common/lexical/slash-command/node";
import { SlashMentionPlugin } from "@/components/common/lexical/slash-command/plugin";
import { MCPOverlay } from "@/components/mcp/mcp-overlay";
import {
	PromptLibraryDialog,
	type PromptLibraryItem,
} from "@/components/prompts/prompt-library-dialog";
import { useFileDrag } from "@/contexts/file-drag-context";
import { ConversationWorkspaceActionsContext } from "@/features/conversation/conversation-workspace-actions.context";
import {
	getPromptHistory,
	RESET_PROMPT_HISTORY_COMMAND,
} from "@/features/conversation/prompt-history";
import { PromptHistoryPlugin } from "@/features/conversation/prompt-history-plugin";
import {
	RoomComposerMenu,
	type RoomComposerMenuProps,
} from "@/features/conversation/room-composer-menu";
import { TeamworkContextItems } from "@/features/teamwork/components/teamwork-context-items";
import { TeamworkDialogs } from "@/features/teamwork/components/teamwork-dialogs";
import { TeamworkSignInNotice } from "@/features/teamwork/components/teamwork-sign-in-notice";
import { useGracefulErrors } from "@/hooks/use-graceful-errors";
import { useRoot } from "@/hooks/use-root";
import { AGENT_HARNESS_TYPE } from "@/stores/message/agent-harness";
import type { RoomStore } from "@/stores/room/room.store";
import type { Engine, MCPConfig, Workspace } from "@/types";
import { PromptOptimizer } from "../../components/prompt/PromptOptimizer";
import { RoomContextUsageIndicator } from "./room-context-usage-indicator";

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

const DRAFT_STORAGE_KEY_PREFIX = "semoss:playground:room-draft:";
const TEMP_COMPOSE_ID_KEY = "semoss:playground:temp-compose-id";

/**
 * The new-room page always passes the same "temp" roomId (no real room
 * exists yet), so multiple tabs each starting a new chat would otherwise
 * share -- and clobber -- one draft slot. Give "temp" a per-tab id via
 * sessionStorage: stable across a same-tab reload (what session timeout
 * triggers) but distinct per tab.
 */
const getDraftStorageId = (roomId: string): string => {
	if (roomId !== "temp") return roomId;

	try {
		let composeId = window.sessionStorage.getItem(TEMP_COMPOSE_ID_KEY);
		if (!composeId) {
			composeId = Math.random().toString(36).slice(2);
			window.sessionStorage.setItem(TEMP_COMPOSE_ID_KEY, composeId);
		}
		return `temp-${composeId}`;
	} catch {
		return roomId;
	}
};

/**
 * Persist the in-progress draft per room in localStorage so it survives a
 * hard page reload (e.g. the full navigation the app does on session
 * timeout), not just an in-memory unmount/remount.
 */
const readDraft = (roomId: string): string => {
	const key = DRAFT_STORAGE_KEY_PREFIX + getDraftStorageId(roomId);
	try {
		return window.localStorage.getItem(key) ?? "";
	} catch {
		return "";
	}
};

const writeDraft = (roomId: string, value: string) => {
	const key = DRAFT_STORAGE_KEY_PREFIX + getDraftStorageId(roomId);
	try {
		if (value) {
			window.localStorage.setItem(key, value);
		} else {
			window.localStorage.removeItem(key);
		}
	} catch {
		// localStorage can throw (quota exceeded, private browsing) -- the
		// draft is a nicety, not something worth surfacing an error for.
	}
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
	/** Drafts prepare a file-capable room before opening a connector viewer. */
	onOpenSource?: (service: ConnectorViewerService) => void;
	/** Hide Chat Tools until draft settings are committed to the room. */
	showChatTools?: boolean;
	/** Classes to override */
	className?: string;

	/** Track if it is loading */
	isLoading?: boolean;
	/** Prevent sending while draft agent settings are being resolved. */
	isSubmitDisabled?: boolean;

	/** Model of the room */
	model: Engine | null;

	/** Update options on change */
	setModel: (model: Engine) => void;

	/** Menu component for + button dropdown */
	MenuComponent?: React.ComponentType<RoomComposerMenuProps>;

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
	onWorkspaceChange?: (
		next: WorkspaceRef | null,
		activateAgentMode?: boolean,
	) => void;

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

	/** Room store for prompt optimizer and context usage indicator */
	room: RoomStore;

	/** Callback to compact conversation; also passed through to the slash menu */
	onCompact?: (strategy?: "TOOL_PRUNE" | "SUMMARY" | "AUTO") => void;

	/** Command IDs to suppress from the slash menu */
	excludeCommandIds?: string[];

	/** Callback to open the room settings/configuration panel */
	onOpenSettings?: () => void;

	/**
	 * Callback for the /agent-harness slash command. Defaults to switching
	 * `room` into agent mode directly — override on the new-room page, where
	 * mode lives in local state until the room is actually created.
	 */
	onSwitchToAgentHarness?: () => void;

	/**
	 * Legacy callback retained for callers; mode switching now lives in the + menu.
	 * Only passed on the new-room page — once a room exists its harness type
	 * is a persisted, committed choice, not something to back out of inline.
	 */
	onExitAgentHarness?: () => void;
}

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
		isSubmitDisabled = false,
		model,
		setModel,
		MenuComponent = RoomComposerMenu,
		options,
		onPrompt,
		onMcpChange,
		onWorkspaceChange,
		hasOutstandingTools = false,
		sendState = "send",
		onStop,
		predefinedPrompts = [],
		initialValue,
		room,
		onCompact,
		excludeCommandIds,
		onOpenSettings,
		onSwitchToAgentHarness,
		onExitAgentHarness,
		onOpenSource,
		showChatTools = true,
	}) => {
		// ========================================================================
		// Hooks & State
		// ========================================================================

		const { t } = useTranslation("room");
		const modelSelectId = useId();
		const { getGracefulErrorMessage } = useGracefulErrors();

		// Editor state
		const [isEmpty, setIsEmpty] = useState(true);
		const [menuOpen, setMenuOpen] = useState(false);
		const [isScrollable, setIsScrollable] = useState(false);
		const [inputText, setInputText] = useState("");
		const { root } = useRoot();
		const openWorkspace =
			useContext(ConversationWorkspaceActionsContext) ??
			(() => room.openSidebar());
		const afterMenuClose = useRef<(() => void) | null>(null);
		const handleOpenWorkspace = () => {
			afterMenuClose.current = openWorkspace;
			setMenuOpen(false);
		};
		const handleOpenConnectors = () => {
			if (isLoading || hasOutstandingTools || sendState !== "send")
				return;
			afterMenuClose.current = room.teamwork.openConnectorsDialog;
			setMenuOpen(false);
		};
		const menuTriggerRef = useRef<HTMLButtonElement>(null);
		const handleOpenSource = (service: ConnectorViewerService) => {
			afterMenuClose.current = () => {
				if (onOpenSource) onOpenSource(service);
				else room.teamwork.openSourcePanel(service);
			};
			setMenuOpen(false);
		};

		// MCP overlay state — managed here so the overlay renders outside the DropdownMenu's React subtree
		const [mcpOverlay, setMcpOverlay] = useState<{
			open: boolean;
			defaultTab: "AGENT" | "TOOLBOX" | "KNOWLEDGE";
		}>({ open: false, defaultTab: "KNOWLEDGE" });

		const handleOpenMcpOverlay = useCallback(
			(defaultTab: "AGENT" | "TOOLBOX" | "KNOWLEDGE") => {
				if (isLoading || hasOutstandingTools || sendState !== "send")
					return;
				const open = () => setMcpOverlay({ open: true, defaultTab });
				if (menuOpen) {
					afterMenuClose.current = open;
					setMenuOpen(false);
				} else open();
			},
			[isLoading, hasOutstandingTools, sendState, menuOpen],
		);

		// Default for an already-created room: flip mode now (takes effect on the
		// next message) and persist harnessType so it survives a reload.
		const handleSwitchToAgentHarness =
			onSwitchToAgentHarness ??
			(() => {
				room.setMode("agent");
				(async () => {
					try {
						await room.updateRoomOptions({
							...room.options,
							harnessType: AGENT_HARNESS_TYPE,
						});
					} catch (e) {
						console.error(
							"Failed to persist agent harness mode",
							e,
						);
					}
				})();
			});

		const agentChipWorkspace = options.workspace ?? null;
		const agentName =
			agentChipWorkspace?.name || agentChipWorkspace?.workspace_id || "";
		const modelName = model?.engine_display_name || model?.app_name || "";
		const history = room.history;
		const historyEntries = useMemo(
			() => getPromptHistory(history),
			[history],
		);
		const historyKey = JSON.stringify([
			room.roomId,
			history.map((message) => message.id),
		]);
		const isBusy =
			!!isLoading || hasOutstandingTools || sendState !== "send";

		// Refs for DOM elements and Lexical editor
		const ref = useRef<HTMLDivElement>(null);
		const editorRef = useRef<LexicalEditor>(null);
		const isSubmittingRef = useRef(false);
		const contentEditableRef = useRef<HTMLDivElement>(null);
		const scrollViewportRef = useRef<HTMLElement | null>(null);

		// Bridge setInput() (PromptOptimizer) -> Lexical editor content
		const setInputFromOptimizer: React.Dispatch<
			React.SetStateAction<string>
		> = (nextValue) => {
			const next =
				typeof nextValue === "function"
					? nextValue(inputText)
					: nextValue;
			setInputText(next);
			editorRef.current?.update(() => {
				const root = $getRoot();
				root.clear();
				root.append(
					$createParagraphNode().append($createTextNode(next)),
				);
			});
			editorRef.current?.focus();
		};

		// File handling
		const { files, addFiles, removeFile, clearFiles, openFilePicker } =
			useFileDrag();
		const hasAttachments =
			files.length > 0 || room.teamwork.contextItems.length > 0;

		// Speech-to-text
		const [canListen, setCanListen] = useState(false);
		const [isListening, setIsListening] = useState(false);
		const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);

		const runPredefinedPrompt = async (prompt: string) => {
			if (isBusy || isSubmitDisabled) {
				return;
			}
			editorRef.current?.dispatchCommand(
				RESET_PROMPT_HISTORY_COMMAND,
				undefined,
			);

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

		// Whether the latest response has unfinished tools — compaction can't
		// touch a response until all tool calls have resolved
		const latestResponseHasTools =
			room.latestResponseMessage?.hasUnfinishedTools ?? false;

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

		// Restore a persisted draft for this room, e.g. after the page had to
		// hard-reload to re-authenticate. initialValue (prompt library, etc.)
		// takes priority since it reflects an explicit user action.
		useEffect(() => {
			if (initialValue) return;

			const draft = readDraft(room.roomId);
			if (!draft) return;

			editorRef.current?.update(() => {
				const root = $getRoot();
				root.clear();
				const paragraph = $createParagraphNode();
				paragraph.append($createTextNode(draft));
				root.append(paragraph);
			});
			// biome-ignore lint/correctness/useExhaustiveDependencies: only restore once per room mount, not on every initialValue change
		}, [room.roomId]);
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
			if (isSubmittingRef.current) return;
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
			if (
				!userInput ||
				isLoading ||
				isSubmitDisabled ||
				hasOutstandingTools
			) {
				return;
			}

			try {
				isSubmittingRef.current = true;
				editorRef.current?.dispatchCommand(
					RESET_PROMPT_HISTORY_COMMAND,
					undefined,
				);
				// Optimistically clear editor and files before sending
				editorRef.current?.update(() => {
					const root = $getRoot();
					root.clear();
					const paragraphNode = $createParagraphNode();
					root.append(paragraphNode);
				});
				clearFiles();

				// Submit to parent handler
				const result = Boolean(await onPrompt(userInput, userFiles));
				if (!result) {
					throw new Error(`Error processing chat`);
				}
			} catch (e) {
				// Show error to user
				toast.error(
					(e as Error)?.name === "UploadError"
						? t("errors.fileInUse")
						: getGracefulErrorMessage(e as Error),
				);

				// Restore files for retry
				addFiles(userFiles);

				// Keep anything typed while the request was in flight. The failed
				// message is restored before that draft instead of overwriting it.
				editorRef.current?.update(() => {
					const root = $getRoot();
					const paragraph = $createParagraphNode();
					paragraph.append($createTextNode(userInput));
					if (root.getTextContent().trim()) {
						root.getFirstChild()?.insertBefore(paragraph);
					} else {
						root.clear();
						root.append(paragraph);
					}
				});
			} finally {
				isSubmittingRef.current = false;
			}
		};

		// Button appearance is fully decided by sendState (computed by the
		// parent from the turn + cancel state); only the idle "send" case needs
		// the local editor/tool signals to decide enablement + tooltip.
		const sendDisabled =
			sendState === "loading" ||
			(sendState === "send" &&
				(isEmpty || isSubmitDisabled || hasOutstandingTools));
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
					onAttachDocument={openFilePicker}
					onOpenSettings={onOpenSettings ?? noop}
					onSwitchToAgentHarness={handleSwitchToAgentHarness}
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
								"flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
								className,
							)}
						>
							<div className="max-h-24 shrink-0 overflow-y-auto">
								<TeamworkSignInNotice
									teamwork={room.teamwork}
								/>
							</div>
							{hasAttachments && (
								// Need pb-1 for scroll bar
								<div className="max-h-24 shrink-0 overflow-y-auto bg-card p-3 pb-1">
									{files.length > 0 &&
										root.theme.fileDragDisclaimer && (
											<P className="-mt-1 pb-2 text-muted-foreground text-xs">
												{root.theme.fileDragDisclaimer}
											</P>
										)}
									<FilePreviewGrid
										files={files}
										onRemoveFile={removeFile}
										leading={
											<TeamworkContextItems
												teamwork={room.teamwork}
											/>
										}
									/>
								</div>
							)}
							<div className="flex min-h-0 flex-1 items-start">
								{root.theme.featureFlags
									?.enablePromptOptimizer && (
									<div
										className={cn(
											"shrink-0 ps-2",
											hasAttachments ? "pt-0" : "pt-3",
										)}
									>
										<PromptOptimizer
											input={inputText}
											setInput={setInputFromOptimizer}
											disabled={isBusy}
											modelId={
												model?.engine_id ||
												model?.app_id ||
												undefined
											}
											room={room}
										/>
									</div>
								)}
								<PlainTextPlugin
									contentEditable={
										<ScrollArea
											type="always"
											className={cn(
												"min-h-0 min-w-0 flex-1 bg-card",
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
														"col-start-1 row-start-1 min-h-16 px-4 pb-3 text-base leading-relaxed outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
														root.theme.featureFlags
															?.enablePromptOptimizer &&
															"ps-2",
														hasAttachments
															? "pt-0"
															: "pt-4",
													)}
													aria-label={t(
														"input.ariaPlaceholder",
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
														//
														// Exception: Microsoft Teams copies images with a
														// text/html entry that is just an <img> wrapper with no
														// real text content. In that case we should keep the
														// image files and let them be attached.
														const hasPlainText =
															e.clipboardData
																.getData(
																	"text/plain",
																)
																.trim().length >
															0;

														// text/html is only "real text" if it contains
														// meaningful content beyond just an <img> tag
														// (Teams wraps copied images in bare <img> html).
														// Parsed with DOMParser into an inert, disconnected
														// document (no browsing context) so any <img> tags
														// never load and their attribute handlers never run.
														const htmlHasMeaningfulText =
															(() => {
																const html =
																	e.clipboardData.getData(
																		"text/html",
																	);
																if (!html)
																	return false;
																const parsed =
																	new DOMParser().parseFromString(
																		html,
																		"text/html",
																	);
																parsed.body
																	.querySelectorAll(
																		"img",
																	)
																	.forEach(
																		(
																			img,
																		) => {
																			img.remove();
																		},
																	);
																return (
																	(parsed.body.textContent?.trim()
																		.length ??
																		0) > 0
																);
															})();

														const hasText =
															hasPlainText ||
															htmlHasMeaningfulText;

														const updated = hasText
															? clipboardFiles.filter(
																	(f) =>
																		!f.type.startsWith(
																			"image/",
																		),
																)
															: clipboardFiles;

														if (
															updated.length > 0
														) {
															e.preventDefault();
															addFiles(updated);
														}
													}}
												/>
												{isEmpty && (
													<div
														className={cn(
															"pointer-events-none col-start-1 row-start-1 select-none px-4 pb-3 text-base text-muted-foreground",
															root.theme
																.featureFlags
																?.enablePromptOptimizer &&
																"ps-2",
															hasAttachments
																? "pt-0"
																: "pt-4",
														)}
													>
														{isLoading
															? t(
																	"input.thinking",
																)
															: t(
																	"input.menuPrompt",
																)}
													</div>
												)}
											</div>
										</ScrollArea>
									}
									ErrorBoundary={LexicalErrorBoundary}
								/>
							</div>
							<PromptHistoryPlugin
								key={historyKey}
								entries={historyEntries}
							/>
							<div className="flex shrink-0 flex-wrap items-center gap-1 p-2">
								<div className="flex min-w-0 max-w-full items-center gap-1">
									{!(
										root.theme.featureFlags
											?.hideToolsInIframe && isIframed
									) && (
										<DropdownMenu
											open={menuOpen}
											onOpenChange={setMenuOpen}
										>
											<Tooltip
												disableHoverableContent={false}
											>
												<TooltipTrigger asChild>
													<DropdownMenuTrigger
														asChild
													>
														<Button
															type="button"
															variant="ghost"
															size="icon-sm"
															className="shrink-0 rounded-full"
															aria-label={t(
																"input.openSettings",
															)}
															data-tour="tour-input-menu"
															ref={menuTriggerRef}
														>
															<PlusIcon aria-hidden="true" />
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
												onCloseAutoFocus={(event) => {
													const action =
														afterMenuClose.current;
													if (!action) return;
													event.preventDefault();
													afterMenuClose.current =
														null;
													action();
												}}
											>
												<MenuComponent
													room={room}
													onOpenConnectors={
														handleOpenConnectors
													}
													onOpenSource={
														handleOpenSource
													}
													showChatTools={
														showChatTools
													}
													isOpen={menuOpen}
													options={options}
													disabled={isBusy}
													onOpenWorkspace={
														handleOpenWorkspace
													}
													mode={room.mode}
													onSelectChat={
														onExitAgentHarness
													}
													agentEditable={
														!!onWorkspaceChange
													}
													enableAgentHarness={
														root.theme.featureFlags
															?.enableAgentHarness
													}
													onOpenChange={setMenuOpen}
													onOpenMcpOverlay={
														handleOpenMcpOverlay
													}
												/>
											</DropdownMenuContent>
										</DropdownMenu>
									)}
									{agentChipWorkspace && (
										<Tooltip
											disableHoverableContent={false}
										>
											<TooltipTrigger asChild>
												{onWorkspaceChange ? (
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="min-w-0 max-w-48 gap-2 rounded-full"
														disabled={isBusy}
														onClick={() =>
															handleOpenMcpOverlay(
																"AGENT",
															)
														}
													>
														<Bot
															aria-hidden="true"
															className="size-4 shrink-0"
														/>
														<span className="truncate">
															{agentName}
														</span>
													</Button>
												) : (
													<Button
														type="button"
														variant="outline"
														size="sm"
														aria-disabled="true"
														className="inline-flex h-8 min-w-0 max-w-48 items-center gap-2 rounded-full px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
													>
														<Bot
															aria-hidden="true"
															className="size-4 shrink-0"
														/>
														<span className="truncate">
															{agentName}
														</span>
													</Button>
												)}
											</TooltipTrigger>
											<TooltipContent>
												{agentName}
											</TooltipContent>
										</Tooltip>
									)}
								</div>
								<div className="ms-auto flex min-w-0 max-w-full flex-wrap items-center justify-end gap-1">
									<div
										className="flex items-center gap-1"
										data-tour="tour-input-more"
									>
										<RoomContextUsageIndicator
											room={room}
											onCompact={onCompact}
											isLoading={isLoading}
										/>
										{predefinedPrompts.length > 0 && (
											<Tooltip
												disableHoverableContent={false}
											>
												<TooltipTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														className="rounded-full"
														aria-label={t(
															"studio.prompts",
														)}
														onClick={() =>
															setIsPromptLibraryOpen(
																true,
															)
														}
													>
														<BookOpenIcon aria-hidden="true" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{t("studio.prompts")}
												</TooltipContent>
											</Tooltip>
										)}
										<Tooltip
											disableHoverableContent={false}
										>
											<TooltipTrigger asChild>
												<span
													className="inline-flex"
													data-tour="tour-record"
												>
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														className="rounded-full"
														disabled={!canListen}
														aria-pressed={
															isListening
														}
														aria-label={t(
															isListening
																? "input.stopRecording"
																: "input.record",
														)}
														onClick={() => {
															if (isListening)
																recognitionRef.current?.stop();
															else
																recognitionRef.current?.start();
														}}
													>
														<MicIcon
															aria-hidden="true"
															className={cn(
																isListening &&
																	"text-destructive",
															)}
														/>
													</Button>
												</span>
											</TooltipTrigger>
											<TooltipContent>
												{t(
													!canListen
														? "input.recordUnavailable"
														: isListening
															? "input.stopRecording"
															: "input.record",
												)}
											</TooltipContent>
										</Tooltip>
									</div>
									{root.theme.featureFlags
										?.enableModelSelect && (
										<Tooltip
											disableHoverableContent={false}
										>
											<TooltipTrigger asChild>
												<span
													className="inline-flex min-w-0"
													data-tour="tour-model"
												>
													<Label
														htmlFor={modelSelectId}
														className="sr-only"
													>
														{t("form.modelLabel")}{" "}
														{modelName}
													</Label>
													<EngineSelect
														id={modelSelectId}
														className="h-8 w-auto max-w-32 gap-1 rounded-full border-none bg-transparent px-2 text-xs shadow-none hover:bg-accent"
														name={modelName}
														value={
															model?.app_id || ""
														}
														engineTypes={["MODEL"]}
														metaFilters={[
															{
																tag: "text-generation",
															},
														]}
														onChange={setModel}
														popoverContentProps={{
															align: "end",
														}}
													/>
												</span>
											</TooltipTrigger>
											<TooltipContent>
												{modelName ||
													t("form.modelLabel")}
											</TooltipContent>
										</Tooltip>
									)}
									<Tooltip disableHoverableContent={false}>
										<TooltipTrigger asChild>
											<span data-tour="tour-send">
												<Button
													variant="default"
													size="icon"
													className="rounded-full"
													aria-label={t(
														sendState === "stop"
															? "input.stopLabel"
															: "input.askLabel",
													)}
													disabled={sendDisabled}
													onClick={handleSendClick}
												>
													{sendState === "stop" ? (
														<Square
															aria-hidden="true"
															className="size-3 fill-current"
														/>
													) : sendState ===
														"loading" ? (
														<Spinner />
													) : (
														<ArrowUpIcon aria-hidden="true" />
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
									writeDraft(room.roomId, text);

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
						<BackspacePlugin
							onBackspace={(event) => {
								if (!isEmpty || files.length === 0) {
									return false;
								}
								event.preventDefault();
								removeFile(files.length - 1);
								return true;
							}}
						/>
						<AutoScrollOnPastePlugin
							scrollContainerRef={scrollViewportRef}
						/>
						<SlashMentionPlugin
							isLoading={isLoading}
							hasTools={latestResponseHasTools}
						/>
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
				<TeamworkDialogs
					teamwork={room.teamwork}
					onReturnFocus={() => menuTriggerRef.current?.focus()}
				/>
				{onMcpChange && (
					<MCPOverlay
						open={mcpOverlay.open}
						defaultTab={mcpOverlay.defaultTab}
						values={options.mcp}
						workspace={agentChipWorkspace}
						agentEditable={!!onWorkspaceChange}
						allowDefaultAgent={
							!!root.theme.featureFlags?.enableAgentHarness
						}
						disabled={isBusy}
						onClose={(next) => {
							setMcpOverlay((prev) => ({ ...prev, open: false }));
							editorRef.current?.focus();
							if (!next || isBusy) return;
							onMcpChange(next.mcp);
							if (onWorkspaceChange && "workspace" in next) {
								onWorkspaceChange(
									next.workspace ?? null,
									next.agentModeSelected ||
										mcpOverlay.defaultTab === "AGENT" ||
										next.workspace?.workspace_id !==
											options.workspace?.workspace_id,
								);
							}
						}}
					/>
				)}
			</div>
		);
	},
);
