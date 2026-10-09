import type {
	CollaborationState,
	Thread,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import type { OutlookMail } from "@/features/connectors/api/microsoft-schemas";

/** Calendar dates are grouped in the user's zone, not by slicing UTC timestamps. */
export function dayKey(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(date);
}

/** Keep actual priority ahead of classifier confidence and recency. */
export function prioritizeItems(items: WorkItem[], latest = false): WorkItem[] {
	return [...items].sort((left, right) =>
		latest
			? right.received.localeCompare(left.received)
			: (left.priority ?? "P4").localeCompare(right.priority ?? "P4") ||
				(right.score ?? -1) - (left.score ?? -1) ||
				right.received.localeCompare(left.received),
	);
}

export interface RelevantMail {
	id: string;
	title: string;
	sender: string;
	at: string;
	reason: string;
	score: number;
	thread?: Thread;
	mail?: OutlookMail;
	isVip: boolean;
	unread: boolean;
}

/** Explain every ranking signal; an unread flag alone is not a pending action. */
export function relevantEmails(
	state: CollaborationState,
	messages: OutlookMail[],
): RelevantMail[] {
	const rows = new Map<string, RelevantMail>();
	const excluded = new Set(
		state.threads
			.filter((thread) => thread.muted || thread.automated)
			.map((thread) => thread.source?.nativeId),
	);
	for (const thread of state.threads) {
		if (thread.channel !== "email" || thread.muted || thread.automated)
			continue;
		const item = prioritizeItems(
			state.items.filter(
				(entry) =>
					entry.threadId === thread.id &&
					entry.status === "open" &&
					entry.askType !== "fyi",
			),
		)[0];
		const people = state.people.filter((person) =>
			thread.participants.some(
				(participant) => participant.personId === person.id,
			),
		);
		const vip = people.find((person) => person.vip);
		const followed = people.find((person) => person.follow === "following");
		const topic = thread.topicLinks.find(
			(link) => link.source !== "suggested",
		);
		const reason = item
			? item.askType === "reply"
				? "Awaiting your reply"
				: "Has an open action"
			: vip
				? "Involves a VIP"
				: followed
					? "Someone you follow"
					: topic
						? "Related to your topics"
						: "Recent conversation";
		rows.set(thread.source?.nativeId || thread.id, {
			id: thread.id,
			title: thread.subject,
			sender:
				state.people.find((person) => person.id === item?.actorId)
					?.name ||
				state.workspaces[thread.id]?.messages.at(-1)?.fromName ||
				people.find((person) => person.relationship !== "self")?.name ||
				"Email",
			at: thread.lastAt,
			reason,
			score: item
				? 100 + (4 - Number((item.priority ?? "P3").slice(1))) * 10
				: vip
					? 80
					: followed
						? 60
						: topic
							? 40
							: 0,
			thread,
			isVip: Boolean(vip),
			unread: false,
		});
	}
	for (const mail of messages) {
		if (excluded.has(mail.uid)) continue;
		const prior = rows.get(mail.uid);
		if (prior) {
			rows.set(mail.uid, { ...prior, mail, unread: mail.unread });
			continue;
		}
		const person = state.people.find(
			(candidate) =>
				candidate.email?.toLowerCase() === mail.from?.toLowerCase(),
		);
		if (person?.neverIngest || person?.automated) continue;
		rows.set(mail.uid, {
			id: mail.uid,
			title: mail.subject || "Untitled email",
			sender: person?.name || mail.from || "Unknown sender",
			at: mail.receivedDate || mail.sentDate || "",
			reason: person?.vip
				? "From a VIP"
				: person?.follow === "following"
					? "Someone you follow"
					: mail.unread
						? "Unread in your inbox"
						: "Recent email",
			score: person?.vip
				? 80
				: person?.follow === "following"
					? 60
					: mail.unread
						? 20
						: 0,
			mail,
			isVip: Boolean(person?.vip),
			unread: mail.unread,
		});
	}
	return [...rows.values()].sort(
		(a, b) => b.score - a.score || b.at.localeCompare(a.at),
	);
}
