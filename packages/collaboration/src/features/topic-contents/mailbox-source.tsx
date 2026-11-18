import { useState } from "react";
import {
	groupMailByConversation,
	type MailConversation,
	normalizeMailSubject,
	useMailPages,
} from "@semoss/connectors";
import { useInsight } from "@semoss/sdk/react";
import { Button, P, toast, useDebouncedValue } from "@semoss/ui/next";
import { dateLabel } from "@/features/collaboration/date-label";
import {
	useRecordIds,
	useWorkUpdates,
} from "@/features/collaboration/live/work-updates.context";
import type {
	Thread,
	Topic,
} from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { connectMicrosoft } from "@/features/connectors/api/microsoft";
import { addMailToTopic } from "./api/topic-mail";
import { MailReader } from "./mail-reader";
import { isInTopic } from "./thread-views";
import { TopicChecklist, type TopicChecklistRow } from "./topic-checklist";
import { TopicPanes } from "./topic-panes";

interface MailboxSourceProps {
	/** A saved topic; the server files the mail. */
	topic: Topic;
	/** What the mail reactors take as `folder`. */
	folderId: string;
	/** The folder as the mailbox names it, with the folders it sits in. */
	folderName: string;
	/** After a sign in that this list asked for, so the folders are read again too. */
	onSignedIn: () => void;
}

const subjectOf = (conversation: MailConversation): string =>
	normalizeMailSubject(conversation.latest.subject) || "(no subject)";

/**
 * One Outlook folder as the mailbox has it, a conversation a row, each with a box that puts it in the topic
 * or takes it off. A conversation Brain has not read is read into Brain when it is added.
 */
