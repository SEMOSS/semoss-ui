import { FilePenLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { Badge, Button, H1, H3, P, Small, toast } from "@semoss/ui/next";
import { getMail } from "@/features/connectors/api/microsoft";
import { importOutlookMail } from "@/features/connectors/api/source-mapping";
import { EmailDraftDialog } from "@/features/connectors/components/email-draft-dialog";
import type { SourceAttachment } from "@/features/connectors/types";
import { ThreadAssistant } from "@/features/thread-assistant/thread-assistant";
import { UnifiedThread } from "@/features/work-thread/unified-thread";
import { WORK_THREAD_WORKBENCH } from "@/features/work-thread/work-thread-panels";
import { importSourceCommand } from "../import-source";
import { loadThreadMessages } from "../live/live-state";
import { selectThreadContext } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { TextEntryForm } from "./text-entry-form";
import { ThreadInspector } from "./thread-inspector";
import { ThreadMenu } from "./thread-menu";
import { threadMenuTriggerId } from "./thread-menu.utils";
import { TopicChip } from "./topic-chip";

interface DraftSelection {
	id: number;
	threadId: string;
	body: string;
	subject: string;
	mode: "new" | "reply" | "forward";
}

/** Work owns one unified conversation and reveals details/files only when requested. */
export function WorkThread() {
	const { threadId = "" } = useParams();
	const { state, dispatch } = useCollaborationSession();
	const latestState = useRef(state);
	latestState.current = state;
	const [editingGoal, setEditingGoal] = useState(false);
	const [draft, setDraft] = useState<DraftSelection | null>(null);
	const [draftOpen, setDraftOpen] = useState(false);
	const thread = state.threads.find((candidate) => candidate.id === threadId);
	const workspace = state.workspaces[threadId];
	const context = selectThreadContext(state, threadId);
	const currentThreadId = thread?.id;
	useEffect(() => {
		if (currentThreadId)
			dispatch({ type: "workspace.open", threadId: currentThreadId });
	}, [dispatch, currentThreadId]);
	if (!thread || !workspace || !context)
		return (
			<P className="p-6">
				This thread is not loaded.{" "}
				<Link to="/brain/sources" className="underline">
					Load your sources
				</Link>{" "}
				or{" "}
				<Link to="/work" className="underline">
					return to Work
				</Link>
				.
			</P>
		);
	const sourceUid =
		thread.source?.kind === "outlook" ? thread.source.nativeId : undefined;
	const attachments: SourceAttachment[] = workspace.assets
		.filter(
			(asset) =>
				context.messages.length > 0 &&
				!asset.isSample &&
				asset.nativeId,
		)
		.map((asset) => ({
			id: asset.nativeId ?? "",
			name: asset.name,
			size: Number(asset.size) || undefined,
			isFile: asset.kind === "file",
		}));
	const openDraft = (
		body: string,
		mode: DraftSelection["mode"] = sourceUid ? "reply" : "new",
		subject = thread.subject,
	) => {
		if (
			!draft ||
			draft.threadId !== thread.id ||
			draft.mode !== mode ||
			body
		) {
			setDraft({
				id: Date.now(),
				threadId: thread.id,
				body,
				mode,
				subject,
			});
		}
		setDraftOpen(true);
	};
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col py-2">
			<ThreadAssistant
				workbench={WORK_THREAD_WORKBENCH}
				threadId={thread.id}
				threadTitle={thread.subject}
				contextText={JSON.stringify(context, null, 2)}
				contextRevision={context.revision}
				isConnected={!thread.isSample}
				sourceUid={sourceUid}
				sourceAttachments={attachments}
				onDraft={(body) => openDraft(body)}
				renderWorkspace={(session, snapshot) => (
					<UnifiedThread
						onEmailSent={() => {
							const refresh = async () => {
								if (thread.isSample) return;
								const attach =
									thread.id.startsWith("connected:") &&
									sourceUid
										? (() =>
												getMail(
													session.insight.actions,
													sourceUid,
												).then((mail) => {
													const command =
														importSourceCommand(
															importOutlookMail(
																mail,
																thread.source
																	?.folder ??
																	"inbox",
															),
														);
													return (
														current: typeof thread,
													) => ({
														...command,
														thread: current,
													});
												}))()
										: loadThreadMessages(
												session.insight.actions,
												thread.id,
											);
								const apply = await attach;
								const current =
									latestState.current.threads.find(
										(candidate) =>
											candidate.id === thread.id,
									);
								if (current) dispatch(apply(current));
							};
							void refresh().catch(() =>
								toast.error(
									"Reply submitted to Outlook, but source history could not refresh. Reopen the thread to retry.",
								),
							);
						}}
						thread={thread}
						workspace={workspace}
						context={context}
						session={session}
						snapshot={snapshot}
						sourceUid={sourceUid}
						attachments={attachments}
						header={
							<ThreadMenu
								thread={thread}
								triggerId={threadMenuTriggerId(thread.id)}
							>
								{(menu) => (
									<div className="flex min-w-0 flex-1 items-start gap-3">
										<div className="min-w-0 flex-1">
											<H1 className="break-words text-lg">
												{thread.subject}
											</H1>
											<Small className="text-muted-foreground">
												{thread.channel === "email"
													? "Outlook"
													: thread.channel}{" "}
												· {thread.messageCount} source
												messages
											</Small>
											{thread.isSample && (
												<Badge
													variant="secondary"
													className="ml-2"
												>
													Sample
												</Badge>
											)}
										</div>
										{menu}
									</div>
								)}
							</ThreadMenu>
						}
						inspector={
							<>
								<section
									className="space-y-3"
									aria-label="Thread goal"
								>
									<H3 className="text-base">Goal</H3>
									{editingGoal ? (
										<TextEntryForm
											label="Thread goal"
											initialValue={workspace.goal}
											submitLabel="Save goal"
											onSave={(goal) => {
												dispatch({
													type: "thread.goal",
													threadId,
													goal,
												});
												setEditingGoal(false);
											}}
										/>
									) : (
										<>
											<P className="break-words">
												{workspace.goal ||
													"No goal set."}
											</P>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setEditingGoal(true)
												}
											>
												Edit goal
											</Button>
										</>
									)}
								</section>
								<P className="text-muted-foreground">
									{thread.summary}
								</P>
								<div className="flex flex-wrap gap-2">
									{thread.topicLinks.map((link) => {
										const topic = state.topics.find(
											(candidate) =>
												candidate.id === link.topicId,
										);
										return (
											topic && (
												<TopicChip
													key={topic.id}
													topic={topic}
													suggested={
														link.source ===
														"suggested"
													}
												/>
											)
										);
									})}
								</div>
								<ThreadInspector
									thread={thread}
									workspace={workspace}
									context={context}
								/>
								{sourceUid && (
									<section
										className="space-y-2"
										aria-label="Email drafts"
									>
										<H3 className="text-base">
											Email drafts
										</H3>
										<div className="flex flex-wrap gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													openDraft("", "reply")
												}
											>
												<FilePenLine aria-hidden="true" />
												Draft reply
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													openDraft("", "forward")
												}
											>
												Draft forward
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													openDraft("", "new", "")
												}
											>
												New email draft
											</Button>
										</div>
									</section>
								)}
								{workspace.drafts.map((item) => (
									<div key={item.id} className="space-y-2">
										<Small>Draft · not sent</Small>
										<P className="whitespace-pre-wrap break-words">
											{item.body}
										</P>
										<Button
											variant="outline"
											onClick={() =>
												openDraft(
													item.body,
													"new",
													item.subject,
												)
											}
										>
											Open draft
										</Button>
									</div>
								))}
							</>
						}
					/>
				)}
			/>
			{draft && draft.threadId === thread.id && (
				<EmailDraftDialog
					key={draft.id}
					isOpen={draftOpen}
					onOpenChange={setDraftOpen}
					mode={draft.mode}
					sourceUid={sourceUid}
					initialBody={draft.body}
					initialSubject={draft.subject}
				/>
			)}
		</div>
	);
}
