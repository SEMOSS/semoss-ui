import { type ReactNode, useState } from "react";
import { Button } from "@semoss/ui/next";
import { channelMeta } from "@/features/collaboration/channel-meta";
import { ThreadConversation } from "@/features/collaboration/components/thread-conversation";
import { dateLabel } from "@/features/collaboration/date-label";
import type {
	Thread,
	Topic,
} from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { givenFirst } from "@/lib/person-name";
import { isInThreadView, isInTopic, type ThreadView } from "./thread-views";
import { TopicChecklist, type TopicChecklistRow } from "./topic-checklist";
import { TopicPanes } from "./topic-panes";

// a view lists this many; Show more adds as many again
const PAGE_SIZE = 50;

const VIEWS: Record<
	ThreadView,
	{
		label: string;
		description: string;
		emptyText: string;
		footnote?: string;
	}
> = {
	topic: {
		label: "Emails and Teams chats in this topic",
		description:
			"The conversations filed under this topic. Uncheck one to take it off.",
		emptyText:
			"Nothing in this topic yet. Pick emails from your Outlook folders, or Teams chats, on the left.",
	},
	unfiled: {
		label: "No topic yet",
		description:
			"Emails and Teams chats Brain has read that are in no topic.",
		emptyText: "Everything Brain has read already has a topic.",
		footnote:
			"Automated and ignored mail is left out here. Find it under Everything Brain has read.",
	},
	teams: {
		label: "Teams chats",
		description:
			"Your Microsoft Teams chats, as far back as Brain has read them.",
		emptyText: "Brain has not read any Teams chats yet.",
	},
	all: {
		label: "Everything Brain has read",
		description:
			"Every email, Teams chat and meeting Brain has read, in or out of a topic.",
		emptyText: "Brain has not read any conversations yet.",
	},
};

interface ThreadSourceProps {
	topic: Topic;
	view: ThreadView;
	/** Under the empty list: where to go to have something listed, such as turning Teams chats on. */
	emptyAction?: ReactNode;
}

/**
 * The conversations Brain has read, as one of its views, each with a box that puts it in the topic or takes
 * it off. A change saves as it is made, and the thread stays listed so it can be undone where it was made.
 */
export function ThreadSource({ topic, view, emptyAction }: ThreadSourceProps) {
	const { state, dispatch } = useCollaborationSession();
	const [query, setQuery] = useState("");
	const [limit, setLimit] = useState(PAGE_SIZE);
	const [changedIds, setChangedIds] = useState<ReadonlySet<string>>(
		new Set(),
	);
	const [openId, setOpenId] = useState<string>();
	const [status, setStatus] = useState("");

	const people = new Map(state.people.map((person) => [person.id, person]));
	const topicNames = new Map(
		state.topics.map((entry) => [entry.id, entry.name]),
	);
	const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
	const listed: { thread: Thread; names: string[] }[] = [];
	for (const thread of state.threads) {
		if (
			thread.isSample !== topic.isSample ||
			!(
				isInThreadView(view, thread, topic.id) ||
				changedIds.has(thread.id)
			)
		)
			continue;
		const names: string[] = [];
		let searchable = `${thread.subject} ${thread.summary}`;
		for (const participant of thread.participants) {
			const person = people.get(participant.personId);
			const name = person
				? givenFirst(person.name)
				: participant.name || participant.email;
			searchable += ` ${name ?? ""} ${person?.email ?? participant.email ?? ""}`;
			// the owner is on every thread, so their name tells none apart
			if (
				name &&
				person?.relationship !== "self" &&
				participant.personId !== state.profile.id
			)
				names.push(name);
		}
		const text = searchable.toLocaleLowerCase();
		if (terms.every((term) => text.includes(term)))
			listed.push({ thread, names });
	}
	listed.sort((a, b) => b.thread.lastAt.localeCompare(a.thread.lastAt));

	const rows = listed
		.slice(0, limit)
		.map(({ thread, names }): TopicChecklistRow => {
			const isChecked = isInTopic(thread, topic.id);
			const meta = channelMeta(thread.channel);
			// the topics it is filed under; another topic's open suggestion is not a filing
			const others = thread.topicLinks.flatMap((link) => {
				const name = topicNames.get(link.topicId);
				return name &&
					link.topicId !== topic.id &&
					link.source !== "suggested"
					? [name]
					: [];
			});
			return {
				id: thread.id,
				title: thread.subject.trim() || "(no subject)",
				detail: [
					names.length > 2
						? `${names.slice(0, 2).join(", ")} +${names.length - 2}`
						: names.join(", "),
					others.length > 0
						? `${isChecked ? "Also in" : "In"} ${others.join(", ")}`
						: "",
					thread.topicLinks.some(
						(link) =>
							link.topicId === topic.id &&
							link.source === "suggested",
					)
						? "Suggested for this topic"
						: "",
					thread.muted ? "Ignored" : "",
					thread.automated ? "Automated" : "",
				]
					.filter(Boolean)
					.join(" · "),
				date: dateLabel(thread.lastAt, undefined, "date"),
				icon: meta.icon,
				iconLabel: meta.label,
				isChecked,
			};
		});
	const open = state.threads.find((thread) => thread.id === openId);

	const handleToggle = (threadId: string, isChecked: boolean): void => {
		const thread = state.threads.find((entry) => entry.id === threadId);
		if (!thread) return;
		dispatch({
			type: "thread.link",
			threadId,
			topicId: topic.id,
			operation: isChecked ? "add" : "remove",
		});
		setChangedIds((current) => new Set(current).add(threadId));
		const title = thread.subject.trim() || "(no subject)";
		setStatus(
			isChecked
				? `Added "${title}" to this topic.`
				: `Removed "${title}" from this topic.`,
		);
	};

	return (
		<TopicPanes
			list={
				<TopicChecklist
					label={VIEWS[view].label}
					description={VIEWS[view].description}
					noun="conversations"
					searchPlaceholder="Search by subject, person, or summary"
					query={query}
					onQueryChange={(next) => {
						setQuery(next);
						setLimit(PAGE_SIZE);
					}}
					rows={rows}
					onToggle={handleToggle}
					onOpen={setOpenId}
					openId={open?.id}
					hasMore={listed.length > limit}
					moreCount={listed.length - limit}
					onShowMore={() =>
						setLimit((current) => current + PAGE_SIZE)
					}
					emptyText={VIEWS[view].emptyText}
					emptyAction={emptyAction}
					footnote={VIEWS[view].footnote}
					status={status}
					hint={
						view === "topic"
							? "Uncheck a conversation to take it off this topic."
							: undefined
					}
				/>
			}
			readerPrompt="Select a conversation to read it here."
			reader={open && <ThreadConversation thread={open} />}
			readerTitle={open?.subject.trim() || "(no subject)"}
			readerAction={
				open && (
					<Button
						type="button"
						size="sm"
						variant={
							isInTopic(open, topic.id) ? "outline" : "default"
						}
						className="pointer-coarse:min-h-11 shrink-0"
						onClick={() =>
							handleToggle(open.id, !isInTopic(open, topic.id))
						}
					>
						{isInTopic(open, topic.id)
							? "Remove from topic"
							: "Add to topic"}
					</Button>
				)
			}
			onCloseReader={() => setOpenId(undefined)}
		/>
	);
}
