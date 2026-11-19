import { beforeEach, expect, it, vi } from "vitest";
import {
	type ConnectorSaveSource,
	saveToInsight,
} from "../core/connector-files";
import { runConnectorPixel } from "../core/connector-pixel";
import { mailSaveKey } from "../mail/mail.threads";
import {
	microsoftItemKey,
	saveMailAttachments,
	saveMicrosoftItem,
} from "./microsoft-item-save";

vi.mock("../core/connector-pixel", () => ({ runConnectorPixel: vi.fn() }));
vi.mock("../core/connector-files", () => ({ saveToInsight: vi.fn() }));
const run = vi.mocked(runConnectorPixel);
const save = vi.mocked(saveToInsight);

/** What the last save was asked to write, as text or as its download pixel. */
const saved = async (): Promise<{
	service: string;
	fileName: string;
	written: string;
}> => {
	const [, service, source] = save.mock.calls[save.mock.calls.length - 1];
	return {
		service: service,
		fileName: source.fileName,
		written:
			source.kind === "text"
				? await source.getContent()
				: source.buildPixel("free name.docx"),
	};
};

beforeEach(() => {
	run.mockReset();
	save.mockReset();
	save.mockImplementation(
		async (_insightId, service, source: ConnectorSaveSource) => ({
			path: source.fileName,
			name: source.fileName,
			service: service,
		}),
	);
});

it("knows an item by the key its viewer's list knows it by", () => {
	expect(microsoftItemKey({ kind: "email", conversationId: "conv-1" })).toBe(
		mailSaveKey({ id: "m-1", conversationId: "conv-1" }),
	);
	expect(microsoftItemKey({ kind: "chat", chatId: "19:chat" })).toBe(
		"19:chat",
	);
	expect(
		microsoftItemKey({ kind: "file", itemId: "item-1", name: "Plan.docx" }),
	).toBe("item-1");
});

it("saves an email as its whole thread, oldest first, and says which item it was", async () => {
	run.mockResolvedValue({
		messages: [
			{
				id: "m-2",
				conversationId: "conv-1",
				subject: "RE: Cutover",
				fromName: "Sam",
				receivedDate: "2026-11-03T09:00:00Z",
				body: "Confirmed for the 14th",
			},
			{
				id: "m-1",
				conversationId: "conv-1",
				subject: "Cutover",
				fromName: "Priya",
				receivedDate: "2026-11-01T09:00:00Z",
				body: "Could we cut over on the 14th?",
			},
			// a folder listing answered in place of the thread is not part of it
			{ id: "m-9", conversationId: "conv-other", subject: "Lunch" },
		],
	});

	const file = await saveMicrosoftItem("insight-1", {
		kind: "email",
		conversationId: "conv-1",
		subject: "RE: Cutover",
	});

	expect(run).toHaveBeenCalledWith(
		expect.stringContaining('conversationId=["conv-1"]'),
		"insight-1",
	);
	expect(file).toMatchObject({
		service: "outlook-mail",
		itemKey: "conversation:conv-1",
	});
	const { service, fileName, written } = await saved();
	expect(service).toBe("outlook-mail");
	expect(fileName).toContain("Cutover");
	expect(written.indexOf("Could we cut over")).toBeLessThan(
		written.indexOf("Confirmed for the 14th"),
	);
	expect(written).not.toContain("Lunch");
});

it("does not save an email that is gone as an empty file", async () => {
	run.mockResolvedValue({ messages: [] });

	await expect(
		saveMicrosoftItem("insight-1", {
			kind: "email",
			conversationId: "conv-1",
		}),
	).rejects.toThrow("no longer in the mailbox");
	expect(save).not.toHaveBeenCalled();
});

