import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { $getRoot, type LexicalEditor } from "lexical";
import {
	ArrowUpIcon,
	BookOpenIcon,
	MicIcon,
	PlusIcon,
	Square,
} from "lucide-react";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { EngineSelect, useCatalogImageUrl } from "@semoss/shared";
import {
	Avatar,
	AvatarImage,
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
} from "@semoss/ui/next";
import { useChatConfig } from "../../chat/config/chat-config.context";
import { ConnectorSignInNotice } from "../../connectors/accounts/connector-sign-in-notice";
import { useUserConnectorsSync } from "../../connectors/accounts/use-user-connectors-sync";
import type { RoomStore } from "../../room/store/room.store";
import type { CompactionStrategy } from "../../room/store/room-compaction";
import { useRoomSelector } from "../../room/store/use-room-selector";
import { AGENT_HARNESS_TYPE } from "../../room/turns/agent-turn-runner";
import { MCPOverlay } from "../../tools/mcp/mcp-overlay";
import type { MCPOverlayTab } from "../../tools/mcp/mcp-overlay-picker";
import { getAgentLabel, runsDefaultAgent } from "../../tools/mcp/mcp-utils";
import type { DraftWorkbenchPanels } from "../../workbench/rail/use-workbench-panels";
import { ContextItems } from "../attachments/context-items";
import { useFileDrop } from "../attachments/file-drop.context";
import { FilePreviewGrid } from "../attachments/file-preview-grid";
import { useContextItems } from "../attachments/use-context-items";
import {
	type Composer,
	ComposerContext,
	ComposerWorkbenchContext,
} from "./composer.context";
import { AutoScrollOnPastePlugin } from "./editor/auto-scroll-on-paste-plugin";
import { BackspacePlugin } from "./editor/backspace-plugin";
import { EnterPlugin } from "./editor/enter-plugin";
import { FocusPlugin } from "./editor/focus-plugin";
import { filterPastedFiles } from "./filter-pasted-files";
import { DefaultPlusMenu } from "./plus-menu/default-plus-menu";
import { getPromptHistory } from "./prompt-history";
import { PromptHistoryPlugin } from "./prompt-history-plugin";
import { PromptLibraryDialog } from "./prompt-library-dialog";
import { PromptOptimizer } from "./prompt-optimizer";
import { $setRootText, replaceEditorText } from "./replace-editor-text";
import { RoomContextUsageIndicator } from "./room-context-usage-indicator";
import { DefaultSlashCommands } from "./slash-command/default-slash-commands";
import { SlashCommandPlugin } from "./slash-command/slash-command-plugin";
import { SlashCommandRegistryProvider } from "./slash-command/slash-command-registry.context";
import { type ComposerSession, saveAgentOverlay } from "./use-composer-session";
import { useComposerSubmit } from "./use-composer-submit";
import { useSpeechToText } from "./use-speech-to-text";

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

/**
 * Which composer this is. An open room's stops and compacts its turns; a new
 * chat's picks its mode, opens its draft's panels, and can start from a prompt.
 */
export type RoomInputVariant =
	| {
			readonly kind: "room";
			/** Cancels the turn in flight, from the button's "stop" state. */
			readonly onStop: () => void;
			/** Compacts the conversation, also from the slash menu. */
			readonly onCompact: (strategy?: CompactionStrategy) => void;
			/** Whether a tool call waits for the user, which holds sending. */
			readonly hasOutstandingTools: boolean;
	  }
	| {
			readonly kind: "draft";
			/** Switches the draft to agent mode, from the + menu and the slash menu. */
			readonly onSwitchToAgentHarness: () => void;
			/** Switches the draft back to chat mode, likewise. */
			readonly onExitAgentHarness: () => void;
			/** Where the slash menu's Workspace panels open: the draft's room and its panel actions. */
			readonly draftWorkbench: {
				readonly room: RoomStore;
				readonly draftPanels: DraftWorkbenchPanels;
			};
			/** Text the editor starts with; a different one needs a new `key`. */
			readonly initialValue?: string;
			/** Holds sending while the draft's agent settings are resolved. */
			readonly isSubmitDisabled: boolean;
	  };

