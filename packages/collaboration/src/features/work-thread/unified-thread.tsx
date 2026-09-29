import { ArrowLeft, X } from "lucide-react";
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
	Button,
	cn,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
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
import { ThreadQuickActions } from "./thread-quick-actions";
import { useThreadWorkbenchRequest } from "./use-thread-workbench-request";
import { useWorkComposerSession } from "./work-composer-state.context";
import { WORK_ASSISTANT, WorkConversation } from "./work-conversation";
import { WorkPanelMenu } from "./work-panel-menu";
import { WorkThreadContext } from "./work-thread-context";
import { workTimeline } from "./work-timeline";

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
		memory.mode !== null || (isHistoryReady && hasActivity);
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
	const split = useRef(40);
	const firstSeen = useRef(new Map<string, string>());
	const roomId = snapshot.association?.roomId ?? "";
	const fullPane = isNarrow;
	const openedFromMenu = useRef(false);
	const [workbenchFocusRequest, setWorkbenchFocusRequest] = useState(0);
	const { openWorkbench } = workbench;
	const handleOpenWorkbench = useCallback(() => {
		openedFromMenu.current = true;
		openWorkbench();
		setWorkbenchFocusRequest((value) => value + 1);
	}, [openWorkbench]);
	useThreadWorkbenchRequest(thread.id, handleOpenWorkbench);
	useEffect(() => {
		if (!activePane || workbenchFocusRequest === 0) return;
		const frame = requestAnimationFrame(() => {
			if (fullPane) closeButton.current?.focus();
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
	const submitted = lastSubmittedContext(snapshot.turn.messages, thread.id);
	const closePane = () => {
		workbench.closeWorkbench();
		const targetId = openedFromMenu.current
			? threadMenuTriggerId(thread.id)
			: actionsTriggerId;
		openedFromMenu.current = false;
		requestAnimationFrame(() =>
			restoreThreadFocus(document.getElementById(targetId)),
		);
	};
	const nextContext: SubmittedThreadContext = {
		threadId: thread.id,
		contextRevision: context.revision,
		contextText: JSON.stringify(context, null, 2),
	};
	return (
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
									"size-full min-h-0 flex-col outline-none",
									activePane && fullPane ? "hidden" : "flex",
								)}
							>
								<header className="shrink-0 border-b px-4 py-3">
									<div className="mx-auto flex w-full min-w-0 max-w-3xl items-start gap-3">
										<Button
											asChild
											variant="ghost"
											size="icon-sm"
											className="shrink-0"
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
									showAssistant={
										isComposerOpen &&
										(!sourceUid ||
											(memory.mode ?? "assistant") ===
												"assistant")
									}
									actions={
										isHistoryReady && !isComposerOpen ? (
											<ThreadQuickActions
												hasSourceEmail={Boolean(
													sourceUid,
												)}
												onSelect={(mode) => {
													composer.setMode(mode);
													setFocusRequest(
														(value) => value + 1,
													);
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
								<div
									className={cn(
										"shrink-0",
										(isComposerOpen ||
											snapshot.isLoading ||
											snapshot.error ||
											snapshot.modelError) &&
											"border-t px-4 py-3",
									)}
								>
									<div className="mx-auto w-full max-w-3xl space-y-2">
										<AssistantComposer
											onEmailSent={onEmailSent}
											composerSession={composer}
											isOpen={isComposerOpen}
											focusRequest={focusRequest}
											actionsTriggerId={actionsTriggerId}
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
												setResumeSignal((n) => n + 1)
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
									"size-full min-h-0 flex-col focus-visible:outline-2 focus-visible:outline-ring",
									activePane ? "flex" : "hidden",
								)}
							>
								<div className="relative min-h-0 flex-1">
									<Workbench
										snapshot={workbench.snapshot}
										mobileTopBorder="toolbar"
										borderSlots={{
											top: {
												before: <WorkPanelMenu />,
												after: (
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																ref={
																	handleCloseRef
																}
																type="button"
																variant="ghost"
																size="icon-sm"
																className="size-11 md:size-7"
																aria-label="Close workbench"
																onClick={
																	closePane
																}
															>
																<X aria-hidden="true" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															Close workbench
														</TooltipContent>
													</Tooltip>
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
	);
}