export function MailboxSource({
	topic,
	folderId,
	folderName,
	onSignedIn,
}: MailboxSourceProps) {
	const { state, dispatch } = useCollaborationSession();
	const { actions } = useInsight();
	const { serverId } = useRecordIds();
	const updates = useWorkUpdates();
	const [query, setQuery] = useState("");
	const search = useDebouncedValue(query.trim(), 300);
	const pages = useMailPages({
		provider: "microsoft",
		folder: folderId,
		search,
		unreadOnly: false,
		isGrouped: true,
	});
	// rows filed here that Brain did not hold: checked until the page's reload of Brain brings their threads
	const [filedKeys, setFiledKeys] = useState<ReadonlySet<string>>(new Set());
	const [savingKeys, setSavingKeys] = useState<ReadonlySet<string>>(
		new Set(),
	);
	const [openKey, setOpenKey] = useState<string>();
	const [status, setStatus] = useState("");

	const conversations = groupMailByConversation(pages.data ?? []);
	// Brain's thread for each Outlook conversation it holds
	const threads = new Map<string, Thread>();
	for (const thread of state.threads)
		if (thread.source?.conversationId)
			threads.set(thread.source.conversationId, thread);
	const topicNames = new Map(
		state.topics.map((entry) => [entry.id, entry.name]),
	);
	const idOf = (conversation: MailConversation): string | undefined =>
		conversation.conversationId ?? conversation.latest.conversationId;
	const threadOf = (conversation: MailConversation): Thread | undefined => {
		const id = idOf(conversation);
		return id ? threads.get(id) : undefined;
	};
	const isChecked = (conversation: MailConversation): boolean => {
		const thread = threadOf(conversation);
		return thread
			? isInTopic(thread, topic.id)
			: filedKeys.has(conversation.key);
	};

	const rows = conversations.map((conversation): TopicChecklistRow => {
		const { latest } = conversation;
		const count = conversation.messages.length;
		const checked = isChecked(conversation);
		// the topics Brain has it filed under; another topic's open suggestion is not a filing
		const others = (threadOf(conversation)?.topicLinks ?? []).flatMap(
			(link) => {
				const name = topicNames.get(link.topicId);
				return name &&
					link.topicId !== topic.id &&
					link.source !== "suggested"
					? [name]
					: [];
			},
		);
		const at = latest.receivedDate ?? latest.sentDate;
		return {
			id: conversation.key,
			title: subjectOf(conversation),
			detail: [
				latest.fromName ?? latest.from ?? "Unknown sender",
				count > 1 ? `${count} emails` : "",
				others.length > 0
					? `${checked ? "Also in" : "In"} ${others.join(", ")}`
					: "",
			]
				.filter(Boolean)
				.join(" · "),
			date: at ? dateLabel(at, undefined, "date") : undefined,
			isChecked: checked,
			isSaving: savingKeys.has(conversation.key),
		};
	});
	const open = conversations.find(
		(conversation) => conversation.key === openKey,
	);

	const handleToggle = async (
		key: string,
		toChecked: boolean,
	): Promise<void> => {
		const conversation = conversations.find((entry) => entry.key === key);
		if (!conversation || savingKeys.has(key)) return;
		const title = subjectOf(conversation);
		const said = toChecked
			? `Added "${title}" to this topic.`
			: `Removed "${title}" from this topic.`;
		const thread = threadOf(conversation);
		if (thread) {
			dispatch({
				type: "thread.link",
				threadId: thread.id,
				topicId: topic.id,
				operation: toChecked ? "add" : "remove",
			});
			setStatus(said);
			return;
		}
		if (!toChecked) {
			// filed a moment ago, and its thread is still on its way to the page
			if (filedKeys.has(key))
				setStatus(
					`"${title}" is still being filed. Try again in a moment.`,
				);
			return;
		}
		const setSaving = (isSaving: boolean): void =>
			setSavingKeys((current) => {
				const next = new Set(current);
				if (isSaving) next.add(key);
				else next.delete(key);
				return next;
			});
		setSaving(true);
		try {
			// the emails of the conversation this folder lists; Brain reads the ones it does not hold
			await addMailToTopic(
				actions,
				await serverId(topic.id),
				conversation.messages.map((message) => message.id),
			);
			setFiledKeys((current) => new Set(current).add(key));
			setStatus(said);
			// Brain holds the conversation now: bring its thread onto the page
			updates?.refresh();
		} catch (cause) {
			const reason = cause instanceof Error ? cause.message : "";
			toast.error(`Could not add "${title}".`, {
				// the server words its refusal for the assistant
				description: reason.includes("cannot be added")
					? "It is in Junk, Deleted Items or Drafts, or your rules keep its sender out of Brain."
					: reason || undefined,
			});
		} finally {
			setSaving(false);
		}
	};

	const handleSignIn = async (): Promise<void> => {
		try {
			await connectMicrosoft();
			pages.reload();
			onSignedIn();
		} catch (cause) {
			toast.error("Could not sign in to Microsoft 365.", {
				description: cause instanceof Error ? cause.message : undefined,
			});
		}
	};

	return (
		<TopicPanes
			list={
				<TopicChecklist
					label={folderName}
					description="Emails in this Outlook folder, a conversation a row, newest first."
					noun="emails"
					searchPlaceholder={`Search ${folderName}`}
					query={query}
					onQueryChange={setQuery}
					rows={rows}
					onToggle={(key, toChecked) =>
						void handleToggle(key, toChecked)
					}
					onOpen={setOpenKey}
					openId={open?.key}
					hasMore={pages.hasMore}
					onShowMore={pages.loadMore}
					isLoading={pages.status === "loading" || pages.isRefreshing}
					error={pages.error?.message ?? pages.pageError?.message}
					onRetry={pages.error ? pages.reload : pages.loadMore}
					emptyText="This folder is empty."
					status={status}
				>
					{pages.status === "signedOut" && (
						<div className="flex flex-col items-start gap-3 p-4">
							<P className="text-muted-foreground text-sm">
								Sign in to Microsoft 365 to read your mailbox.
							</P>
							<Button
								type="button"
								size="sm"
								className="pointer-coarse:min-h-11"
								onClick={() => void handleSignIn()}
							>
								Sign in
							</Button>
						</div>
					)}
				</TopicChecklist>
			}
			readerPrompt="Select an email to read it here."
			reader={
				open && (
					<MailReader
						key={open.latest.id}
						messageId={open.latest.id}
						senderName={open.latest.fromName}
						count={open.messages.length}
					/>
				)
			}
			readerTitle={open && subjectOf(open)}
			readerAction={
				open && (
					<Button
						type="button"
						size="sm"
						variant={isChecked(open) ? "outline" : "default"}
						// not disabled while it saves, which would drop the keyboard's place
						className="pointer-coarse:min-h-11 shrink-0 aria-disabled:opacity-50"
						aria-disabled={savingKeys.has(open.key) || undefined}
						onClick={() =>
							void handleToggle(open.key, !isChecked(open))
						}
					>
						{isChecked(open) ? "Remove from topic" : "Add to topic"}
					</Button>
				)
			}
			onCloseReader={() => setOpenKey(undefined)}
		/>
	);
}