/** Props for {@link RoomInput}. */
interface RoomInputProps {
	/** Classes to override */
	className?: string;
	/** Whether the chat is busy, which holds sending and shows "thinking". */
	isLoading?: boolean;
	/** The room's or the draft's model, options and agent, and how they change. */
	session: ComposerSession;
	/** The room the composer sends to, or a new chat's draft. */
	room: RoomStore;
	/** Sends a prompt and its files. Throw, or return false, when it fails. */
	onPrompt: (prompt: string, files: File[]) => Promise<boolean>;
	/** Appearance of the send/stop button. Defaults to "send". */
	sendState?: SendButtonState;
	/** An open room's composer, or a new chat's. */
	variant: RoomInputVariant;
}

/**
 * The composer's input box, for an open room and a new chat:
 *
 * - a Lexical editor with the "/" slash menu and prompt history recall
 * - attachments from the enclosing `FileDropProvider` (drop, paste, or the
 *   file picker) beside the files queued for the next message
 * - the plus menu, the agent chip, and the knowledge, toolbox, and agent picker
 * - speech-to-text, the prompt library and optimizer, context usage, and the
 *   model select
 * - the send button, which stops a running turn
 *
 * Must render inside a `FileDropProvider`.
 */
export const RoomInput = ({
	className,
	isLoading = false,
	session,
	room,
	onPrompt,
	sendState = "send",
	variant,
}: RoomInputProps) => {
	const { t } = useTranslation("room");
	const modelSelectId = useId();
	const { model, options, agentTools, isAgentMode, agent } = session;
	const draft = variant.kind === "draft" ? variant : null;
	const hasOutstandingTools =
		variant.kind === "room" && variant.hasOutstandingTools;
	const onCompact = variant.kind === "room" ? variant.onCompact : undefined;
	const isSubmitDisabled = draft?.isSubmitDisabled ?? false;
	const predefinedPrompts = options.predefinedPrompts;

	// Editor state
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isScrollable, setIsScrollable] = useState(false);
	const [inputText, setInputText] = useState(draft?.initialValue ?? "");
	const isEmpty = inputText.length === 0;
	const { options: chatOptions, components } = useChatConfig();
	// a host's null places no menu; left out, the chat's own
	const PlusMenu =
		components?.PlusMenu === undefined
			? DefaultPlusMenu
			: components.PlusMenu;
	const SlashCommands =
		components?.SlashCommands === undefined
			? DefaultSlashCommands
			: components.SlashCommands;
	// connectors switched on or off in settings reach this chat at once
	useUserConnectorsSync(room.connectors);
	const history = useRoomSelector(room, (current) => current.history);
	const { roomId, latestResponseHasTools } = useRoomSelector(
		room,
		(current) => ({
			roomId: current.roomId,
			// Whether the latest response has unfinished tools — compaction
			// can't touch a response until all tool calls have resolved
			latestResponseHasTools:
				current.latestResponseMessage?.hasUnfinishedTools ?? false,
		}),
	);
	// runs once the plus menu has closed and given focus back, as opening a picker
	const afterMenuCloseRef = useRef<(() => void) | null>(null);
	const isBusy = isLoading || hasOutstandingTools || sendState !== "send";

	// MCP overlay state — managed here so the overlay renders outside the DropdownMenu's React subtree
	const [mcpOverlay, setMcpOverlay] = useState<{
		open: boolean;
		defaultTab: MCPOverlayTab;
	}>({ open: false, defaultTab: "KNOWLEDGE" });

	/** Open the knowledge, toolbox, or agent picker, after the plus menu closes when it is open. */
	const handleOpenMcpOverlay = (defaultTab: MCPOverlayTab) => {
		if (isBusy) return;
		const open = () => setMcpOverlay({ open: true, defaultTab });
		if (isMenuOpen) {
			afterMenuCloseRef.current = open;
			setIsMenuOpen(false);
		} else open();
	};

	// An open room flips its mode now (taking effect on the next message) and
	// persists harnessType so it survives a reload.
	const handleSwitchToAgentHarness =
		draft?.onSwitchToAgentHarness ??
		(() => {
			room.setMode("agent");
			room.updateRoomOptions({
				...room.options,
				harnessType: AGENT_HARNESS_TYPE,
			}).catch((e: unknown) => {
				console.error("Failed to persist agent harness mode", e);
			});
		});

	const agentChipWorkspace = options.workspace ?? null;
	const isDefaultAgent = runsDefaultAgent({
		workspace: agentChipWorkspace,
		isAgentMode,
	});
	const agentName = getAgentLabel({
		workspace: agentChipWorkspace,
		isAgentMode,
		defaultAgentLabel: t("modes.defaultAgent"),
	});
	const agentImageUrl = useCatalogImageUrl(
		"PROJECT",
		agentChipWorkspace?.workspace_id ?? "",
	);
	// the agent's image once it loads; the avatar stays empty, and hidden, when
	// the agent has none, and Default Agent has no image to load
	const agentChipIcon = agentImageUrl ? (
		<Avatar
			key={agentImageUrl}
			aria-hidden="true"
			className="size-5 rounded-sm empty:hidden"
		>
			<AvatarImage src={agentImageUrl} alt="" className="object-cover" />
		</Avatar>
	) : null;
	const modelName = model?.engine_display_name || model?.app_name || "";
	const historyEntries = useMemo(() => getPromptHistory(history), [history]);
	// a new room or branch starts a fresh prompt history session
	const historyKey = JSON.stringify([
		roomId,
		history.map((message) => message.id),
	]);

	// Refs for DOM elements and Lexical editor
	const editorRef = useRef<LexicalEditor>(null);
	const contentEditableRef = useRef<HTMLDivElement>(null);
	const scrollViewportRef = useRef<HTMLElement | null>(null);
	// the scroll check waits for the browser to lay out the new content
	const scrollCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(
		() => () => {
			if (scrollCheckRef.current !== null) {
				clearTimeout(scrollCheckRef.current);
			}
		},
		[],
	);

	// Bridge setInput() (PromptOptimizer) -> Lexical editor content
	const setInputFromOptimizer: React.Dispatch<
		React.SetStateAction<string>
	> = (nextValue) => {
		const next =
			typeof nextValue === "function" ? nextValue(inputText) : nextValue;
		setInputText(next);
		replaceEditorText(editorRef.current, next);
		editorRef.current?.focus();
	};

	// File handling
	const { files, addFiles, removeFile, clearFiles } = useFileDrop();
	const queuedFileCount = useContextItems(
		room.contextItems,
		(state) => state.items.length,
	);
	const hasAttachments = files.length > 0 || queuedFileCount > 0;

	const speech = useSpeechToText(editorRef);
	const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
	const { submit, runPrompt } = useComposerSubmit({
		editorRef,
		onPrompt,
		files,
		addFiles,
		clearFiles,
		isLoading,
		isSubmitDisabled,
		hasOutstandingTools,
		isBusy,
	});

	const workbenchRoom = draft?.draftWorkbench.room ?? room;
	const draftPanels = draft?.draftWorkbench.draftPanels;
	// what the plus menu's items and the "/" menu's commands act through
	const composer: Composer = {
		room: room,
		isDraft: draft !== null,
		isBusy: isBusy,
		options: options,
		agentTools: agentTools,
		isAgentMode: isAgentMode,
		agent: agent,
		closeMenu: () => setIsMenuOpen(false),
		openPicker: handleOpenMcpOverlay,
		switchToAgent: handleSwitchToAgentHarness,
		switchToChat: draft?.onExitAgentHarness ?? null,
		compact: onCompact ? () => onCompact() : null,
		prompts: predefinedPrompts,
		runPrompt: (prompt) => void runPrompt(prompt.context),
		prepareRoom: draftPanels
			? draftPanels.prepareRoom
			: () => Promise.resolve(room),
	};

	// Find and cache the ScrollArea viewport element
	useEffect(() => {
		if (contentEditableRef.current) {
			const viewport = contentEditableRef.current.closest(
				"[data-radix-scroll-area-viewport]",
			);
			scrollViewportRef.current = viewport as HTMLElement | null;
		}
	}, []);

	// Button appearance is fully decided by sendState (computed by the
	// parent from the turn + cancel state); only the idle "send" case needs
	// the local editor/tool signals to decide enablement + tooltip.
	const isSendDisabled =
		sendState === "loading" ||
		(sendState === "send" &&
			(isEmpty || isSubmitDisabled || hasOutstandingTools));
	const handleSendClick = () => {
		if (sendState === "stop") {
			if (variant.kind === "room") variant.onStop();
		} else if (sendState === "send") {
			void submit();
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
	const initialValue = draft?.initialValue;

	return (
		<div className="relative w-full" data-tour="tour-input">
			<ComposerContext.Provider value={composer}>
				<ComposerWorkbenchContext.Provider
					value={{
						room: workbenchRoom,
						draftPanels: draftPanels,
					}}
				>
					<SlashCommandRegistryProvider
						commands={SlashCommands ? <SlashCommands /> : null}
					>
						<LexicalComposer
							initialConfig={{
								namespace: "RoomInput",
								theme: {},
								// a prompt handed in, such as from a route
								editorState: initialValue
									? () => $setRootText(initialValue)
									: undefined,
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
									<ConnectorSignInNotice
										connectors={room.connectors}
									/>
								</div>
								{hasAttachments && (
									// Need pb-1 for scroll bar
									<div className="max-h-24 shrink-0 overflow-y-auto bg-card p-3 pb-1">
										{files.length > 0 &&
											chatOptions.fileDragDisclaimer && (
												<P className="-mt-1 pb-2 text-muted-foreground text-xs">
													{
														chatOptions.fileDragDisclaimer
													}
												</P>
											)}
										<FilePreviewGrid
											files={files}
											onRemoveFile={removeFile}
											leading={
												<ContextItems
													contextItems={
														room.contextItems
													}
												/>
											}
										/>
									</div>
								)}
								<div className="flex min-h-0 min-w-0 flex-1 items-stretch overflow-hidden">
									{chatOptions.hasPromptOptimizer && (
										<div
											className={cn(
												"shrink-0 ps-2",
												hasAttachments
													? "pt-0"
													: "pt-3",
											)}
										>
											<PromptOptimizer
												input={inputText}
												onInputChange={
													setInputFromOptimizer
												}
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
													"flex min-h-0 min-w-0 flex-1 flex-col bg-card *:data-[slot=scroll-area-viewport]:min-h-0 *:data-[slot=scroll-area-viewport]:flex-1",
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
															chatOptions.hasPromptOptimizer &&
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
															const pasted =
																filterPastedFiles(
																	e.clipboardData,
																);
															if (
																pasted.length >
																0
															) {
																e.preventDefault();
																addFiles(
																	pasted,
																);
															}
														}}
													/>
													{isEmpty && (
														<div
															className={cn(
																"pointer-events-none col-start-1 row-start-1 select-none px-4 pb-3 text-base text-muted-foreground",
																chatOptions.hasPromptOptimizer &&
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
										{PlusMenu && (
											<DropdownMenu
												open={isMenuOpen}
												onOpenChange={setIsMenuOpen}
											>
												<Tooltip
													disableHoverableContent={
														false
													}
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
																	"input.addToChat",
																)}
																data-tour="tour-input-menu"
															>
																<PlusIcon aria-hidden="true" />
															</Button>
														</DropdownMenuTrigger>
													</TooltipTrigger>
													<TooltipContent>
														{t("input.addToChat")}
													</TooltipContent>
												</Tooltip>
												<DropdownMenuContent
													align="start"
													className="w-72"
													onCloseAutoFocus={(
														event,
													) => {
														const action =
															afterMenuCloseRef.current;
														if (!action) return;
														event.preventDefault();
														afterMenuCloseRef.current =
															null;
														action();
													}}
												>
													<PlusMenu />
												</DropdownMenuContent>
											</DropdownMenu>
										)}
										{(agentChipWorkspace ||
											isDefaultAgent) && (
											<Tooltip
												disableHoverableContent={false}
											>
												<TooltipTrigger asChild>
													{agent.kind !== "fixed" ? (
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
															{agentChipIcon}
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
															{agentChipIcon}
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
													disableHoverableContent={
														false
													}
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
															disabled={
																!speech.canListen
															}
															aria-pressed={
																speech.isListening
															}
															aria-label={t(
																speech.isListening
																	? "input.stopRecording"
																	: "input.record",
															)}
															onClick={
																speech.toggle
															}
														>
															<MicIcon
																aria-hidden="true"
																className={cn(
																	speech.isListening &&
																		"text-destructive",
																)}
															/>
														</Button>
													</span>
												</TooltipTrigger>
												<TooltipContent>
													{t(
														!speech.canListen
															? "input.recordUnavailable"
															: speech.isListening
																? "input.stopRecording"
																: "input.record",
													)}
												</TooltipContent>
											</Tooltip>
										</div>
										{chatOptions.isModelSelectable && (
											<Tooltip
												disableHoverableContent={false}
											>
												<TooltipTrigger asChild>
													<span
														className="inline-flex min-w-0"
														data-tour="tour-model"
													>
														<Label
															htmlFor={
																modelSelectId
															}
															className="sr-only"
														>
															{t(
																"form.modelLabel",
															)}{" "}
															{modelName}
														</Label>
														<EngineSelect
															id={modelSelectId}
															className="h-8 w-auto max-w-44 gap-1 rounded-full border-none bg-transparent px-2 text-xs shadow-none hover:bg-accent"
															name={modelName}
															value={
																model?.app_id ||
																""
															}
															engineTypes={[
																"MODEL",
															]}
															metaFilters={[
																{
																	tag: "text-generation",
																},
															]}
															onChange={
																session.onModelChange
															}
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
										<Tooltip
											disableHoverableContent={false}
										>
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
														disabled={
															isSendDisabled
														}
														onClick={
															handleSendClick
														}
													>
														{sendState ===
														"stop" ? (
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

										// the text, which also disables send while empty
										setInputText(root.getTextContent());

										// Check if content is scrollable
										if (scrollCheckRef.current !== null) {
											clearTimeout(
												scrollCheckRef.current,
											);
										}
										scrollCheckRef.current = setTimeout(
											() => {
												scrollCheckRef.current = null;
												const viewport =
													scrollViewportRef.current;
												if (viewport) {
													// Check if content is scrollable
													setIsScrollable(
														viewport.scrollHeight >
															viewport.clientHeight,
													);
												}
											},
											0,
										);
									});
								}}
							/>
							<HistoryPlugin />
							<AutoFocusPlugin />
							<FocusPlugin />
							<EditorRefPlugin editorRef={editorRef} />
							<EnterPlugin onEnter={() => void submit()} />
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
							{SlashCommands && (
								<SlashCommandPlugin
									isLoading={isLoading}
									hasTools={latestResponseHasTools}
								/>
							)}
							<PromptLibraryDialog
								open={isPromptLibraryOpen}
								onOpenChange={setIsPromptLibraryOpen}
								prompts={predefinedPrompts}
								isLoading={isLoading}
								onSelectPrompt={(prompt) =>
									runPrompt(prompt.context)
								}
							/>
						</LexicalComposer>
					</SlashCommandRegistryProvider>
				</ComposerWorkbenchContext.Provider>
			</ComposerContext.Provider>
			<MCPOverlay
				open={mcpOverlay.open}
				defaultTab={mcpOverlay.defaultTab}
				values={options.mcp}
				workspace={agentChipWorkspace}
				agentTools={agentTools}
				agent={agent}
				disabled={isBusy}
				onClose={(next) => {
					setMcpOverlay((prev) => ({ ...prev, open: false }));
					editorRef.current?.focus();
					if (next && !isBusy) saveAgentOverlay(session, next);
				}}
			/>
		</div>
	);
};
