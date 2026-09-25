import type {
	ImportedSource,
	SourceParticipant,
} from "@/features/connectors/types";
import type { CollaborationCommand, Person } from "./state/collaboration.types";

interface ResolvedParticipant {
	id: string;
	person: SourceParticipant;
}

/** Normalize comparison keys while preserving provider spelling on display records. */
function normalizedAddress(address?: string): string | undefined {
	return address?.trim().toLowerCase() || undefined;
}

/** Resolve known identities only; display names never establish identity. */
function resolveParticipant(
	source: ImportedSource,
	participants: ResolvedParticipant[],
	person: SourceParticipant,
	fallback: string,
): ResolvedParticipant {
	const email = normalizedAddress(person.address);
	const existing = participants.find(
		(entry) =>
			(email && normalizedAddress(entry.person.address) === email) ||
			(person.nativeId && entry.person.nativeId === person.nativeId),
	);
	if (existing) {
		existing.person = {
			...person,
			...existing.person,
			name: existing.person.name?.trim() || person.name?.trim(),
			address: existing.person.address?.trim() || person.address?.trim(),
			nativeId: existing.person.nativeId || person.nativeId,
		};
		return existing;
	}
	const identity = person.nativeId
		? `native:${encodeURIComponent(person.nativeId)}`
		: email
			? `email:${encodeURIComponent(email)}`
			: `source:${encodeURIComponent(source.nativeId)}:${fallback}`;
	const resolved = {
		id: `connected-person:${source.sourceKind}:${identity}`,
		person,
	};
	participants.push(resolved);
	return resolved;
}

/** Adapts a validated connector selection without inventing classifier data. */
export function importSourceCommand(
	source: ImportedSource,
): Extract<CollaborationCommand, { type: "source.import" }> {
	const id = `connected:${source.sourceKind}:${source.nativeId}`;
	const channel =
		source.sourceKind === "outlook" ? "email" : source.sourceKind;
	const sourcePeople: ResolvedParticipant[] = [];
	for (const [index, person] of source.participants.entries())
		resolveParticipant(
			source,
			sourcePeople,
			person,
			`participant:${index}`,
		);
	const messages = source.messages.map((message) => {
		const sender = resolveParticipant(
			source,
			sourcePeople,
			{
				address: message.senderAddress,
				nativeId: message.senderId,
				name: message.senderName,
				role: "Sender",
			},
			`message:${encodeURIComponent(message.id)}`,
		);
		return {
			id: message.id,
			fromId: sender.id,
			text: message.text,
			at: message.at ?? source.receivedAt ?? "",
			isTruncated: message.isTruncated,
		};
	});
	const people: Person[] = sourcePeople.map(({ id: key, person }) => {
		const name =
			person.name?.trim() ||
			person.address?.trim() ||
			"Unknown participant";
		return {
			id: key,
			name,
			initials: name
				.split(/\s+/)
				.slice(0, 2)
				.map((part) => part[0])
				.join(""),
			email: person.address?.trim() || null,
			accountId: null,
			title: "",
			relationship: "",
			color: "",
			vip: false,
			neverIngest: false,
			strength: null,
			lastContact: source.receivedAt ?? null,
			channels: {
				email: channel === "email" ? 1 : 0,
				teams: channel === "teams" ? 1 : 0,
				meetings: channel === "calendar" ? 1 : 0,
			},
			topics: [],
			isSample: false,
		};
	});
	return {
		type: "source.import",
		people,
		thread: {
			id,
			channel,
			subject: source.title,
			topicLinks: [],
			participants: sourcePeople.map((entry) => ({
				personId: entry.id,
				included: true,
				role: entry.person.role || "Participant",
			})),
			muted: false,
			messageCount: messages.length,
			lastAt: source.receivedAt ?? "",
			roomId: null,
			summary: source.body.slice(0, 240),
			isSample: false,
			source: {
				kind: source.sourceKind,
				nativeId: source.nativeId,
				webLink: source.sourceUrl,
				folder: source.folder,
				bodyTruncated: source.isTruncated,
			},
		},
		workspace: {
			goal: "Review this conversation and decide the next step",
			messages,
			assets: source.attachments.map((attachment) => ({
				id: `${id}:attachment:${attachment.id}`,
				nativeId: attachment.id,
				name: attachment.name,
				kind: attachment.isFile ? "file" : "reference",
				size:
					attachment.size === undefined
						? ""
						: String(attachment.size),
				source: source.sourceKind,
				by: "Source attachment",
				when: source.receivedAt ?? "",
				isSample: false,
			})),
		},
		item: {
			id: `${id}:work`,
			threadId: id,
			channel,
			actorId: messages[0]?.fromId || people[0]?.id || "live-me",
			title: source.title,
			askType: "review",
			priority: null,
			score: null,
			reasons: ["Added by you"],
			due: null,
			received: source.receivedAt ?? "",
			status: "open",
			topicIds: [],
			isSample: false,
		},
	};
}
