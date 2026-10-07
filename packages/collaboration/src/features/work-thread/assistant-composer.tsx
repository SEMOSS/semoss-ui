import {
	ArrowUp,
	BookOpen,
	Brain,
	ChevronsDownUp,
	Wrench,
	X,
} from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import type { Engine } from "@semoss/shared";
import { Alert, AlertDescription, Button, Small, toast } from "@semoss/ui/next";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import {
	guessMemoryKind,
	rememberCommand,
} from "@/features/collaboration/state/memory";
import type { SourceAttachment } from "@/features/connectors/types";
import { ChatAddToChat } from "@/features/daily-chat/chat-add-to-chat";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { useRoomModel } from "@/features/rooms/api/use-room-model";
import { RoomComposer } from "@/features/rooms/components/room-composer";
import type { ComposerDraft } from "@/features/rooms/components/room-composer.types";
import type { SubmittedThreadContext } from "@/features/thread-assistant/thread-context";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { workInstructions } from "@/features/thread-assistant/thread-settings";
import { ThreadSourceAttachments } from "@/features/thread-assistant/thread-source-attachments";
import { ThreadComposerControls } from "./thread-composer-controls";
import { useWorkPanelActions } from "./use-work-panel-actions";
import { WorkComposerSession } from "./work-composer-session";