it("saves a Teams chat under its name with its messages", async () => {
	run.mockImplementation(async (pixel) =>
		pixel.startsWith("MicrosoftTeamsGetChat")
			? { id: "19:chat", displayName: "Apollo vendors" }
			: {
					messages: [
						{
							id: "t-1",
							fromName: "Grace",
							createdDateTime: "2026-11-02T10:00:00Z",
							body: "The call moved to Friday",
						},
					],
				},
	);

	const file = await saveMicrosoftItem("insight-1", {
		kind: "chat",
		chatId: "19:chat",
	});

	expect(file).toMatchObject({ service: "teams-chats", itemKey: "19:chat" });
	const { fileName, written } = await saved();
	expect(fileName).toContain("Apollo vendors");
	expect(written).toContain("The call moved to Friday");
});

it("downloads a file from the drive it is in, under the name it is given", async () => {
	const file = await saveMicrosoftItem("insight-1", {
		kind: "file",
		itemId: "item-1",
		driveId: "drive-9",
		name: "Plan.docx",
	});

	expect(file).toMatchObject({ service: "onedrive", itemKey: "item-1" });
	const { fileName, written } = await saved();
	expect(fileName).toBe("Plan.docx");
	expect(written).toContain("MicrosoftOneDriveDownloadFile");
	expect(written).toContain('driveId=["drive-9"]');
	expect(written).toContain('itemId=["item-1"]');
	expect(written).toContain("free name.docx");
});

it("saves the files attached to a thread's emails, and leaves out pictures in the text and files too large", async () => {
	const opened: string[] = [];
	run.mockImplementation(async (pixel) => {
		if (pixel.startsWith("MicrosoftOutlookListMail")) {
			return {
				messages: [
					{
						id: "m-2",
						conversationId: "conv-1",
						hasAttachments: true,
					},
					// an email that says it has none is not opened
					{
						id: "m-1",
						conversationId: "conv-1",
						hasAttachments: false,
					},
				],
			};
		}
		opened.push(pixel);
		return {
			id: "m-2",
			attachments: [
				{ id: "a-1", name: "Plan.docx", size: 4096, kind: "file" },
				{ id: "a-2", name: "logo.png", isInline: true, kind: "file" },
				{ id: "a-3", name: "Thread.eml", kind: "item" },
				{
					id: "a-4",
					name: "Recording.mp4",
					size: 26 * 1024 * 1024,
					kind: "file",
				},
			],
		};
	});

	const result = await saveMailAttachments("insight-1", "conv-1");

	expect(opened).toEqual([expect.stringContaining('id=["m-2"]')]);
	expect(result).toEqual({
		saved: [
			{
				path: "Plan.docx",
				name: "Plan.docx",
				service: "outlook-mail",
				// what the mail viewer's attachment list knows it by
				itemKey: "m-2:a-1",
			},
		],
		skipped: ["Recording.mp4"],
	});
	expect(save).toHaveBeenCalledOnce();
	const { written } = await saved();
	expect(written).toContain("MicrosoftOutlookDownloadAttachment");
	expect(written).toContain("m-2");
	expect(written).toContain("a-1");
	expect(written).toContain("free name.docx");
});

it("answers nothing saved for a thread with no attachments, and fails when one cannot be saved", async () => {
	run.mockResolvedValue({
		messages: [{ id: "m-1", conversationId: "conv-1" }],
	});
	expect(await saveMailAttachments("insight-1", "conv-1")).toEqual({
		saved: [],
		skipped: [],
	});
	expect(save).not.toHaveBeenCalled();

	run.mockImplementation(async (pixel) =>
		pixel.startsWith("MicrosoftOutlookListMail")
			? {
					messages: [
						{
							id: "m-1",
							conversationId: "conv-1",
							hasAttachments: true,
						},
					],
				}
			: {
					id: "m-1",
					attachments: [
						{ id: "a-1", name: "Plan.docx", kind: "file" },
					],
				},
	);
	save.mockRejectedValue(new Error("The attachment is gone"));
	await expect(saveMailAttachments("insight-1", "conv-1")).rejects.toThrow(
		"The attachment is gone",
	);
});
