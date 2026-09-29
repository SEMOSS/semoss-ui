import { ArrowLeft } from "lucide-react";
import {
	type ComponentRef,
	type ReactNode,
	useCallback,
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
import {
	restoreThreadFocus,
	threadMenuTriggerId,
} from "@/features/collaboration/components/thread-menu.utils";
import type {
	Thread,
	ThreadContext,
	ThreadWorkspace,
} from "@/features/collaboration/state/collaboration.types";
import type { SourceAttachment } from "@/features/connectors/types";
import { RoomRunStatus } from "@/features/rooms/components/room-run-status";
import {
	lastSubmittedContext,
	type SubmittedThreadContext,
} from "@/features/thread-assistant/thread-context";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { AssistantComposer } from "./assistant-composer";
import type { ThreadActionRequest } from "./thread-action-request";
import { ThreadQuickActions } from "./thread-quick-actions";
import { useThreadActionRequest } from "./use-thread-action-request";
import { useThreadDraftProposals } from "./use-thread-draft-proposals";
import { useThreadWorkbenchRequest } from "./use-thread-workbench-request";
import { useWorkComposerSession } from "./work-composer-state.context";
import { WORK_ASSISTANT, WorkConversation } from "./work-conversation";
import { WorkDraftCard } from "./work-draft-card";
import { WorkEmailContext } from "./work-email.context";
import { WORK_PANEL_TYPES } from "./work-panel.constants";
import { WorkPanelMenu } from "./work-panel-menu";
import { WorkThreadContext } from "./work-thread-context";
import { workTimeline } from "./work-timeline";
import { WorkWorkbenchClose } from "./work-workbench-close";

const DEFAULT_WORKBENCH_SIZE = 40;
const DRAFT_WORKBENCH_SIZE = 70;

/** One conversation scrollbar, one session owner, and a dock that stays mounted while concealed. */
export function UnifiedThread({
	thread,
	workspace,
	context,
	session,
	snapshot,
	header,
	inspector,
	attachments,
	sourceUid,
	onEmailSent,
}: {
	thread: Thread;
	workspace: ThreadWorkspace;
	context: ThreadContext;
	session: ThreadSession;
	snapshot: ReturnType<ThreadSession["getSnapshot"]>;
	header: ReactNode;
	inspector: ReactNode;
	attachments: SourceAttachment[];
	sourceUid?: string;
	onEmailSent?: () => void;
}) {
	const composer = useWorkComposerSession(thread.id);
	const memory = useSyncExternalStore(
		composer.subscribe,
		composer.getSnapshot,
		composer.getSnapshot,
	);
	const [focusRequest, setFocusRequest] = useState(0);
	const hasActivity =
		snapshot.turn.messages.length > 0 ||
		snapshot.turn.isRunning ||
		snapshot.turn.isSubmitting ||
		snapshot.turn.pendingApprovals.length > 0 ||
		snapshot.hasUnconfirmedSubmission ||
		snapshot.isCreationUncertain;
	const isHistoryReady =
		!snapshot.isLoading &&
		!snapshot.turn.isRestoring &&
		!snapshot.error &&
		!snapshot.turn.transportError;
	const isComposerOpen =
		memory.mode === "assistant" || (isHistoryReady && hasActivity);
	useEffect(() => {
		if (isHistoryReady && hasActivity && memory.mode === null)
			composer.setMode("assistant");
	}, [composer, isHistoryReady, hasActivity, memory.mode]);
	const fieldId = useId();
	const workbench = useToolWorkbench();
	const activePane = workbench.isOpen;
	const [isNarrow, setIsNarrow] = useState(true);
	const [resumeSignal, setResumeSignal] = useState(0);
	const root = useRef<HTMLDivElement>(null);
	const conversationPanel = useRef<ComponentRef<typeof ResizablePanel>>(null);
	const sidePanel = useRef<ComponentRef<typeof ResizablePanel>>(null);
	const closeButton = useRef<HTMLButtonElement>(null);
	const paneRef = useRef<HTMLElement>(null);
	const actionsTriggerId = `${fieldId}-actions`;
	const isAdjusting = useRef(false);
	const split = useRef(DEFAULT_WORKBENCH_SIZE);
	const firstSeen = useRef(new Map<string, string>());
	const roomId = snapshot.association?.roomId ?? "";
	const fullPane = isNarrow;
	const openedFromMenu = useRef(false);
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
				.layout.actions.selectPanel(type, config, { name });
			if (type === WORK_PANEL_TYPES.DRAFT) {
				split.current = DRAFT_WORKBENCH_SIZE;
				if (activePane && !fullPane)
					sidePanel.current?.resize(DRAFT_WORKBENCH_SIZE);
			}
			openWorkbench();
			setWorkbenchFocusRequest((value) => value + 1);
		},
		[activePane, fullPane, openWorkbench, workbench.store],
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
		openedFromMenu.current = true;
		emailTrigger.current = null;
		openWorkbench();
		setWorkbenchFocusRequest((value) => value + 1);
	}, [openWorkbench]);
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
			if (entry) setIsNarrow(entry.contentRect.width < 768);
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
			closeButton.current?.focus();
		} else {
			conversationPanel.current?.expand();
			sidePanel.current?.resize(preferredSplit);
		}
		const frame = requestAnimationFrame(() => {
			isAdjusting.current = false;
		});
		return () => cancelAnimationFrame(frame);
	}, [activePane, fullPane]);
	useEffect(() => {
		if (activePane && !fullPane) paneRef.current?.focus();
	}, [activePane, fullPane]);
	useEffect(() => {
		for (const message of snapshot.turn.messages)
			if (!firstSeen.current.has(message.id))
				firstSeen.current.set(
					message.id,
					message.createdAt ?? new Date().toISOString(),
				);
	}, [snapshot.turn.messages]);
	const entries = useMemo(
		() =>
			workTimeline(
				workspace.messages,
				snapshot.turn.messages,
				roomId,
				workbench.tools,
				firstSeen.current,
			),
		[workspace.messages, snapshot.turn.messages, roomId, workbench.tools],
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
	});
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
				composer.setSourceMessage(request.sourceMessageId);
				composer.setMode("assistant");
				setFocusRequest((value) => value + 1);
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
						threadId: thread.id,
						contextRevision: context.revision,
						contextText: JSON.stringify(context, null, 2),
					},
					isSourceIncluded: () => composer.isSourceIncluded(target),
					submit: (operation) => composer.submitAction(operation),
				});
			}
		},
		[
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
		workbench.closeWorkbench();
		const targetId = openedFromMenu.current
			? threadMenuTriggerId(thread.id)
			: actionsTriggerId;
		openedFromMenu.current = false;
		const returnTarget = emailTrigger.current;
		emailTrigger.current = null;
		requestAnimationFrame(() =>
			restoreThreadFocus(
				returnTarget?.isConnected
					? returnTarget
					: document.getElementById(targetId),
			),
		);
	};
	const nextContext: SubmittedThreadContext = {
		threadId: thread.id,
		contextRevision: context.revision,
		contextText: JSON.stringify(context, null, 2),
	};
	return (
		<WorkEmailContext.Provider
			value={{ thread, workspace, composer, allowedSources, openEmail }}
		>
			<WorkThreadContext.Provider
				value={{
					session,
					snapshot,
					title: thread.subject,
					contextPanel: {
						context: nextContext,
						submitted,
						children: inspector,
					},
				}}
			>
				<WorkbenchProvider store={workbench.store}>
					<div
						ref={root}
						className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
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
								defaultSize={100}
								minSize={fullPane ? 0 : 30}
								collapsible
								collapsedSize={0}
							>
								<div
									hidden={Boolean(activePane && fullPane)}
									className={cn(
										"@container/conversation size-full min-h-0 flex-col bg-muted/30 outline-none",
										activePane && fullPane
											? "hidden"
											: "flex",
									)}
								>
									<header className="shrink-0 border-border border-b bg-background py-2">
										<div className="mx-auto flex w-full min-w-0 max-w-3xl items-start gap-3 @md/conversation:px-6 px-4">
											<Button
												asChild
												variant="ghost"
												size="icon-sm"
												className="pointer-coarse:size-11 shrink-0 text-muted-foreground"
											>
												<Link
													to="/work"
													aria-label="Back to feed"
													title="Back to feed"
												>
													<ArrowLeft aria-hidden="true" />
												</Link>
											</Button>
											{header}
										</div>
									</header>
									<WorkConversation
										thread={thread}
										entries={entries}
										allowedSources={allowedSources}
										resumeSignal={resumeSignal}
										showAssistant={isComposerOpen}
										emailDrafts={memory.emailDrafts}
										onOpenEmail={(messageId, trigger) =>
											openEmail(
												messageId,
												"source",
												trigger,
											)
										}
										actions={
											isHistoryReady ? (
												<ThreadQuickActions
													isDraftDisabled={!sourceUid}
													showWelcome={
														isHistoryReady &&
														!hasActivity &&
														!isComposerOpen
													}
													hasSourceEmail={Boolean(
														sourceUid,
													)}
													isAssistantOpen={
														isComposerOpen
													}
													onSelect={(mode) => {
														handleThreadAction({
															id: crypto.randomUUID(),
															threadId: thread.id,
															action:
																mode === "draft"
																	? "draft"
																	: "ask",
															sourceMessageId:
																sourceUid,
														});
													}}
												/>
											) : null
										}
										turn={snapshot.turn}
									/>
									<RoomRunStatus
										agent={WORK_ASSISTANT}
										turnError={snapshot.turn.turnError}
										transportError={
											snapshot.turn.transportError
										}
										pendingApprovals={
											snapshot.turn.pendingApprovals
										}
										onReconnect={session.reconnect}
										reviewInWorkbench
									/>
									{proposalError && (
										<Alert variant="destructive">
											<AlertDescription>
												{proposalError}
											</AlertDescription>
										</Alert>
									)}
									{memory.emailDrafts.some(
										(draft) =>
											!draft.seed.assistantMessageId,
									) && (
										<section
											aria-label="Local email drafts"
											className="max-h-48 shrink-0 overflow-y-auto border-border border-t py-4"
										>
											<div className="mx-auto flex max-w-3xl flex-col gap-3 @md/conversation:px-6 px-4">
												{memory.emailDrafts
													.filter(
														(draft) =>
															!draft.seed
																.assistantMessageId,
													)
													.map((draft) => (
														<WorkDraftCard
															key={draft.seed.id}
															draft={draft}
														/>
													))}
											</div>
										</section>
									)}
									<div
										className={cn(
											"shrink-0",
											(isComposerOpen ||
												snapshot.isLoading ||
												snapshot.error ||
												snapshot.modelError) &&
												"py-4",
										)}
									>
										<div className="mx-auto w-full max-w-3xl space-y-3 @md/conversation:px-6 px-4">
											<AssistantComposer
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
													thread.source?.webLink ??
													workspace.messages.find(
														(message) =>
															message.id ===
															sourceUid,
													)?.webLink
												}
												attachments={attachments}
												context={nextContext}
												onSent={() =>
													setResumeSignal(
														(n) => n + 1,
													)
												}
											/>
										</div>
									</div>
								</div>
							</ResizablePanel>
							<ResizableHandle
								aria-label="Resize conversation and workbench"
								disabled={!activePane || fullPane}
								className={cn(
									(!activePane || fullPane) && "hidden",
								)}
								withHandle
							/>
							<ResizablePanel
								ref={sidePanel}
								id={`${fieldId}-panel`}
								order={2}
								defaultSize={0}
								minSize={fullPane ? 0 : 25}
								maxSize={fullPane ? 100 : 70}
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
											snapshot={workbench.snapshot}
											mobileTopBorder="toolbar"
											borderSlots={{
												top: {
													before: <WorkPanelMenu />,
													after: (
														<WorkWorkbenchClose
															isFullWidth={
																fullPane
															}
															buttonRef={
																handleCloseRef
															}
															onClose={closePane}
														/>
													),
												},
											}}
										/>
									</div>
								</aside>
							</ResizablePanel>
						</ResizablePanelGroup>
					</div>
				</WorkbenchProvider>
			</WorkThreadContext.Provider>
		</WorkEmailContext.Provider>
	);
}