/** Reuses the Playground composer and the single retained Work agent session. */
export function AssistantComposer({
	composerSession: retainedComposer,
	presentation = "thread",
	isOpen = true,
	focusRequest = 0,
	actionsTriggerId,
	session,
	snapshot,
	title,
	sourceUid,
	attachments,
	context,
	onSent,
	onSubmitStart,
	toolbar,
}: {
	/** App-owned composer state, retained across route changes. */
	composerSession?: WorkComposerSession;
	/** New chats have a larger editor; standalone chats share the bottom toolbar. */
	presentation?: "thread" | "standalone" | "new-chat" | "room";
	/** Keep status/recovery visible while the editor is concealed. */
	isOpen?: boolean;
	/** Explicit focus requested by a quick action. */
	focusRequest?: number;
	actionsTriggerId?: string;
	session: ThreadSession;
	snapshot: ReturnType<ThreadSession["getSnapshot"]>;
	title: string;
	sourceUid?: string;
	sourceUrl?: string;
	attachments: SourceAttachment[];
	context: SubmittedThreadContext;
	onSent: () => void;
	/** Called only after the retained session admits this submission. */
	onSubmitStart?: () => void;
	/** Optional conversation scope shown alongside the existing composer tools. */
	toolbar?: ReactNode;
	/** Refresh source history after a confirmed send, independently of agent messages. */
	onEmailSent?: () => void;
}) {
	const [localComposer] = useState(() => new WorkComposerSession());
	const composerRoot = useRef<HTMLDivElement>(null);
	const [sendFocusRequest, setSendFocusRequest] = useState(0);
	const composer = retainedComposer ?? localComposer;
	const [resetFocusRevision, setResetFocusRevision] = useState<number | null>(
		null,
	);
	const subscribe = useCallback(
		(listener: () => void) => {
			let revision = composer.getSnapshot().revision;
			return composer.subscribe(() => {
				const nextRevision = composer.getSnapshot().revision;
				if (nextRevision !== revision) {
					revision = nextRevision;
					// Capture focus before a successful send replaces the editor.
					const root = composerRoot.current;
					if (
						root &&
						!root.closest("[hidden], [inert]") &&
						root.contains(document.activeElement) &&
						document.activeElement?.getAttribute("role") ===
							"textbox"
					)
						setResetFocusRevision(nextRevision);
				}
				listener();
			});
		},
		[composer],
	);
	const memory = useSyncExternalStore(
		subscribe,
		composer.getSnapshot,
		composer.getSnapshot,
	);
	// Consume route-arrival focus once, independently of later editor resets.
	const [arrivalRevision] = useState(() =>
		presentation !== "new-chat" && memory.shouldFocusChat
			? memory.revision
			: null,
	);
	useLayoutEffect(() => {
		if (arrivalRevision !== null) composer.consumeChatFocus();
	}, [arrivalRevision, composer]);
	const selected = memory.selected;
	const [downloading, setDownloading] = useState(false);
	const preparing = memory.isSubmitting;
	const handleDraftChange = useCallback(
		(value: ComposerDraft) => composer.setDraft(memory.revision, value),
		[composer, memory.revision],
	);
	useLayoutEffect(() => {
		composer.reconcile(session, snapshot.composerResetKey);
	}, [composer, session, snapshot.composerResetKey]);
	const { turn } = snapshot;
	const busy =
		preparing ||
		snapshot.isPreparing ||
		snapshot.isCompacting ||
		turn.isRunning ||
		turn.isSubmitting ||
		turn.isRestoring;
	const agent = snapshot.agent;
	const isStandalone =
		presentation === "standalone" || presentation === "new-chat";
	const isRoom = presentation === "room";
	const isModelLocked =
		busy ||
		snapshot.isSavingSettings ||
		snapshot.isLoadingModel ||
		snapshot.hasUnconfirmedSubmission;
	const panelActions = useWorkPanelActions();
	// /remember saves a memory as the owner's own, with no model call
	const memorySession = useOptionalCollaborationSession();
	const openSettings = () =>
		panelActions.find((action) => action.id === "settings")?.onSelect();
	const extraCommands = [
		...panelActions
			.filter((action) => action.id !== "compact")
			.map((action) => ({
				...action,
				label: `/${action.id}`,
				description: action.label,
			})),
		{
			id: "knowledge",
			label: "/knowledge",
			description: "Configure knowledge sources",
			icon: BookOpen,
			onSelect: openSettings,
		},
		{
			id: "toolbox",
			label: "/toolbox",
			description: "Configure agent tools",
			icon: Wrench,
			onSelect: openSettings,
		},
		// typed out rather than run: the sentence after it is saved on send
		...(memorySession
			? [
					{
						id: "remember",
						label: "/remember",
						description: "Save the sentence you type to memory",
						icon: Brain,
						insertText: "/remember ",
						onSelect: () => undefined,
					},
				]
			: []),
		{
			id: "compact",
			label: "/compact",
			description: "Review context and compact conversation",
			icon: ChevronsDownUp,
			onSelect: () =>
				panelActions
					.find((action) => action.id === "compact")
					?.onSelect(),
		},
	];
	const { engine, error } = useRoomModel(snapshot.modelId);
	const modelName =
		engine?.engine_display_name ||
		engine?.engine_name ||
		snapshot.modelName;
	const selectModel = (model: Engine) => {
		session.selectModel(
			model.engine_id,
			model.engine_display_name || model.engine_name,
		);
	};
	return (
		<div ref={composerRoot} className="space-y-2">
			{snapshot.isLoading && (
				<output className="text-muted-foreground text-sm">
					Opening conversation{"\u2026"}
				</output>
			)}
			{isOpen && snapshot.modelError && (
				<Alert variant="destructive">
					<AlertDescription>
						<span>{snapshot.modelError}</span>
						<Button
							variant="outline"
							onClick={() => void session.resolveDefaults()}
						>
							Retry models
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{snapshot.error && (
				<Alert variant="destructive">
					<AlertDescription>
						<span>{snapshot.error.message}</span>
						<Button
							variant="outline"
							onClick={() =>
								void (snapshot.isReady
									? session.reconnect()
									: session.initialize())
							}
						>
							Reconnect
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{snapshot.hasUnconfirmedSubmission && (
				<Alert>
					<AlertDescription>
						Your last request may have reached Assistant. Check its
						status before trying again.
						<Button
							variant="outline"
							onClick={() => void session.reconnect()}
						>
							Check request
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{snapshot.isCreationUncertain && (
				<Alert>
					<AlertDescription>
						The conversation could not be confirmed. Creating
						another may leave an empty conversation in history.
						<Button
							variant="outline"
							onClick={() => session.allowNewRoom()}
						>
							Create another conversation
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{snapshot.submissionNotice && (
				<output>{snapshot.submissionNotice}</output>
			)}
			<div hidden={!isOpen}>
				{memory.referenceResults.length > 0 && (
					<fieldset
						className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0"
						aria-label="Conversation references"
					>
						{memory.referenceResults.map((reference) => (
							<Button
								key={reference.toolId}
								type="button"
								variant="secondary"
								size="sm"
								className="max-w-full"
								onClick={() =>
									composer.removeReference(reference.toolId)
								}
								aria-label={`Remove reference: ${reference.title}`}
							>
								<span className="truncate">
									{reference.title}
								</span>
								<X aria-hidden="true" />
							</Button>
						))}
					</fieldset>
				)}
				{memory.sourceMessageId && (
					<div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
						<Small>About the selected email</Small>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="pointer-coarse:min-h-11 text-muted-foreground"
							onClick={() => composer.setSourceMessage(undefined)}
						>
							Clear email selection
						</Button>
					</div>
				)}
				<RoomComposer
					key={memory.revision}
					initialDraft={memory.draft}
					onDraftChange={handleDraftChange}
					autoFocus={
						!retainedComposer ||
						arrivalRevision === memory.revision ||
						resetFocusRevision === memory.revision
					}
					focusRequest={focusRequest + sendFocusRequest}
					retainUntilSent
					submissionError={memory.error}
					className="bg-transparent"
					surfaceClassName={
						isStandalone ? "rounded-2xl shadow-sm" : undefined
					}
					inputClassName={
						presentation === "new-chat"
							? "min-h-24"
							: presentation === "standalone"
								? "[@media(max-height:40rem)]:min-h-12"
								: undefined
					}
					header={
						!isStandalone &&
						!isRoom && (
							<ThreadComposerControls
								mode="assistant"
								onModeChange={composer.setMode}
								hasSourceEmail={false}
								isModeLocked={busy}
								assistantOnly
								modelId={snapshot.modelId}
								modelName={modelName}
								isModelLocked={isModelLocked}
								onModelChange={selectModel}
							/>
						)
					}
					actionsTriggerId={actionsTriggerId}
					renderActions={
						isStandalone
							? (controls) => <ChatAddToChat {...controls} />
							: undefined
					}
					showPromptOptimization={!isStandalone}
					panelActions={panelActions}
					extraCommands={extraCommands}
					prompts={
						snapshot.association?.options.predefinedPrompts ?? []
					}
					attachmentContent={
						attachments.some(
							(a) => a.isFile && (a.messageId || sourceUid),
						) && (
							<ThreadSourceAttachments
								attachments={attachments}
								selected={selected}
								onToggle={(id) =>
									composer.setSelected(
										selected.includes(id)
											? selected.filter(
													(value) => value !== id,
												)
											: [...selected, id],
									)
								}
								isDisabled={busy}
								onPendingChange={setDownloading}
								onDownload={(attachment) =>
									session.downloadAttachment(
										sourceUid,
										attachment,
									)
								}
							/>
						)
					}
					attachmentSummary={
						selected.length > 0 ? (
							<section
								className="flex flex-wrap gap-2 px-4 pt-3"
								aria-label="Selected source attachments"
							>
								{attachments
									.filter((attachment) =>
										selected.includes(attachment.id),
									)
									.map((attachment) => (
										<Button
											key={attachment.id}
											type="button"
											size="sm"
											variant="secondary"
											className="max-w-full"
											disabled={busy}
											onClick={() =>
												composer.setSelected(
													selected.filter(
														(id) =>
															id !==
															attachment.id,
													),
												)
											}
											aria-label={`Remove ${attachment.name}`}
										>
											<Small className="truncate">
												{attachment.name}
											</Small>
											<X aria-hidden="true" />
										</Button>
									))}
							</section>
						) : null
					}
					agentName={agent?.name || "Assistant"}
					placeholder={
						isStandalone
							? "How can I help you today?"
							: isRoom
								? `Message ${agent?.name || "Assistant"}…`
								: "Ask Assistant…"
					}
					showModelSelector={isStandalone || isRoom}
					hideSettingsAction
					submitLabel={
						isStandalone || isRoom ? undefined : "Ask Assistant"
					}
					submitIcon={
						isStandalone ? (
							<ArrowUp aria-hidden="true" />
						) : undefined
					}
					requiresModel
					submitOnEnter
					isSubmitting={
						preparing || snapshot.isPreparing || turn.isSubmitting
					}
					isRunning={turn.isRunning}
					isCancelling={turn.isCancelling}
					modelId={snapshot.modelId}
					modelName={modelName}
					isModelSaving={false}
					isModelLocked={isModelLocked}
					modelError={error}
					isSendDisabled={
						snapshot.isCompacting ||
						snapshot.isSavingSettings ||
						Boolean(snapshot.settingsError) ||
						snapshot.isLoadingModel ||
						Boolean(snapshot.modelError) ||
						downloading ||
						!snapshot.isReady ||
						Boolean(snapshot.error) ||
						snapshot.hasUnconfirmedSubmission ||
						snapshot.isCreationUncertain ||
						turn.isRestoring
					}
					roomInstructions={[
						agent?.system_prompt,
						workInstructions(snapshot.settings.instructions),
					]
						.filter(Boolean)
						.join("\n\n")}
					roomSettings={{
						instructions: snapshot.settings.instructions,
						mcp: snapshot.settings.mcp,
					}}
					inheritedMcp={agent?.mcp ?? []}
					isSettingsDisabled
					onModelChange={async (model) => selectModel(model)}
					onSaveRoomSettings={async () => {
						throw new Error("Thread context is managed in Work.");
					}}
					onOptimizePrompt={(draft, instructions) =>
						optimizePrompt(session.insight.actions, {
							modelId: snapshot.modelId,
							draft,
							instructions,
						})
					}
					onSend={async (submission) => {
						const remembered = memorySession
							? rememberCommand(submission.text)
							: null;
						if (remembered && !submission.files.length) {
							memorySession?.dispatch({
								type: "memory.save",
								memory: {
									kind: guessMemoryKind(remembered),
									text: remembered,
									isSample:
										context.context?.isSample === true,
								},
							});
							toast.success("Saved to memory", {
								description: remembered,
							});
							return;
						}
						await composer.submit(async () => {
							const release = session.retain();
							// read at send time, so edits made since the last render count
							const openEmail = composer.openEmailContext();
							try {
								await session.send(
									title,
									memory.sourceMessageId
										? {
												...context,
												...(openEmail
													? { openEmail }
													: {}),
												...(memory.referenceResults
													.length
													? {
															referenceResults:
																memory.referenceResults,
														}
													: {}),
												selectedSourceMessageId:
													memory.sourceMessageId,
											}
										: {
												...context,
												...(openEmail
													? { openEmail }
													: {}),
												...(memory.referenceResults
													.length
													? {
															referenceResults:
																memory.referenceResults,
														}
													: {}),
											},
									submission,
									sourceUid,
									attachments.filter(
										(attachment) =>
											attachment.isFile &&
											selected.includes(attachment.id),
									),
									onSubmitStart,
								);
							} finally {
								release();
							}
						});
					}}
					onStop={session.cancel}
					onSent={() => {
						onSent();
						const root = composerRoot.current;
						// A successful send resets the editor. Restore typing focus
						// only if the user has not moved to another panel or route.
						if (
							isStandalone &&
							root &&
							!root.closest("[hidden], [inert]") &&
							(document.activeElement === document.body ||
								root.contains(document.activeElement))
						)
							setSendFocusRequest((value) => value + 1);
					}}
				>
					{toolbar}
				</RoomComposer>
			</div>
		</div>
	);
}
