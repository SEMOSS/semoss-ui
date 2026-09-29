import { BookOpen, ChevronsDownUp, MailPlus, Wrench, X } from "lucide-react";
import {
	useCallback,
	useLayoutEffect,
	useState,
	useSyncExternalStore,
} from "react";
import type { Engine } from "@semoss/shared";
import { Alert, AlertDescription, Button, Small } from "@semoss/ui/next";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import { OutlookDraftLink } from "@/features/connectors/components/outlook-draft-link";
import type { SourceAttachment } from "@/features/connectors/types";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { useRoomModel } from "@/features/rooms/api/use-room-model";
import { RoomComposer } from "@/features/rooms/components/room-composer";
import type { ComposerDraft } from "@/features/rooms/components/room-composer.types";
import type { SubmittedThreadContext } from "@/features/thread-assistant/thread-context";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { workInstructions } from "@/features/thread-assistant/thread-settings";
import { ThreadSourceAttachments } from "@/features/thread-assistant/thread-source-attachments";
import { ThreadComposerControls } from "./thread-composer-controls";
import { useOutlookReplyDraft } from "./use-outlook-reply-draft";
import { useWorkPanelActions } from "./use-work-panel-actions";
import { WorkComposerSession } from "./work-composer-session";

/** Reuses the Playground composer and the single retained Work agent session. */
export function AssistantComposer({
	composerSession: retainedComposer,
	isOpen = true,
	focusRequest = 0,
	actionsTriggerId,
	session,
	snapshot,
	title,
	sourceUid,
	sourceUrl,
	attachments,
	context,
	onSent,
}: {
	/** App-owned composer state, retained across route changes. */
	composerSession?: WorkComposerSession;
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
	/** Refresh source history after a confirmed send, independently of agent messages. */
	onEmailSent?: () => void;
}) {
	const [localComposer] = useState(() => new WorkComposerSession());
	const composer = retainedComposer ?? localComposer;
	const memory = useSyncExternalStore(
		composer.subscribe,
		composer.getSnapshot,
		composer.getSnapshot,
	);
	const selected = memory.selected;
	const mode =
		sourceUid && memory.mode && memory.mode !== "assistant"
			? "draft"
			: "assistant";
	const [downloading, setDownloading] = useState(false);
	const preparing = memory.isSubmitting;
	const draft = useOutlookReplyDraft(
		session.insight.actions,
		sourceUid,
		composer.getReply(sourceUid),
	);
	const handleDraftChange = useCallback(
		(value: ComposerDraft) => composer.setDraft(memory.revision, value),
		[composer, memory.revision],
	);
	useLayoutEffect(() => {
		composer.reconcile(session, snapshot.composerResetKey);
	}, [composer, session, snapshot.composerResetKey]);
	const isDraft = mode !== "assistant";
	const originalEmailUrl = safeSourceUrl(sourceUrl);
	const { turn } = snapshot;
	const busy =
		preparing ||
		snapshot.isPreparing ||
		snapshot.isCompacting ||
		turn.isRunning ||
		turn.isSubmitting ||
		turn.isRestoring;
	const agent = snapshot.agent;
	const panelActions = useWorkPanelActions();
	const openSettings = () =>
		panelActions.find((action) => action.id === "settings")?.onSelect();
	const extraCommands = [
		...panelActions.map((action) => ({
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
		{
			id: "compact",
			label: "/compact",
			description: "Review context and compact conversation",
			icon: ChevronsDownUp,
			onSelect: () =>
				panelActions
					.find((action) => action.id === "context")
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
		<div className="space-y-2">
			{snapshot.isLoading && (
				<output className="text-muted-foreground text-sm">
					Opening conversation…
				</output>
			)}
			{isOpen && !isDraft && snapshot.modelError && (
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
			{draft.isSent && <output>Reply submitted to Outlook.</output>}
			{draft.saved && (
				<output className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
					Saved to Outlook drafts.
					<OutlookDraftLink webLink={draft.saved.webLink} />
				</output>
			)}
			{isDraft && draft.isUncertain && (
				<Alert>
					<AlertDescription>
						{draft.uncertainAction === "send"
							? "Check Outlook to confirm whether your reply was sent."
							: "Check Outlook to confirm whether your draft was saved."}
						<Button
							variant="outline"
							size="sm"
							onClick={draft.allowRetry}
						>
							I checked Outlook — allow another{" "}
							{draft.uncertainAction === "send" ? "send" : "save"}
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{isDraft && originalEmailUrl && (
				<Button
					asChild
					variant="link"
					size="sm"
					className="h-auto min-h-8 max-w-full whitespace-normal text-left"
				>
					<a
						href={originalEmailUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						Open original email in Outlook
					</a>
				</Button>
			)}
			<div hidden={!isOpen}>
				<RoomComposer
					key={memory.revision}
					initialDraft={memory.draft}
					onDraftChange={handleDraftChange}
					autoFocus={!retainedComposer}
					focusRequest={focusRequest}
					retainUntilSent
					submissionError={memory.error}
					emailMode={sourceUid ? mode : undefined}
					className="bg-transparent"
					header={
						<ThreadComposerControls
							mode={mode}
							onModeChange={composer.setMode}
							hasSourceEmail={Boolean(sourceUid)}
							isModeLocked={busy || draft.isSaving}
							modelId={snapshot.modelId}
							modelName={modelName}
							isModelLocked={
								busy ||
								snapshot.isSavingSettings ||
								snapshot.isLoadingModel ||
								snapshot.hasUnconfirmedSubmission
							}
							onModelChange={selectModel}
						/>
					}
					actionsTriggerId={actionsTriggerId}
					panelActions={panelActions}
					extraCommands={extraCommands}
					prompts={
						snapshot.association?.options.predefinedPrompts ?? []
					}
					attachmentContent={
						sourceUid &&
						attachments.some((a) => a.isFile) && (
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
								isDisabled={busy || draft.isSaving}
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
								className="flex flex-wrap gap-2 px-3 pt-3"
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
											disabled={busy || draft.isSaving}
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
					agentName={
						isDraft ? "Outlook reply" : agent?.name || "Assistant"
					}
					placeholder={
						isDraft
							? "Write a reply to the original sender…"
							: "Ask Assistant…"
					}
					showModelSelector={false}
					hideSettingsAction
					submitLabel={isDraft ? "Save draft" : "Ask Assistant"}
					submitIcon={
						isDraft ? <MailPlus aria-hidden="true" /> : undefined
					}
					requiresModel={!isDraft}
					submitOnEnter={!isDraft}
					isSubmitting={
						draft.isSaving ||
						preparing ||
						snapshot.isPreparing ||
						turn.isSubmitting
					}
					isRunning={turn.isRunning}
					isCancelling={turn.isCancelling}
					modelId={snapshot.modelId}
					modelName={modelName}
					isModelSaving={false}
					isModelLocked={busy || snapshot.hasUnconfirmedSubmission}
					modelError={isDraft ? null : error}
					isSendDisabled={
						isDraft
							? draft.isUncertain || downloading
							: snapshot.isCompacting ||
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
						await composer.submit(async () => {
							const release = session.retain();
							try {
								if (isDraft) {
									if (
										submission.files.length ||
										selected.length
									) {
										throw new Error(
											"Remove the queued attachments before saving a draft. You can add them in Outlook after saving.",
										);
									}
									const body =
										submission.html ?? submission.text;
									const format = submission.html
										? "html"
										: "text";
									await draft.save(body, format);
								} else {
									await session.send(
										title,
										context,
										submission,
										sourceUid,
										attachments.filter(
											(attachment) =>
												attachment.isFile &&
												selected.includes(
													attachment.id,
												),
										),
									);
								}
							} finally {
								release();
							}
						});
					}}
					onStop={session.cancel}
					onSent={isDraft ? undefined : onSent}
				/>
			</div>
		</div>
	);
}
