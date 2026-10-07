import type { RoomSource } from "@/features/rooms/source-import/room-source";
import type { InsightActions } from "@/lib/pixel";
import { loadRoomSourceEmails } from "./load-room-source-emails";

const source: RoomSource = {
	version: 1,
	threadId: "brain-thread",
	title: "Friday plans",
	channel: "email",
	kind: "brain",
	nativeId: "not-included",
	file: { fileName: "source.md", fileLocation: "source.md" },
	messages: [
		{ id: "older", fromName: "Ada", at: "2026-10-06T12:00:00Z" },
		{ id: "newer", fromName: "Grace", at: "2026-10-07T12:00:00Z" },
	],
};
const actionsFor = (run: ReturnType<typeof vi.fn>): InsightActions =>
	({ run }) as unknown as InsightActions;
const response = <T>(output: T) => ({
	pixelReturn: [{ output, operationType: [] }],
});
const message = (id: string, excluded = false) => ({
	id,
	fromId: "sender",
	fromName: "Sender",
	fromAddress: "sender@example.com",
	at: "2026-10-07T12:00:00Z",
	text: `Body ${id}`,
	excluded,
	displayBody: { contentType: "html", content: `<p>Original ${id}</p>` },
	to: [{ name: "Recipient", address: "recipient@example.com" }],
	attachments: [{ id: "attachment", name: "Notes.txt", kind: "file" }],
});
const page = (messages: unknown[], more: Record<string, unknown> = {}) =>
	response({
		threadId: source.threadId,
		messages,
		hasMore: false,
		...more,
	});
const mail = (uid: string) =>
	response({
		uid,
		from: "sender@example.com",
		to: "recipient@example.com, other@example.com",
		cc: "copy@example.com",
		subject: `Subject ${uid}`,
		receivedDate: "2026-10-07T12:00:00Z",
		unread: false,
		hasAttachments: true,
		body: `Body ${uid}`,
		displayBody: { contentType: "html", content: `<p>Original ${uid}</p>` },
		attachments: [{ id: "attachment", name: "Notes.txt", isFile: true }],
		webLink: "https://outlook.office.com/mail/inbox/id/source",
	});

it("reads permitted Brain pages and returns only room identities in their saved order", async () => {
	const run = vi
		.fn()
		.mockResolvedValueOnce(
			page([message("newer"), message("not-included")], {
				hasMore: true,
				nextCursor: "older-page",
			}),
		)
		.mockResolvedValueOnce(
			page([message("older"), message("newer")], {
				hasMore: true,
				nextCursor: "unneeded-page",
			}),
		);
	const messages = await loadRoomSourceEmails(actionsFor(run), source);
	expect(messages.map((item) => item.id)).toEqual(["older", "newer"]);
	expect(messages[0]).toMatchObject({
		displayBody: { contentType: "html", content: "<p>Original older</p>" },
		to: ["Recipient"],
		attachments: [
			{ id: "attachment", messageId: "older", name: "Notes.txt" },
		],
	});
	expect(run).toHaveBeenCalledTimes(2);
	expect(run.mock.calls[0]?.[0]).toContain(
		'BrainGetThreadMessages(threadId=["brain-thread"]',
	);
	expect(run.mock.calls[1]?.[0]).toContain('cursor=["older-page"]');
	expect(
		run.mock.calls.every(
			([statement]) => !statement.includes("MicrosoftOutlook"),
		),
	).toBe(true);
});

it("omits newly excluded or unavailable Brain messages without bypassing the thread read", async () => {
	const run = vi.fn().mockResolvedValue(
		page([message("older", true)], {
			hiddenCount: 1,
			unavailableCount: 1,
		}),
	);
	expect(await loadRoomSourceEmails(actionsFor(run), source)).toEqual([]);
	expect(run).toHaveBeenCalledOnce();
});

it.each([undefined, "repeated"])(
	"rejects a missing or repeated continuation %s",
	async (nextCursor) => {
		const run = vi
			.fn()
			.mockResolvedValue(page([], { hasMore: true, nextCursor }));
		await expect(
			loadRoomSourceEmails(actionsFor(run), source),
		).rejects.toThrow("could not continue");
		expect(run.mock.calls.length).toBeLessThanOrEqual(2);
	},
);

