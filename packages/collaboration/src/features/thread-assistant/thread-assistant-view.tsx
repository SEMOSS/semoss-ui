import { FileText, PanelsTopLeft, Sparkles } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Checkbox,
	Label,
	P,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@semoss/ui/next";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { useRoomModel } from "@/features/rooms/api/use-room-model";
import { RoomComposer } from "@/features/rooms/components/room-composer";
import { RoomRunStatus } from "@/features/rooms/components/room-run-status";
import { RoomThread } from "@/features/rooms/components/room-thread";
import { ToolWorkbench } from "@/features/tools/components/tool-workbench";
import { createToolWorkbenchLayout } from "@/features/tools/tool-workbench.constants";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { canContinueThreadRoom } from "./api/thread-room";
import type { ThreadAssistantProps } from "./thread-assistant.types";
import {
	lastSubmittedContext,
	presentThreadMessages,
	THREAD_ASSISTANT_INSTRUCTIONS,
} from "./thread-context";
import type { ThreadSession } from "./thread-session";
import { ThreadSourceAttachments } from "./thread-source-attachments";

const ASSISTANT: AgentConfiguration = {
	name: "Assistant",
	description: "",
	system_prompt: THREAD_ASSISTANT_INSTRUCTIONS,
	mcp: [],
	skills: [],
	prompts: [],
};

interface ThreadAssistantViewProps extends ThreadAssistantProps {
	session: ThreadSession;
	snapshot: ReturnType<ThreadSession["getSnapshot"]>;
}

