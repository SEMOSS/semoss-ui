import { ArrowLeft, FilePenLine } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Badge, Button, H1, P, Small } from "@semoss/ui/next";
import { EmailDraftDialog } from "@/features/connectors/components/email-draft-dialog";
import type { SourceAttachment } from "@/features/connectors/types";
import { ThreadAssistant } from "@/features/thread-assistant/thread-assistant";
import { dateLabel } from "../date-label";
import { selectThreadContext } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationSurface } from "./collaboration-surface";
import { PersonAvatar } from "./person-avatar";
import { Section } from "./section";
import { TextEntryForm } from "./text-entry-form";
import { ThreadInspector } from "./thread-inspector";
import { TopicChip } from "./topic-chip";

interface DraftSelection {
	id: number;
	body: string;
	subject: string;
	mode: "new" | "reply" | "forward";
}

/** Combines source history and the real Playground assistant within a thread workspace. */
export function WorkThread() {
	const { threadId = "" } = useParams();
	const { state, dispatch } = useCollaborationSession();
	const [showExcluded, setShowExcluded] = useState(false);
	const [isEditingGoal, setIsEditingGoal] = useState(false);
	const [draft, setDraft] = useState<DraftSelection | null>(null);
	const [isDraftOpen, setIsDraftOpen] = useState(false);
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
				This thread is not loaded in the current session.{" "}
				<Link to="/brain/sources" className="underline">
					Load your sources
				</Link>{" "}
				or return to{" "}
				<Link to="/work" className="underline">
					Work
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
	): void => {
		setDraft({ id: Date.now(), body, mode, subject });
		setIsDraftOpen(true);
	};
	const includedIds = new Set(context.messages.map((message) => message.id));
	return (
		<CollaborationSurface
			aside={
				<ThreadInspector
					thread={thread}
					workspace={workspace}
					context={context}
				/>
			}
			asideTitle="Thread details"
		>
			<div className="space-y-6 p-4 md:px-6">
				<header className="space-y-3">
					<Button asChild variant="ghost" size="sm">
						<Link to="/work">
							<ArrowLeft aria-hidden="true" />
							Back to feed
						</Link>
					</Button>
					<H1 className="font-semibold text-xl">{thread.subject}</H1>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline">
							{thread.isSample
								? "Sample scenario"
								: "Connected source"}
						</Badge>
						<Small className="text-muted-foreground">
							{thread.channel} · {thread.messageCount} messages ·{" "}
							{dateLabel(thread.lastAt)}
						</Small>
					</div>
					<div className="flex flex-wrap gap-2">
						{thread.topicLinks.map((link) => {
							const topic = state.topics.find(
								(candidate) => candidate.id === link.topicId,
							);
							return (
								topic && (
									<TopicChip
										key={topic.id}
										topic={topic}
										suggested={link.source === "suggested"}
									/>
								)
							);
						})}
					</div>
				</header>
				<section
					className="space-y-3 rounded-lg border bg-muted/30 p-4"
					aria-label="Thread goal"
				>
					{isEditingGoal ? (
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
								setIsEditingGoal(false);
							}}
						/>
					) : (
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="min-w-0">
								<Small className="font-medium text-muted-foreground">
									Goal
								</Small>
								<P>{workspace.goal}</P>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setIsEditingGoal(true)}
							>
								Edit
							</Button>
						</div>
					)}
				</section>
				<Section title="Where it stands">
					<P className="text-muted-foreground">{thread.summary}</P>
				</Section>
				<Section title="Source conversation">
					{context.hiddenCount > 0 && (
						<div className="space-y-2 rounded-md border p-3">
							<Small>
								{context.hiddenCount} source messages excluded
								from future assistant context.
							</Small>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setShowExcluded((value) => !value)
								}
							>
								{showExcluded
									? "Hide excluded text"
									: "Show source text anyway"}
							</Button>
						</div>
					)}
					<div className="space-y-5">
						{workspace.messages
							.filter(
								(message) =>
									showExcluded || includedIds.has(message.id),
							)
							.map((message) => {
								const person = state.people.find(
									(candidate) =>
										candidate.id === message.fromId,
								);
								const name =
									person?.name ||
									(message.fromId === "me"
										? state.profile.name
										: "You");
								return (
									<article
										key={message.id}
										className="flex gap-3"
									>
										<PersonAvatar
											name={name}
											initials={person?.initials}
										/>
										<div className="min-w-0 flex-1 space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<Small className="font-medium">
													{name}
												</Small>
												<Small className="text-muted-foreground">
													{dateLabel(message.at)}
												</Small>
												{!includedIds.has(
													message.id,
												) && (
													<Badge variant="outline">
														Excluded
													</Badge>
												)}
											</div>
											<P className="whitespace-pre-wrap break-words">
												{message.text}
											</P>
											{message.isTruncated && (
												<Small className="text-warning">
													Source text was truncated.
												</Small>
											)}
										</div>
									</article>
								);
							})}
						{!workspace.messages.length && (
							<P className="text-muted-foreground">
								No source message text is available for this
								sample thread.
							</P>
						)}
					</div>
				</Section>
				{sourceUid && (
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							onClick={() => openDraft("", "reply")}
						>
							<FilePenLine aria-hidden="true" />
							Draft reply
						</Button>
						<Button
							variant="outline"
							onClick={() => openDraft("", "forward")}
						>
							Draft forward
						</Button>
						<Button
							variant="ghost"
							onClick={() => openDraft("", "new", "")}
						>
							New email draft
						</Button>
					</div>
				)}
				{thread.isSample &&
					(workspace.sampleChat.length > 0 ||
						workspace.drafts.length > 0) && (
						<details className="space-y-4 rounded-lg border p-4">
							<summary className="cursor-pointer font-medium">
								Sample assistant conversation
							</summary>
							{workspace.sampleChat.map((message) => (
								<div key={message.id} className="space-y-2">
									<Small className="font-medium">
										{message.role === "user"
											? "Sample user"
											: "Sample assistant"}
									</Small>
									<P className="whitespace-pre-wrap">
										{message.text}
									</P>
									{message.options?.map((option) => (
										<div
											key={option.name}
											className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
										>
											<Small>
												{option.name} · {option.meta}
											</Small>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													dispatch({
														type: "item.create",
														threadId,
														text: `Follow up on ${option.name}`,
													})
												}
											>
												Add next step
											</Button>
										</div>
									))}
								</div>
							))}
							{workspace.drafts.map((sample) => (
								<div
									key={sample.id}
									className="space-y-3 rounded-md border p-4"
								>
									<Small className="font-medium">
										Sample draft · not sent
									</Small>
									<P className="whitespace-pre-wrap">
										{sample.body}
									</P>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											openDraft(
												sample.body,
												"new",
												sample.subject,
											)
										}
									>
										Use as a new draft
									</Button>
								</div>
							))}
						</details>
					)}
			</div>
			<section className="border-t" aria-label="Thread assistant">
				<ThreadAssistant
					threadId={thread.id}
					threadTitle={thread.subject}
					contextText={JSON.stringify(context, null, 2)}
					contextRevision={context.revision}
					isConnected={!thread.isSample}
					sourceUid={sourceUid}
					sourceAttachments={attachments}
					onDraft={(body) => openDraft(body)}
				/>
			</section>
			{draft && (
				<EmailDraftDialog
					key={draft.id}
					isOpen={isDraftOpen}
					onOpenChange={setIsDraftOpen}
					mode={draft.mode}
					sourceUid={sourceUid}
					initialBody={draft.body}
					initialSubject={draft.subject}
				/>
			)}
		</CollaborationSurface>
	);
}
