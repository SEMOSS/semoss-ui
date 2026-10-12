import { z } from "@semoss/ui/next";
import { importSourceCommand } from "@/features/collaboration/import-source";
import { readThreadMessagesPage } from "@/features/collaboration/live/live-state";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import {
	getMail,
	getTeamsMessages,
	safeSourceUrl,
} from "@/features/connectors/api/microsoft";
import { importOutlookMail } from "@/features/connectors/api/source-mapping";
import {
	canReadRoomSource,
	type RoomSource,
} from "@/features/rooms/source-import/room-source";
import type { InsightActions } from "@/lib/pixel";

/** Reload only this room's included messages, preserving native identities and source order. */
export async function loadRoomSourceEmails(
	actions: InsightActions,
	source: RoomSource,
	includeNewReplies = false,
): Promise<WorkspaceMessage[]> {
	if (
		!canReadRoomSource(source) &&
		!(
			includeNewReplies &&
			source.channel === "email" &&
			(source.kind === "brain" ||
				(source.kind === "outlook" && source.nativeId))
		)
	)
		return [];
	const envelopes = [
		...new Map(
			source.messages.map((message) => [message.id, message]),
		).values(),
	];
	if (
		includeNewReplies &&
		!envelopes.length &&
		source.kind === "outlook" &&
		source.nativeId
	)
		envelopes.push({ id: source.nativeId, at: "" });
	if (!envelopes.length && !includeNewReplies) return [];
	// a chat connected from Sources, not synced by the Brain: read it live
	if (source.kind === "teams") {
		if (!source.nativeId) return [];
		const page = await getTeamsMessages(actions, source.nativeId);
		const live = new Map(
			page.messages
				.filter((message) => !message.isDeleted)
				.map((message): [string, WorkspaceMessage] => [
					message.id,
					{
						id: message.id,
						fromId: message.fromId ?? "",
						fromName: message.fromName,
						at: message.createdDateTime ?? "",
						text: message.body,
						displayBody: message.displayBody,
						webLink: safeSourceUrl(
							message.webUrl ?? source.webLink,
						),
						isTruncated: message.bodyTruncated,
					},
				]),
		);
		return envelopes.flatMap((envelope) => {
			const message = live.get(envelope.id);
			return message
				? [{ ...message, at: message.at || envelope.at }]
				: [];
		});
	}
	if (source.kind === "outlook") {
		return Promise.all(
			envelopes.map(async (envelope): Promise<WorkspaceMessage> => {
				const mail = await getMail(actions, envelope.id);
				const imported = importOutlookMail(mail, "");
				const sender = imported.participants.find(
					(person) => person.role === "from",
				);
				const nativeAddress = z.email().safeParse(sender?.address);
				const savedAddress = z.email().safeParse(envelope.fromAddress);
				const senderAddress = nativeAddress.success
					? nativeAddress.data
					: savedAddress.success
						? savedAddress.data
						: undefined;
				const command = importSourceCommand(imported);
				const message = command.workspace?.messages?.find(
					(candidate) => candidate.id === envelope.id,
				);
				if (!message)
					throw new Error("The source email could not be verified.");
				return {
					...message,
					subject: mail.subject ?? envelope.subject ?? source.title,
					// Some historical envelopes combine name and address. Keep that
					// display intact unless a canonical address can be separated.
					fromName: senderAddress
						? sender?.name || envelope.fromName
						: mail.from ||
							envelope.fromAddress ||
							envelope.fromName,
					fromAddress:
						senderAddress ?? mail.from ?? envelope.fromAddress,
					at: message.at || envelope.at,
					to: imported.participants
						.filter((person) => person.role === "to")
						.flatMap((person) =>
							person.address ? [person.address] : [],
						),
					cc: imported.participants
						.filter((person) => person.role === "cc")
						.flatMap((person) =>
							person.address ? [person.address] : [],
						),
					attachments: imported.attachments,
				};
			}),
		);
	}

	const allowed = new Set(envelopes.map((message) => message.id));
	const remaining = new Set(allowed);
	const messages = new Map<string, WorkspaceMessage>();
	const cursors = new Set<string>();
	let cursor: string | undefined;
	do {
		const page = await readThreadMessagesPage(
			actions,
			source.threadId,
			cursor,
			includeNewReplies && !cursor,
		);
		if (includeNewReplies && page.unavailableCount)
			throw new Error(
				"Some source emails could not be read. The existing file has been kept; try refreshing again.",
			);
		for (const message of page.messages) {
			if (!includeNewReplies && !allowed.has(message.id)) continue;
			remaining.delete(message.id);
			if (message.excluded) messages.delete(message.id);
			else messages.set(message.id, message);
		}
		if ((!includeNewReplies && !remaining.size) || !page.hasMore) break;
		if (!page.nextCursor || cursors.has(page.nextCursor)) {
			throw new Error(
				"The server could not continue this thread. Try loading it again.",
			);
		}
		cursors.add(page.nextCursor);
		cursor = page.nextCursor;
	} while (cursor);
	if (includeNewReplies)
		return [...messages.values()].sort(
			(left, right) =>
				left.at.localeCompare(right.at) ||
				left.id.localeCompare(right.id),
		);
	return envelopes.flatMap((envelope) => {
		const message = messages.get(envelope.id);
		return message ? [message] : [];
	});
}