export function ThreadAssistantView({
	threadId,
	threadTitle,
	contextText,
	contextRevision,
	isConnected,
	onDraft,
	sourceUid,
	sourceAttachments = [],
	session,
	snapshot,
}: ThreadAssistantViewProps) {
	const [acknowledgedRevision, setAcknowledgedRevision] = useState<
		string | null
	>(null);
	const attachmentSelectionKey = `${contextRevision}:${snapshot.composerResetKey}`;
	const [attachmentSelection, setAttachmentSelection] = useState({
		key: attachmentSelectionKey,
		ids: [] as string[],
	});
	const selectedAttachments =
		attachmentSelection.key === attachmentSelectionKey
			? attachmentSelection.ids
			: [];
	const [resumeSignal, setResumeSignal] = useState(0);
	const [isAttachmentDownloading, setIsAttachmentDownloading] =
		useState(false);
	const noticeId = useId();
	const workbench = useToolWorkbench();
	const { store } = workbench;
	const { turn, association } = snapshot;
	const roomId = association?.roomId ?? "";
	const insightId = session.insight.insightId;
	const { engine, error: modelError } = useRoomModel(snapshot.modelId);
	const messages = useMemo(
		() => presentThreadMessages(turn.messages),
		[turn.messages],
	);
	const submitted = useMemo(
		() => lastSubmittedContext(turn.messages, threadId),
		[turn.messages, threadId],
	);
	const latestAnswer =
		[...messages]
			.reverse()
			.find(
				(message) =>
					message.role === "assistant" && message.visible !== false,
			)
			?.parts.flatMap((part) => (part.type === "text" ? [part.text] : []))
			.join("\n\n") ?? "";
	const isBusy =
		snapshot.isPreparing ||
		turn.isRunning ||
		turn.isSubmitting ||
		turn.isRestoring;
	const shouldShowNotice =
		isConnected &&
		acknowledgedRevision !== contextRevision &&
		submitted?.contextRevision !== contextRevision;
	const shouldStartFresh = Boolean(
		association &&
			(!canContinueThreadRoom(association) ||
				association.metadata.contextRevision !== contextRevision ||
				association.metadata.modelId !== snapshot.modelId),
	);
	useEffect(() => {
		if (!roomId) return;
		store
			.getState()
			.layout.actions.loadSnapshot(createToolWorkbenchLayout(insightId));
	}, [store, insightId, roomId]);

	return (
		<section
			aria-label="Thread assistant"
			className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card"
		>
			<header className="flex flex-wrap items-center justify-between gap-3 border-border border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<Sparkles
						aria-hidden="true"
						className="size-4 text-primary"
					/>
					<h2 className="font-semibold text-base">Assistant</h2>
					<span className="text-muted-foreground text-xs">
						{isConnected
							? "Using this thread’s context"
							: "Using the sample context"}
					</span>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => workbench.openWorkbench()}
					disabled={!roomId || isBusy}
				>
					<PanelsTopLeft aria-hidden="true" />
					Tools & files
				</Button>
			</header>
			<div className="space-y-3 px-4 pt-3">
				<details className="rounded-lg border border-border px-3 py-2">
					<summary className="cursor-pointer text-sm focus-visible:outline-2 focus-visible:outline-ring">
						Review assistant context
					</summary>
					<P className="mt-3 font-medium text-sm">
						Context for your next message
					</P>
					<pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 font-sans text-sm">
						{contextText || "No source context is included."}
					</pre>
					{submitted && (
						<>
							<P className="mt-4 font-medium text-sm">
								Exact context included with the last message
							</P>
							<pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 font-sans text-sm">
								{submitted.contextText}
							</pre>
						</>
					)}
				</details>
				{shouldStartFresh && (
					<P className="text-muted-foreground text-sm">
						Your context, model, or conversation settings changed.
						Your next message starts a fresh conversation so earlier
						context is not carried forward.
					</P>
				)}
				{snapshot.error && (
					<Alert variant="destructive">
						<AlertDescription>
							{snapshot.error.message}
						</AlertDescription>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-2"
							onClick={() => void session.reconnect()}
						>
							Reconnect
						</Button>
					</Alert>
				)}
				{snapshot.isCreationUncertain && (
					<Alert>
						<AlertDescription>
							The server did not confirm the new conversation.
							Starting again may leave an empty conversation in
							your history.
						</AlertDescription>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-2"
							onClick={() => session.allowNewRoom()}
						>
							Create another conversation
						</Button>
					</Alert>
				)}
				{snapshot.hasUnconfirmedSubmission && (
					<Alert>
						<AlertDescription>
							The last message may have reached Assistant. Check
							its status before trying again.
						</AlertDescription>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-2"
							onClick={() => void session.reconnect()}
						>
							Check last message
						</Button>
					</Alert>
				)}
				{snapshot.submissionNotice && (
					<output className="block text-muted-foreground text-sm">
						{snapshot.submissionNotice}
					</output>
				)}
			</div>
			<div className="flex h-96 min-h-0 flex-col">
				<RoomThread
					agent={ASSISTANT}
					thread={messages}
					isLoadingHistory={turn.isRestoring}
					roomId={roomId || threadId}
					resumeSignal={resumeSignal}
					phase={turn.phase}
					hasObservationIssue={Boolean(turn.transportError)}
				/>
			</div>
			{onDraft && latestAnswer && !isBusy && (
				<div className="px-4 pb-3">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onDraft(latestAnswer)}
					>
						<FileText aria-hidden="true" />
						Use response as email draft
					</Button>
				</div>
			)}
			<RoomRunStatus
				agent={ASSISTANT}
				turnError={turn.turnError}
				transportError={turn.transportError}
				pendingApprovals={turn.pendingApprovals}
				onReconnect={session.reconnect}
			/>
			<div className="space-y-3 border-border border-t bg-background p-3">
				{shouldShowNotice && (
					<div className="space-y-3 rounded-lg bg-muted/50 p-3">
						<P className="text-sm">
							Selected source content will be saved in this
							assistant conversation when you send. Excluding it
							later affects future questions; it does not remove
							content already saved in earlier conversations.
						</P>
						<div className="flex items-start gap-2">
							<Checkbox
								id={noticeId}
								checked={
									acknowledgedRevision === contextRevision
								}
								onCheckedChange={(checked) =>
									setAcknowledgedRevision(
										checked === true
											? contextRevision
											: null,
									)
								}
							/>
							<Label
								htmlFor={noticeId}
								className="text-sm leading-5"
							>
								Include this context in my saved conversation
							</Label>
						</div>
					</div>
				)}
				{sourceUid &&
					sourceAttachments.some(
						(attachment) => attachment.isFile,
					) && (
						<ThreadSourceAttachments
							key={sourceUid}
							attachments={sourceAttachments}
							selected={selectedAttachments}
							onToggle={(attachmentId) =>
								setAttachmentSelection((current) => {
									const ids =
										current.key === attachmentSelectionKey
											? current.ids
											: [];
									return {
										key: attachmentSelectionKey,
										ids: ids.includes(attachmentId)
											? ids.filter(
													(id) => id !== attachmentId,
												)
											: [...ids, attachmentId],
									};
								})
							}
							isDisabled={isBusy}
							onPendingChange={setIsAttachmentDownloading}
							onDownload={(attachment) =>
								session.downloadAttachment(
									sourceUid,
									attachment,
								)
							}
						/>
					)}
				<RoomComposer
					key={snapshot.composerResetKey}
					agentName="Assistant"
					isSubmitting={snapshot.isPreparing || turn.isSubmitting}
					isRunning={turn.isRunning}
					isCancelling={turn.isCancelling}
					modelId={snapshot.modelId}
					modelName={
						engine?.engine_display_name ||
						engine?.engine_name ||
						snapshot.modelName
					}
					isModelSaving={false}
					isModelLocked={isBusy || snapshot.hasUnconfirmedSubmission}
					modelError={modelError}
					isSendDisabled={
						shouldShowNotice ||
						isAttachmentDownloading ||
						Boolean(snapshot.error) ||
						snapshot.hasUnconfirmedSubmission ||
						snapshot.isCreationUncertain ||
						turn.isRestoring
					}
					roomInstructions={THREAD_ASSISTANT_INSTRUCTIONS}
					roomSettings={{
						instructions: THREAD_ASSISTANT_INSTRUCTIONS,
						mcp: [],
					}}
					inheritedMcp={[]}
					isSettingsDisabled
					onModelChange={async (model) => {
						session.selectModel(
							model.engine_id,
							model.engine_display_name || model.engine_name,
						);
					}}
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
						await session.send(
							threadTitle,
							{ threadId, contextRevision, contextText },
							submission,
							sourceUid,
							sourceAttachments.filter(
								(attachment) =>
									attachment.isFile &&
									selectedAttachments.includes(attachment.id),
							),
						);
						setAttachmentSelection({
							key: attachmentSelectionKey,
							ids: [],
						});
					}}
					onStop={session.cancel}
					onSent={() => setResumeSignal((value) => value + 1)}
				/>
			</div>
			<Sheet
				open={workbench.isOpen}
				onOpenChange={(open) => {
					if (!open) workbench.closeWorkbench();
				}}
			>
				<SheetContent
					side="right"
					className="w-full gap-0 p-0 sm:max-w-3xl"
				>
					<SheetHeader className="border-border border-b p-4">
						<SheetTitle>Tools & files</SheetTitle>
						<SheetDescription>
							Files and tool results for this assistant
							conversation.
						</SheetDescription>
					</SheetHeader>
					<div className="min-h-0 flex-1">
						<ToolWorkbench />
					</div>
				</SheetContent>
			</Sheet>
		</section>
	);
}
