import { ArrowLeft, FilePenLine, MoreHorizontal, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Badge, Button, cn, H1, H2, P, Small } from "@semoss/ui/next";
import { EmailDraftDialog } from "@/features/connectors/components/email-draft-dialog";
import type { SourceAttachment } from "@/features/connectors/types";
import { ThreadAssistant } from "@/features/thread-assistant/thread-assistant";
import { dateLabel } from "../date-label";
import { selectThreadContext } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationSurface } from "./collaboration-surface";
import { PersonAvatar } from "./person-avatar";
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
			<div className="space-y-4 px-4 pt-5 pb-3 sm:px-7">
				<header className="space-y-2">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="-ml-2 h-8 text-muted-foreground"
					>
						<Link to="/work">
							<ArrowLeft aria-hidden="true" />
							Back to feed
						</Link>
					</Button>
					<H1 className="break-words font-medium text-2xl leading-tight tracking-tight">
						{thread.subject}
					</H1>
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<Small className="text-muted-foreground">
							<span className="capitalize">{thread.channel}</span>{" "}
							· {thread.messageCount} messages · last{" "}
							{dateLabel(thread.lastAt)}
						</Small>
						{!thread.isSample && (
							<Badge
								variant="secondary"
								className="rounded-full font-normal"
							>
								Connected source
							</Badge>
						)}
					</div>
					<div className="flex flex-wrap gap-2 pt-1">
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
					className="rounded-xl bg-muted/40 px-4 py-3 ring-1 ring-border/60"
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
						<div className="flex items-start gap-3">
							<Small className="pt-1 font-medium text-primary text-xs uppercase tracking-wider">
								Goal
							</Small>
							<P className="min-w-0 flex-1 break-words leading-relaxed">
								{workspace.goal}
							</P>
							<Button
								variant="ghost"
								size="sm"
								className="-mr-2 -mt-1 shrink-0 text-muted-foreground"
								onClick={() => setIsEditingGoal(true)}
							>
								Edit
							</Button>
						</div>
					)}
				</section>
				<P className="text-muted-foreground leading-relaxed">
					<strong className="font-medium text-foreground">
						Where it stands.
					</strong>{" "}
					{thread.summary}
				</P>
				<section aria-label="Source conversation">
					<H2 className="sr-only">Source conversation</H2>
					{context.hiddenCount > 0 && (
						<div className="mb-4 flex items-start gap-3">
							<div className="flex size-9 shrink-0 items-center justify-center text-muted-foreground">
								<MoreHorizontal
									aria-hidden="true"
									className="size-4"
								/>
							</div>
							<div className="min-w-0 flex-1">
								<Small className="text-muted-foreground">
									{context.hiddenCount} source messages
									excluded from future assistant context.
								</Small>
								<Button
									variant="ghost"
									size="sm"
									className="-ml-2 text-primary"
									onClick={() =>
										setShowExcluded((value) => !value)
									}
								>
									{showExcluded
										? "Hide excluded text"
										: "Show source text anyway"}
								</Button>
							</div>
						</div>
					)}
					<div>
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
										className="group flex gap-3"
									>
										<div className="flex shrink-0 flex-col items-center gap-1">
											<PersonAvatar
												name={name}
												initials={person?.initials}
											/>
											<span
												aria-hidden="true"
												className="min-h-3 w-px flex-1 bg-border group-last:hidden"
											/>
										</div>
										<div className="min-w-0 flex-1 space-y-1 pb-5">
											<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
												<Small className="font-medium">
													{name}
												</Small>
												<Small className="text-muted-foreground text-xs">
													· {dateLabel(message.at)}
												</Small>
												{!includedIds.has(
													message.id,
												) && (
													<Badge variant="outline">
														Excluded
													</Badge>
												)}
											</div>
											<P
												className={cn(
													"whitespace-pre-wrap break-words leading-relaxed",
													!includedIds.has(
														message.id,
													) &&
														"text-muted-foreground",
												)}
											>
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
								thread.
							</P>
						)}
					</div>
				</section>
				{sourceUid && (
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => openDraft("", "reply")}
						>
							<FilePenLine aria-hidden="true" />
							Draft reply
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => openDraft("", "forward")}
						>
							Draft forward
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => openDraft("", "new", "")}
						>
							New email draft
						</Button>
					</div>
				)}
				{thread.isSample &&
					(workspace.sampleChat.length > 0 ||
						workspace.drafts.length > 0) && (
						<details open className="space-y-4">
							<summary className="cursor-pointer border-border border-t pt-4 font-medium text-muted-foreground text-xs uppercase tracking-wider focus-visible:outline-2 focus-visible:outline-ring">
								Conversation
							</summary>
							{workspace.sampleChat.map((message) => (
								<div
									key={message.id}
									className={cn(
										"space-y-2",
										message.role === "user"
											? "ml-auto max-w-96 rounded-2xl rounded-br-md bg-muted/70 px-4 py-3"
											: "relative pl-11",
									)}
								>
									{message.role !== "user" && (
										<span className="absolute top-0 left-0 flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
											<Sparkles
												aria-hidden="true"
												className="size-4"
											/>
										</span>
									)}
									<Small
										className={cn(
											"font-medium",
											message.role !== "user" &&
												"text-primary",
										)}
									>
										{message.role === "user"
											? "You"
											: "Assistant"}
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
									className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm"
								>
									<Small className="block border-b bg-muted/40 px-4 py-2 font-medium">
										Draft · not sent
									</Small>
									<P className="whitespace-pre-wrap px-4 py-3">
										{sample.body}
									</P>
									<Button
										variant="outline"
										size="sm"
										className="mx-4 mb-3"
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
			<div className="px-4 pb-5 sm:px-7">
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
			</div>
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
