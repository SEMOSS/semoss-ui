import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import { P, toast } from "@semoss/ui/next";
import { getMail } from "@/features/connectors/api/microsoft";
import { importOutlookMail } from "@/features/connectors/api/source-mapping";
import type { SourceAttachment } from "@/features/connectors/types";
import { ThreadAssistant } from "@/features/thread-assistant/thread-assistant";
import { UnifiedThread } from "@/features/work-thread/unified-thread";
import { useEnsureThreadInsights } from "@/features/work-thread/use-thread-insights";
import { useWorkComposerSession } from "@/features/work-thread/work-composer-state.context";
import {
	CHAT_WORKBENCH,
	WORK_THREAD_WORKBENCH,
} from "@/features/work-thread/work-thread-panels";
import { dateLabel } from "../date-label";
import { importSourceCommand } from "../import-source";
import { useThreadHistory } from "../live/thread-history.context";
import { selectThreadContext } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { ThreadInspector } from "./thread-inspector";

/** Work keeps assistant chat beside the full source thread and its context. */
export function WorkThread({
	threadId: suppliedThreadId,
	isNewChat = false,
	onSent,
	onSubmitStart,
}: {
	/** A local /new chat can own its identity before it has a saved route. */
	threadId?: string;
	/** Keep the centered start screen until /new starts its first valid message. */
	isNewChat?: boolean;
	/** Notify a caller after an accepted send. */
	onSent?: () => void;
	/** Open the conversation after validation, before room preparation starts. */
	onSubmitStart?: () => void;
} = {}) {
	const { threadId: routeThreadId = "" } = useParams();
	const threadId = suppliedThreadId ?? routeThreadId;
	const { state, dispatch } = useCollaborationSession();
	const latestState = useRef(state);
	latestState.current = state;
	const composer = useWorkComposerSession(threadId);
	const history = useThreadHistory(threadId);
	const thread = state.threads.find((candidate) => candidate.id === threadId);
	const workspace = state.workspaces[threadId];
	const context = selectThreadContext(state, threadId);
	const currentThreadId = thread?.id;
	const isSession = /^session:[a-f0-9-]{36}$/.test(threadId);
	// opening a thread whose summary is behind its newest message summarizes it now
	useEnsureThreadInsights(thread);
	useEffect(() => {
		if (isSession && !currentThreadId)
			dispatch({ type: "session.create", sessionId: threadId });
	}, [isSession, currentThreadId, dispatch, threadId]);
	useEffect(() => {
		if (currentThreadId)
			dispatch({ type: "workspace.open", threadId: currentThreadId });
	}, [dispatch, currentThreadId]);
	if (!thread || !workspace || !context)
		return (
			<P className="p-6">
				{isSession ? (
					<output>Opening session…</output>
				) : (
					<>
						This thread is not loaded.{" "}
						<Link to="/brain/sources" className="underline">
							Load your sources
						</Link>{" "}
						or{" "}
						<Link to="/work" className="underline">
							return to Work
						</Link>
						.
					</>
				)}
			</P>
		);
	const sourceUid =
		thread.source?.kind === "outlook" ? thread.source.nativeId : undefined;
	const attachments: SourceAttachment[] = [
		// Imported Sources mail, read through the Outlook connector.
		...workspace.assets
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
			})),
		// Brain emails, newest first, staged under the thread's rules.
		...[...workspace.messages].reverse().flatMap((message) =>
			(message.attachments ?? []).map((attachment) => ({
				...attachment,
				sourceLabel: `${message.fromName ?? "Email"} · ${dateLabel(message.at, undefined, "date")}`,
			})),
		),
	];
	const openDraft = (
		body: string,
		mode: "new" | "reply" | "forward" = sourceUid ? "reply" : "new",
		subject = thread.subject,
		originId?: string,
		to?: string,
		cc?: string,
		bcc?: string,
	) => {
		if (mode === "reply" && sourceUid && !body && !originId) {
			composer.openReply(sourceUid, subject, false);
			return;
		}
		composer.requestEmailDraft({
			id:
				originId ??
				(body ? crypto.randomUUID() : `${mode}:${sourceUid ?? "new"}`),
			mode,
			sourceUid,
			body,
			subject,
			to,
			cc,
			bcc,
		});
	};

	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col">
			<ThreadAssistant
				workbench={isSession ? CHAT_WORKBENCH : WORK_THREAD_WORKBENCH}
				threadId={thread.id}
				threadTitle={thread.subject}
				context={context}
				contextRevision={context.revision}
				isConnected={!thread.isSample}
				sourceUid={sourceUid}
				sourceAttachments={attachments}
				onDraft={(body) => openDraft(body)}
				renderWorkspace={(session, snapshot) => (
					<UnifiedThread
						isNewChat={isNewChat}
						onSent={onSent}
						onSubmitStart={onSubmitStart}
						onEmailSent={() => {
							const refresh = async () => {
								if (thread.isSample || isSession) return;
								if (!thread.id.startsWith("connected:")) {
									history.refresh();
									return;
								}
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
										: null;
								const apply = await attach;
								const current =
									latestState.current.threads.find(
										(candidate) =>
											candidate.id === thread.id,
									);
								if (current && apply) dispatch(apply(current));
							};
							void refresh().catch(() =>
								toast.error(
									"Reply submitted to Outlook, but source history could not refresh. Reopen the thread to retry.",
								),
							);
						}}
						thread={thread}
						isSourceFreeSession={isSession}
						userName={state.liveProfile?.name || state.profile.name}
						workspace={workspace}
						context={context}
						session={session}
						snapshot={snapshot}
						sourceUid={sourceUid}
						attachments={attachments}
						inspector={
							<ThreadInspector
								thread={thread}
								workspace={workspace}
								context={context}
							/>
						}
					/>
				)}
			/>
		</div>
	);
}
