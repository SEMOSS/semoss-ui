import { describe, expect, it } from "vitest";
import type { ImportedSource } from "@/features/connectors/types";
import { importSourceCommand } from "./import-source";
import { createInitialCollaborationState } from "./state/collaboration.fixtures";
import { collaborationReducer } from "./state/collaboration.reducer";

function source(overrides: Partial<ImportedSource> = {}): ImportedSource {
	return {
		sourceKind: "outlook",
		nativeId: "AAMk-id+/=",
		title: "Quarterly planning",
		body: "Please review the plan.",
		participants: [
			{ name: "Alex Doe", address: "alex@example.org", role: "from" },
		],
		messages: [
			{
				id: "AAMk-id+/=",
				text: "Please review the plan.",
				senderAddress: "alex@example.org",
				at: "2026-09-25T12:00:00.000Z",
			},
		],
		receivedAt: "2026-09-25T12:00:00.000Z",
		attachments: [],
		folder: "Inbox",
		...overrides,
	};
}

describe("source imports into the collaboration domain", () => {
	it("scopes unknown people to their source instead of merging by display name", () => {
		const first = importSourceCommand(
			source({
				nativeId: "source-one",
				participants: [
					{ name: "Sam", role: "member" },
					{ name: "Sam", role: "member" },
				],
				messages: [],
			}),
		);
		const second = importSourceCommand(
			source({
				nativeId: "source-two",
				participants: [{ name: "Sam", role: "member" }],
				messages: [],
			}),
		);
		expect(first.people).toHaveLength(2);
		expect(
			new Set(
				[...first.people, ...second.people].map((person) => person.id),
			).size,
		).toBe(3);
		expect(first.people.every((person) => person.email === null)).toBe(
			true,
		);
		expect(
			importSourceCommand(
				source({
					nativeId: "source-one",
					participants: [
						{ name: "Renamed", role: "member" },
						{ name: "Sam", role: "member" },
					],
					messages: [],
				}),
			).people[0].id,
		).toBe(first.people[0].id);
	});

	it("matches sender addresses case-insensitively without losing a known name", () => {
		const command = importSourceCommand(
			source({
				messages: [
					{
						id: "message",
						text: "Hello",
						senderAddress: "ALEX@EXAMPLE.ORG",
					},
				],
			}),
		);
		expect(command.people).toHaveLength(1);
		expect(command.people[0].name).toBe("Alex Doe");
		expect(command.workspace?.messages?.[0].fromId).toBe(
			command.people[0].id,
		);
	});

	it("preserves native IDs and keeps separate messages with the same subject separate", () => {
		const first = importSourceCommand(source());
		const second = importSourceCommand(
			source({ nativeId: "AAMk-another-native-id" }),
		);
		let state = collaborationReducer(
			createInitialCollaborationState(),
			first,
			"2026-09-25T13:00:00.000Z",
		);
		state = collaborationReducer(state, second, "2026-09-25T13:00:00.000Z");
		expect(state.threads.filter((thread) => !thread.isSample)).toHaveLength(
			2,
		);
		expect(first.thread.source?.nativeId).toBe("AAMk-id+/=");
		expect(first.thread.id).not.toBe(first.thread.source?.nativeId);
		expect(first.item).toMatchObject({
			score: null,
			priority: null,
			isSample: false,
		});
		expect(first.people[0]).toMatchObject({
			email: "alex@example.org",
			accountId: null,
			strength: null,
			isSample: false,
		});
	});

	it("maps unknown Teams identities without inventing an email or account", () => {
		const command = importSourceCommand(
			source({
				sourceKind: "teams",
				nativeId: "chat-opaque-id",
				participants: [
					{
						nativeId: "teams-person-id",
						name: "Sam",
						role: "member",
					},
				],
				messages: [
					{
						id: "message-opaque-id",
						senderId: "teams-person-id",
						text: "Hello",
					},
				],
				receivedAt: undefined,
			}),
		);
		expect(command.people).toHaveLength(1);
		expect(command.people[0]).toMatchObject({
			name: "Sam",
			email: null,
			accountId: null,
			lastContact: null,
		});
		expect(command.workspace?.messages?.[0]).toMatchObject({
			fromId: command.people[0].id,
			id: "message-opaque-id",
			text: "Hello",
		});
		expect(command.thread.channel).toBe("teams");
		expect(command.thread.source).toMatchObject({
			kind: "teams",
			nativeId: "chat-opaque-id",
		});
	});

	it("preserves truncation and attachment identity for explicit later downloads", () => {
		const command = importSourceCommand(
			source({
				isTruncated: true,
				sourceUrl: "https://outlook.office.com/mail/id/message",
				messages: [
					{
						id: "AAMk-id+/=",
						text: "Shortened body",
						senderAddress: "alex@example.org",
						isTruncated: true,
					},
				],
				attachments: [
					{
						id: "attachment-file",
						name: "plan.pdf",
						size: 1240,
						contentType: "application/pdf",
						isFile: true,
					},
					{
						id: "attachment-item",
						name: "Forwarded message",
						isFile: false,
					},
				],
			}),
		);
		expect(command.thread.source).toMatchObject({
			bodyTruncated: true,
			webLink: "https://outlook.office.com/mail/id/message",
			folder: "Inbox",
		});
		expect(command.workspace?.messages?.[0].isTruncated).toBe(true);
		expect(command.workspace?.assets).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					nativeId: "attachment-file",
					name: "plan.pdf",
					kind: "file",
					size: "1240",
					isSample: false,
				}),
				expect.objectContaining({
					nativeId: "attachment-item",
					kind: "reference",
				}),
			]),
		);
		expect(
			command.workspace?.assets?.every(
				(asset) => !asset.path && !asset.insightId,
			),
		).toBe(true);
	});

	it("keeps different native senders distinct even when their display names match", () => {
		const command = importSourceCommand(
			source({
				sourceKind: "teams",
				participants: [
					{ name: "Sam", nativeId: "person-one", role: "member" },
					{ name: "Sam", nativeId: "person-two", role: "member" },
				],
				messages: [
					{ id: "m1", senderId: "person-one", text: "First" },
					{ id: "m2", senderId: "person-two", text: "Second" },
				],
			}),
		);
		expect(command.people).toHaveLength(2);
		expect(
			new Set(
				command.workspace?.messages?.map((message) => message.fromId),
			).size,
		).toBe(2);
	});
});
