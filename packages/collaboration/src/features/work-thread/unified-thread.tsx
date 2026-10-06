import { ArrowLeft } from "lucide-react";
import {
	type ComponentRef,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@semoss/ui/next";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { CollaborationHeaderContext } from "@/features/collaboration/components/collaboration-header.context";
import { restoreThreadFocus } from "@/features/collaboration/components/thread-menu.utils";
import type {
	Thread,
	ThreadContext,
	ThreadWorkspace,
} from "@/features/collaboration/state/collaboration.types";
import { DeleteEmailDialog } from "@/features/connectors/components/delete-email-dialog";
import type { SourceAttachment } from "@/features/connectors/types";
import { DailyChatHeader } from "@/features/daily-chat/daily-chat-header";
import { BriefContextRail } from "@/features/dashboard/brief-context-rail";
import { RoomConversation } from "@/features/rooms/components/room-conversation";
import { RoomRunStatus } from "@/features/rooms/components/room-run-status";
import {
	lastSubmittedContext,
	presentThreadApprovals,
	presentThreadMessages,
	type SubmittedThreadContext,
	submittedThreadContext,
} from "@/features/thread-assistant/thread-context";
import {
	canStartNewConversation,
	type ThreadSession,
} from "@/features/thread-assistant/thread-session";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { AssistantComposer } from "./assistant-composer";
import { startNewConversation } from "./new-conversation-button";
import type { ThreadActionRequest } from "./thread-action-request";
import { presentThreadInsights } from "./thread-insights";
import { ThreadQuickActions } from "./thread-quick-actions";
import {
	isEditorSend,
	useEmailSendApprovals,
} from "./use-email-send-approvals";
import { useThreadActionRequest } from "./use-thread-action-request";
import { useThreadDraftProposals } from "./use-thread-draft-proposals";
import { useThreadWorkbenchRequest } from "./use-thread-workbench-request";
import { useWorkComposerSession } from "./work-composer-state.context";
import { WORK_ASSISTANT } from "./work-conversation";
import { WorkEmailContext } from "./work-email.context";
import { WorkPaneControls } from "./work-pane-controls";
import { chatPanelTarget, workPanelTarget } from "./work-pane-layout";
import { WORK_PANEL_TYPES } from "./work-panel.constants";
import { WorkPanelMenu } from "./work-panel-menu";
import { WorkThreadContext } from "./work-thread-context";
import { WorkWorkbenchClose } from "./work-workbench-close";

const DEFAULT_WORKBENCH_SIZE = 65;

/** One conversation scrollbar, one session owner, and a dock that stays mounted while concealed. */
export function UnifiedThread({
	thread,
	isSourceFreeSession = false,
	isNewChat = false,
	userName,
	workspace,
	context,
	session,
	snapshot,
	header,
	inspector,
	attachments,
	sourceUid,
	onEmailSent,
	onSent,
	onSubmitStart,
}: {
	thread: Thread;
	/** Source-free tasks share Brief's page canvas and daily context. */
	isSourceFreeSession?: boolean;
	/** /new owns the Ask panel until the first valid submission starts. */
	isNewChat?: boolean;
	/** Existing profile display name, used only in the fresh-task greeting. */
	userName?: string;
	workspace: ThreadWorkspace;
	context: ThreadContext;
	session: ThreadSession;
	snapshot: ReturnType<ThreadSession["getSnapshot"]>;
	header?: ReactNode;
	inspector: ReactNode;
	attachments: SourceAttachment[];
	sourceUid?: string;
	onEmailSent?: () => void;
	/** Notify callers after the existing composer accepts a turn. */
	onSent?: () => void;
	/** Open the thread after validation, before asynchronous preparation. */
	onSubmitStart?: () => void;
}) {
	const headerControls = useContext(CollaborationHeaderContext);
	const composer = useWorkComposerSession(thread.id);
	const memory = useSyncExternalStore(
		composer.subscribe,
		composer.getSnapshot,
		composer.getSnapshot,
	);
	const [settingsSection, setSettingsSection] = useState<
		"chat" | "thread" | "advanced"
	>("chat");
	const [deleteEmailId, setDeleteEmailId] = useState<string | null>(null);
	const [focusRequest, setFocusRequest] = useState(0);
	const isHistoryReady =
		!snapshot.isLoading &&
		!snapshot.turn.isRestoring &&
		!snapshot.error &&
		!snapshot.turn.transportError;
	const isLanding = isSourceFreeSession && isNewChat;
	const topicId = thread.topicLinks.find(
		(link) => link.primary && link.source !== "suggested",
	)?.topicId;
	const isComposerOpen = true;
	useEffect(() => {
		if (isHistoryReady && memory.mode === null)
			composer.setMode("assistant");
	}, [composer, isHistoryReady, memory.mode]);
	const fieldId = useId();
	const workbench = useToolWorkbench();
	const activePane = workbench.isOpen;
	const [isNarrow, setIsNarrow] = useState(true);
	const [isChatCollapsed, setIsChatCollapsed] = useState(false);
	const [resumeSignal, setResumeSignal] = useState(0);
	const root = useRef<HTMLDivElement>(null);
	const conversationPanel = useRef<ComponentRef<typeof ResizablePanel>>(null);
	const sidePanel = useRef<ComponentRef<typeof ResizablePanel>>(null);
	const closeButton = useRef<HTMLButtonElement>(null);
	const paneRef = useRef<HTMLElement>(null);
	const actionsTriggerId = `${fieldId}-actions`;
	const isAdjusting = useRef(false);
	const split = useRef(DEFAULT_WORKBENCH_SIZE);
	const fullPane = isNarrow || isChatCollapsed;
	const emailTrigger = useRef<HTMLElement | null>(null);
	const [workbenchFocusRequest, setWorkbenchFocusRequest] = useState(0);
	const { openWorkbench } = workbench;
	const revealEmailPanel = useCallback(
		(
			type: string,
			config: Record<string, unknown>,
			name: string,
			trigger?: HTMLElement,
		) => {
			const current =
				trigger ??
				(document.activeElement instanceof HTMLElement
					? document.activeElement
					: null);
			if (current && !paneRef.current?.contains(current))
				emailTrigger.current = current;
			workbench.store
				.getState()
				.layout.actions.selectPanel(type, config, {
					name,
					target: isSourceFreeSession
						? chatPanelTarget(workbench.store.getState().layout)
						: workPanelTarget(workbench.store.getState().layout),
				});

			openWorkbench();
			setWorkbenchFocusRequest((value) => value + 1);
		},
		[isSourceFreeSession, openWorkbench, workbench.store],
	);
	const openEmail = useCallback(
		(
			itemId: string,
			kind: "source" | "tool" = "source",
			trigger?: HTMLElement,
		) => {
			revealEmailPanel(
				WORK_PANEL_TYPES.EMAIL,
				{ kind, itemId },
				kind === "tool" ? "Email draft" : thread.subject || "Email",
				trigger,
			);
		},
		[revealEmailPanel, thread.subject],
	);
	useEffect(() => {
		const request = memory.emailRequest;
		if (!request) return;
		const draft = memory.emailDrafts.find(
			(item) => item.seed.id === request.id,
		);
		if (draft)
			revealEmailPanel(
				WORK_PANEL_TYPES.DRAFT,
				{ draftId: request.id },
				draft.seed.mode === "reply"
					? "Reply draft"
					: draft.seed.mode === "forward"
						? "Forward draft"
						: "Email draft",
			);
		composer.consumeEmailRequest(request);
	}, [composer, memory.emailRequest, memory.emailDrafts, revealEmailPanel]);
	const handleOpenWorkbench = useCallback(() => {
		emailTrigger.current = null;
		openWorkbench();
		setWorkbenchFocusRequest((value) => value + 1);
	}, [openWorkbench]);
	const handleOpenPanel = useCallback(
		(trigger?: HTMLElement | null) => {
			emailTrigger.current = trigger ?? null;
			openWorkbench();
			setWorkbenchFocusRequest((value) => value + 1);
		},
		[openWorkbench],
	);
	useThreadWorkbenchRequest(thread.id, handleOpenWorkbench);
	useEffect(() => {
		if (!activePane || workbenchFocusRequest === 0) return;
		const frame = requestAnimationFrame(() => {
			const initial = Array.from(
				paneRef.current?.querySelectorAll<HTMLElement>(
					'[data-workbench-initial-focus="true"]',
				) ?? [],
			).find((element) => element.getClientRects().length > 0);
			if (initial) initial.focus();
			else if (fullPane) closeButton.current?.focus();
			else paneRef.current?.focus();
		});
		return () => cancelAnimationFrame(frame);
	}, [activePane, fullPane, workbenchFocusRequest]);
	const handleCloseRef = useCallback(
		(node: HTMLButtonElement | null) => {
			closeButton.current = node;
			if (node && activePane && fullPane) node.focus();
		},
		[activePane, fullPane],
	);
	useEffect(() => {
		const element = root.current;
		if (!element) return;
		const observer = new ResizeObserver(([entry]) => {
			if (entry) setIsNarrow(entry.contentRect.width < 1024);
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	useLayoutEffect(() => {
		isAdjusting.current = true;
		const preferredSplit = split.current;
		if (!activePane) {
			sidePanel.current?.collapse();
			conversationPanel.current?.resize(100);
		} else if (fullPane) {
			conversationPanel.current?.collapse();
			sidePanel.current?.resize(100);
		} else {
			conversationPanel.current?.expand();
			sidePanel.current?.resize(preferredSplit);
		}
		const frame = requestAnimationFrame(() => {
			isAdjusting.current = false;
		});
		return () => cancelAnimationFrame(frame);
	}, [activePane, fullPane]);
	const messages = useMemo(
		() =>
			presentThreadMessages(snapshot.turn.messages)
				.map(presentThreadInsights)
				.filter((message) => message.visible !== false),
		[snapshot.turn.messages],
	);
	const allowedSources = useMemo(
		() =>
			new Set([
				...context.messages.map((m) => m.id),
				...context.emptyIds,
			]),
		[context.messages, context.emptyIds],
	);
	useLayoutEffect(() => {
		composer.setIncludedSources(allowedSources);
	}, [composer, allowedSources]);
	const proposalError = useThreadDraftProposals({
		thread,
		composer,
		snapshot,
		allowedSources,
		isReady: isHistoryReady,
		loadAttachment: session.readEmailAttachment,
	});
	useEmailSendApprovals(composer, workbench);
	// sends for an open editor email are decided on their chat card
	const statusApprovals = useMemo(
		() =>
			presentThreadApprovals(
				snapshot.turn.pendingApprovals.filter(
					(approval) =>
						!memory.emailDrafts.some((draft) =>
							isEditorSend(
								approval,
								workbench.tools,
								draft.seed.id,
							),
						),
				),
			),
		[snapshot.turn.pendingApprovals, memory.emailDrafts, workbench.tools],
	);
	const handleThreadAction = useCallback(
		(request: ThreadActionRequest) => {
			if (request.action === "ask") {
				if (
					request.sourceMessageId &&
					!allowedSources.has(request.sourceMessageId)
				) {
					composer.setError(
						"Include this email in assistant context before asking about it.",
					);
					return;
				}
				setIsChatCollapsed(false);
				if (isNarrow) workbench.closeWorkbench();
				composer.setSourceMessage(request.sourceMessageId);
				composer.setMode("assistant");
				if (request.prompt) composer.seedPrompt(request.prompt);
				setFocusRequest((value) => value + 1);
				return;
			}
			if (request.action === "new-email") {
				composer.requestEmailDraft({
					id: `new:${thread.id}`,
					mode: "new",
					subject: "",
				});
				return;
			}
			const target = request.sourceMessageId ?? sourceUid;
			if (
				!target ||
				!workspace.messages.some((message) => message.id === target)
			) {
				composer.setError(
					"This source email is not available. Reopen the thread to load it.",
				);
				return;
			}
			if (request.action === "delete") {
				setDeleteEmailId(target);
				return;
			}
			if (request.action === "read") {
				openEmail(target);
				return;
			}
			if (request.action === "forward") {
				composer.requestEmailDraft({
					id: `forward:${target}`,
					mode: "forward",
					sourceUid: target,
					subject: thread.subject,
				});
				return;
			}
			const draft = composer.openReply(
				target,
				thread.subject,
				request.action === "draft",
			);
			if (request.action === "draft") {
				composer.setMode("assistant");
				void composer.getDraftAssistant(draft).generate({
					session,
					title: thread.subject,
					context: {
						...submittedThreadContext(context),
						...(composer.getSnapshot().referenceResults.length
							? {
									referenceResults:
										composer.getSnapshot().referenceResults,
								}
							: {}),
					},
					isSourceIncluded: () => composer.isSourceIncluded(target),
					submit: (operation) => composer.submitAction(operation),
				});
			}
		},
		[
			isNarrow,
			workbench.closeWorkbench,
			allowedSources,
			composer,
			context,
			openEmail,
			session,
			sourceUid,
			thread.id,
			thread.subject,
			workspace.messages,
		],
	);
	useThreadActionRequest(
		thread.id,
		composer,
		true, // The source workspace is loaded before this view mounts.
		handleThreadAction,
		true, // Open immediately; generation awaits assistant initialization.
	);
	const submitted = lastSubmittedContext(snapshot.turn.messages, thread.id);
	const closePane = () => {
		setIsChatCollapsed(false);
		const workbenchRestoresFocus = workbench.closeWorkbench();
		const returnTarget = emailTrigger.current;
		emailTrigger.current = null;
		if (workbenchRestoresFocus && !returnTarget) return;
		requestAnimationFrame(() =>
			restoreThreadFocus(
				returnTarget?.isConnected
					? returnTarget
					: document.getElementById(actionsTriggerId),
			),
		);
	};
	const nextContext: SubmittedThreadContext = {
		...submittedThreadContext(context),
		...(composer.getSnapshot().referenceResults.length
			? { referenceResults: composer.getSnapshot().referenceResults }
			: {}),
	};
	const backToFeed = (
		<Button
			asChild
			variant="ghost"
			size="icon-sm"
			className="pointer-coarse:size-11 shrink-0 text-muted-foreground"
		>
			<Link to="/work" aria-label="Back to feed" title="Back to feed">
				<ArrowLeft aria-hidden="true" />
			</Link>
		</Button>
	);
	return (
		<WorkEmailContext.Provider
			value={{ thread, workspace, composer, allowedSources, openEmail }}
		>
			<WorkThreadContext.Provider
				value={{
					session,
					snapshot,
					title: thread.subject,
					conversationKind: isSourceFreeSession
						? "chat"
						: "source-thread",
					onOpenPanel: handleOpenPanel,
					settingsSection,
					setSettingsSection,
					onEmailSent,
					contextPanel: {
						context: nextContext,
						submitted,
						children: inspector,
					},
				}}
			>
				<WorkbenchProvider store={workbench.store}>
					{deleteEmailId && (
						<DeleteEmailDialog
							sourceId={deleteEmailId}
							subject={
								workspace.messages.find(
									(message) => message.id === deleteEmailId,
								)?.subject || thread.subject
							}
							onClose={() => setDeleteEmailId(null)}
						/>
					)}
					<div
						ref={root}
						className={cn(
							"flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
							isLanding && "px-4 py-6 sm:px-6 lg:p-8",
						)}
					>
						<div
							className={cn(
								"flex min-h-0 min-w-0 flex-1 flex-col",
								isLanding && "mx-auto w-full max-w-screen-2xl",
							)}
						>
							{isLanding && (
								<DailyChatHeader
									threadId={thread.id}
									title={thread.subject}
									userName={userName}
									topicId={topicId}
									isWorkbenchOpen={activePane}
									isNewChat={isLanding}
								/>
							)}
							<div
								className={cn(
									"flex min-h-0 min-w-0 flex-1",
									isLanding && "gap-4",
								)}
							>
								<ResizablePanelGroup
									direction="horizontal"
									keyboardResizeBy={5}
									className="min-h-0 min-w-0 flex-1"
									onLayout={(sizes) => {
										if (
											!isAdjusting.current &&
											activePane &&
											!fullPane &&
											sizes[1] > 0
										)
											split.current = sizes[1];
									}}
								>
									<ResizablePanel
										ref={conversationPanel}
										id={`${fieldId}-conversation`}
										order={1}
										defaultSize={35}
										minSize={fullPane ? 0 : 20}
										collapsible
										collapsedSize={0}
									>
										<RoomConversation
											agent={
												snapshot.agent ?? WORK_ASSISTANT
											}
											title={thread.subject}
											conversationId={thread.id}
											thread={messages}
											isLoadingHistory={
												snapshot.isLoading ||
												snapshot.turn.isRestoring
											}
											resumeSignal={resumeSignal}
											phase={snapshot.turn.phase}
											hasObservationIssue={Boolean(
												snapshot.error ||
													snapshot.turn
														.transportError,
											)}
											isLanding={isLanding}
											isHidden={Boolean(
												activePane && fullPane,
											)}
											isToolWorkbenchOpen={activePane}
											onToggleToolWorkbench={() => {
												if (activePane) closePane();
												else handleOpenPanel();
											}}
											headerActions={
												<>
													{header}
													{activePane &&
														!isNarrow && (
															<WorkPaneControls
																isWorkbenchOpen={
																	activePane
																}
																isChatVisible={
																	!isChatCollapsed
																}
																isCompact={
																	false
																}
																onToggleChat={() =>
																	setIsChatCollapsed(
																		(
																			value,
																		) =>
																			!value,
																	)
																}
															/>
														)}
												</>
											}
											transcriptActions={
												isHistoryReady ? (
													<ThreadQuickActions
														isDraftDisabled={
															!sourceUid
														}
														hasSourceEmail={Boolean(
															sourceUid,
														)}
														isAssistantOpen={
															isComposerOpen
														}
														onSelect={(mode) =>
															handleThreadAction({
																id: crypto.randomUUID(),
																threadId:
																	thread.id,
																action:
																	mode ===
																	"draft"
																		? "draft"
																		: "ask",
																sourceMessageId:
																	sourceUid,
															})
														}
													/>
												) : null
											}
											status={
												<>
													<RoomRunStatus
														agent={
															snapshot.agent ??
															WORK_ASSISTANT
														}
														turnError={
															snapshot.turn
																.turnError
														}
														transportError={
															snapshot.turn
																.transportError
														}
														pendingApprovals={
															statusApprovals
														}
														onReconnect={
															session.reconnect
														}
														onNewConversation={
															canStartNewConversation(
																snapshot,
															)
																? () =>
																		startNewConversation(
																			session,
																		)
																: undefined
														}
														reviewInWorkbench
													/>
													{proposalError && (
														<Alert variant="destructive">
															<AlertDescription>
																{proposalError}
															</AlertDescription>
														</Alert>
													)}
												</>
											}
											composer={
												<AssistantComposer
													presentation={
														isLanding
															? "new-chat"
															: "room"
													}
													onEmailSent={onEmailSent}
													composerSession={composer}
													isOpen={isComposerOpen}
													focusRequest={focusRequest}
													actionsTriggerId={
														actionsTriggerId
													}
													session={session}
													snapshot={snapshot}
													title={thread.subject}
													sourceUid={sourceUid}
													sourceUrl={
														thread.source
															?.webLink ??
														workspace.messages.find(
															(message) =>
																message.id ===
																sourceUid,
														)?.webLink
													}
													attachments={attachments}
													context={nextContext}
													onSent={() => {
														setResumeSignal(
															(n) => n + 1,
														);
														onSent?.();
													}}
													onSubmitStart={
														onSubmitStart
													}
												/>
											}
										/>
									</ResizablePanel>
									<ResizableHandle
										aria-label="Resize conversation and workbench"
										disabled={!activePane || fullPane}
										className={cn(
											(!activePane || fullPane) &&
												"hidden",
										)}
										withHandle
									/>
									<ResizablePanel
										ref={sidePanel}
										id={`${fieldId}-panel`}
										order={2}
										defaultSize={65}
										minSize={fullPane ? 0 : 25}
										maxSize={fullPane ? 100 : 80}
										collapsible
										collapsedSize={0}
									>
										<aside
											ref={paneRef}
											tabIndex={-1}
											id={`${fieldId}-workbench`}
											aria-label="Thread workbench"
											hidden={!activePane}
											className={cn(
												"@container/workspace size-full min-h-0 flex-col bg-background focus-visible:outline-2 focus-visible:outline-ring",
												activePane ? "flex" : "hidden",
											)}
										>
											<div
												className={cn(
													"relative min-h-0 flex-1",
													"[&_[data-rail=top]]:h-8 [&_[data-rail=top]]:py-px",
													"[&_[data-slot=workbench-mobile-toolbar]]:h-12 [&_[data-slot=workbench-mobile-toolbar]]:py-px",
													"[&_[data-rail=top]:has(>[role=tablist]:empty)>[data-slot=separator]]:hidden",
												)}
											>
												<Workbench
													snapshot={
														workbench.snapshot
													}
													layoutMode={
														isNarrow
															? "compact"
															: "auto"
													}
													mobileTopBorder="toolbar"
													borderSlots={{
														top: {
															before: (
																<>
																	{fullPane &&
																		backToFeed}
																	{isChatCollapsed &&
																		(isLanding ||
																			headerControls ===
																				undefined) &&
																		!isNarrow && (
																			<WorkPaneControls
																				isWorkbenchOpen={
																					activePane
																				}
																				isChatVisible={
																					false
																				}
																				isCompact={
																					false
																				}
																				onToggleChat={() =>
																					setIsChatCollapsed(
																						false,
																					)
																				}
																			/>
																		)}
																	<WorkPanelMenu />
																</>
															),
															after: (
																<WorkWorkbenchClose
																	isFullWidth={
																		isNarrow
																	}
																	buttonRef={
																		handleCloseRef
																	}
																	onClose={
																		closePane
																	}
																/>
															),
														},
													}}
												/>
											</div>
										</aside>
									</ResizablePanel>
								</ResizablePanelGroup>
								{isLanding && !activePane && (
									<div className="hidden w-80 shrink-0 overflow-y-auto xl:block 2xl:w-96">
										<BriefContextRail
											topicId={topicId}
											className="space-y-4 bg-transparent p-0"
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				</WorkbenchProvider>
			</WorkThreadContext.Provider>
		</WorkEmailContext.Provider>
	);
}