it("rejects history belonging to another Brain thread", async () => {
	const run = vi
		.fn()
		.mockResolvedValue(
			page([message("older")], { threadId: "another-thread" }),
		);
	await expect(loadRoomSourceEmails(actionsFor(run), source)).rejects.toThrow(
		"different thread",
	);
	expect(run).toHaveBeenCalledOnce();
});

it("reads only persisted Outlook UIDs and preserves the existing importer display and attachment shape", async () => {
	const run = vi
		.fn()
		.mockResolvedValueOnce(mail("older"))
		.mockResolvedValueOnce(mail("newer"));
	const messages = await loadRoomSourceEmails(actionsFor(run), {
		...source,
		kind: "outlook",
	});
	expect(messages.map((item) => item.id)).toEqual(["older", "newer"]);
	expect(messages[0]).toMatchObject({
		fromId: "connected-person:outlook:email:sender%40example.com",
		fromName: "Ada",
		fromAddress: "sender@example.com",
		subject: "Subject older",
		text: "Body older",
		displayBody: { contentType: "html", content: "<p>Original older</p>" },
		to: ["recipient@example.com", "other@example.com"],
		cc: ["copy@example.com"],
		attachments: [{ id: "attachment", name: "Notes.txt", isFile: true }],
	});
	expect(run).toHaveBeenCalledTimes(2);
	expect(run.mock.calls[0]?.[0]).toContain(
		'MicrosoftOutlookGetMail(uid=["older"]',
	);
	expect(run.mock.calls[1]?.[0]).toContain(
		'MicrosoftOutlookGetMail(uid=["newer"]',
	);
	expect(
		run.mock.calls.every(
			([statement]) => !statement.includes("not-included"),
		),
	).toBe(true);
});

it("rejects an Outlook response for a different message", async () => {
	const run = vi.fn().mockResolvedValue(mail("different"));
	await expect(
		loadRoomSourceEmails(actionsFor(run), {
			...source,
			kind: "outlook",
			messages: source.messages.slice(0, 1),
		}),
	).rejects.toThrow("different email");
});

it("keeps a formatted Outlook sender separate from its canonical saved address", async () => {
	const output = {
		...mail("older").pixelReturn[0].output,
		from: "Carla Jimenez <carla@example.com>",
		to: "Riley Warren <owner@example.com>",
		cc: "Dana Osei <dana@example.com>",
	};
	const run = vi.fn().mockResolvedValue(response(output));
	const messages = await loadRoomSourceEmails(actionsFor(run), {
		...source,
		kind: "outlook",
		messages: [
			{
				...source.messages[0],
				fromName: "Carla Jimenez",
				fromAddress: "carla@example.com",
			},
		],
	});
	expect(messages[0]).toMatchObject({
		fromName: "Carla Jimenez",
		fromAddress: "carla@example.com",
		to: ["Riley Warren <owner@example.com>"],
		cc: ["Dana Osei <dana@example.com>"],
	});
});

it("displays an unparsed sender once when no canonical saved address is available", async () => {
	const run = vi.fn().mockResolvedValue(
		response({
			...mail("older").pixelReturn[0].output,
			from: "Carla Jimenez <carla@example.com>",
		}),
	);
	const messages = await loadRoomSourceEmails(actionsFor(run), {
		...source,
		kind: "outlook",
		messages: [{ ...source.messages[0], fromName: "Carla Jimenez" }],
	});
	expect(messages[0]).toMatchObject({
		fromName: "Carla Jimenez <carla@example.com>",
		fromAddress: "Carla Jimenez <carla@example.com>",
	});
});

it.each([
	{ ...source, kind: "sample" as const },
	{ ...source, kind: "teams" as const },
	{ ...source, channel: "calendar" as const },
	{ ...source, messages: [] },
])(
	"does not read unsupported or empty source $kind/$channel",
	async (value) => {
		const run = vi.fn();
		expect(await loadRoomSourceEmails(actionsFor(run), value)).toEqual([]);
		expect(run).not.toHaveBeenCalled();
	},
);

it("reads duplicate saved Outlook identities only once", async () => {
	const run = vi.fn().mockResolvedValue(mail("older"));
	const envelope = source.messages[0];
	const messages = await loadRoomSourceEmails(actionsFor(run), {
		...source,
		kind: "outlook",
		messages: [envelope, envelope],
	});
	expect(messages.map((item) => item.id)).toEqual(["older"]);
	expect(run).toHaveBeenCalledOnce();
});
