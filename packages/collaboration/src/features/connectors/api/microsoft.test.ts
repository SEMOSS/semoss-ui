import { download, oauth } from "@semoss/sdk";
import {
	connectMicrosoft,
	downloadStagedAttachment,
	getMail,
	getTeamsMessages,
	listCalendarEvents,
	listMail,
	listMailFolders,
	listTeamsChats,
	parseAddresses,
	safeSourceUrl,
	saveEmailDraft,
	stageMailAttachment,
	UncertainDraftError,
} from "./microsoft";

vi.mock("@semoss/sdk", () => ({ download: vi.fn(), oauth: vi.fn() }));

function response(output: unknown) {
	return { pixelReturn: [{ output, operationType: [] }] };
}
const mail = {
	uid: "mail-1",
	subject: "A subject",
	unread: true,
	hasAttachments: false,
};

describe("Microsoft source adapters", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});
	it("requests bounded mail headers only and safely serializes filters", async () => {
		const run = vi
			.fn()
			.mockResolvedValue(
				response({ folder: "inbox", count: 1, messages: [mail] }),
			);
		const subject = 'quarter "one"; not a Pixel';
		await expect(
			listMail({ run } as never, { subject }),
		).resolves.toMatchObject({ count: 1 });
		expect(run.mock.calls[0]?.[0]).toContain(
			"limit=[20], sinceDays=[7], includeBody=[false]",
		);
		expect(run.mock.calls[0]?.[0]).toContain(
			`subject=${JSON.stringify([subject])}`,
		);
	});
	it.each([1, 7, 30, 90] as const)(
		"serializes the selected %i-day range without widening the header read",
		async (sinceDays) => {
			const run = vi
				.fn()
				.mockResolvedValue(
					response({ folder: "inbox", count: 0, messages: [] }),
				);
			await listMail({ run } as never, { sinceDays });
			expect(run.mock.calls[0]?.[0]).toContain(
				`limit=[20], sinceDays=[${sinceDays}], includeBody=[false]`,
			);
		},
	);
	it.each([0, 14, 91, Number.NaN, null, "30"])(
		"rejects unsupported supplied date range %s before reading mail",
		(sinceDays) => {
			const run = vi.fn();
			expect(() =>
				listMail({ run } as never, { sinceDays: sinceDays as never }),
			).toThrow("1, 7, 30, or 90 days");
			expect(run).not.toHaveBeenCalled();
		},
	);
	it("reads one UID with a body cap and attachment metadata", async () => {
		const run = vi
			.fn()
			.mockResolvedValue(
				response({ ...mail, uid: "opaque/+id", body: "Actual email" }),
			);
		await getMail({ run } as never, "opaque/+id");
		expect(run).toHaveBeenCalledWith(
			'MicrosoftOutlookGetMail(uid=["opaque/+id"], maxBodyChars=[12000], includeAttachments=[true]);',
		);
	});
	it("rejects invalid payloads and Pixel errors instead of loading fixtures", async () => {
		const run = vi
			.fn()
			.mockResolvedValueOnce(response({ count: 0 }))
			.mockResolvedValueOnce({
				pixelReturn: [
					{
						operationType: ["ERROR"],
						output: "Mail.Read permission required",
					},
				],
			});
		await expect(listMail({ run } as never)).rejects.toThrow(
			"unexpected shape",
		);
		await expect(listMail({ run } as never)).rejects.toThrow("Mail.Read");
	});
	it("lists folder identities without fabricating totals", async () => {
		const run = vi.fn().mockResolvedValue(
			response({
				count: 1,
				folders: [
					{
						id: "native-folder",
						name: "Client",
						totalItemCount: 43,
					},
				],
			}),
		);
		await expect(listMailFolders({ run } as never)).resolves.toMatchObject({
			folders: [{ id: "native-folder" }],
		});
		expect(run).toHaveBeenCalledWith("MicrosoftOutlookListMailFolders();");
	});
	it("bounds Teams and calendar reads and leaves chat previews off", async () => {
		const run = vi
			.fn()
			.mockResolvedValueOnce(response({ count: 0, chats: [] }))
			.mockResolvedValueOnce(
				response({ chatId: "chat", count: 0, messages: [] }),
			)
			.mockResolvedValueOnce(response({ count: 0, events: [] }));
		const actions = { run } as never;
		await listTeamsChats(actions);
		await getTeamsMessages(actions, "chat");
		await listCalendarEvents(actions);
		expect(run.mock.calls.map(([expression]) => expression)).toEqual([
			"MicrosoftTeamsListChats(limit=[20], includeLastMessage=[false]);",
			'MicrosoftTeamsListChatMessages(chatId=["chat"], limit=[30], maxBodyChars=[12000]);',
			'MicrosoftCalendarListEvents(days=[7], limit=[30], timeZone=["UTC"], includeBody=[false]);',
		]);
	});
	it("rejects malformed timestamps at the source boundary", async () => {
		const run = vi
			.fn()
			.mockResolvedValue(
				response({ ...mail, receivedDate: "not a date" }),
			);
		await expect(getMail({ run } as never, "mail-1")).rejects.toThrow(
			"Invalid source date",
		);
	});
	it("allows incomplete new drafts, validating only supplied addresses", async () => {
		const run = vi.fn().mockResolvedValue(
			response({
				saved: true,
				draftId: "draft",
				to: ["server-variant@example.com"],
				webLink: "https://outlook.office.com/mail/drafts/id",
			}),
		);
		await expect(
			saveEmailDraft({ run } as never, {
				mode: "new",
				to: "",
				cc: "",
				bcc: "",
				subject: "",
				body: "",
			}),
		).resolves.toEqual({
			savedDraftId: "draft",
			webLink: "https://outlook.office.com/mail/drafts/id",
		});
		expect(run.mock.calls[0]?.[0]).toContain("MicrosoftOutlookSaveDraft(");
		expect(run.mock.calls[0]?.[0]).toContain("html=[false]");
	});
	it("never submits malformed supplied addresses", async () => {
		const run = vi.fn();
		await expect(
			saveEmailDraft({ run } as never, {
				mode: "new",
				to: "not an address",
				cc: "",
				bcc: "",
				subject: "",
				body: "",
			}),
		).rejects.toThrow("email addresses");
		expect(run).not.toHaveBeenCalled();
	});
	it("hardcodes native reply/forward draft mode and normalizes their uid receipts", async () => {
		const run = vi
			.fn()
			.mockResolvedValueOnce(
				response({
					sent: false,
					repliedTo: "original",
					uid: "reply-draft",
				}),
			)
			.mockResolvedValueOnce(
				response({
					sent: false,
					forwarded: "original",
					uid: "forward-draft",
				}),
			);
		await expect(
			saveEmailDraft({ run } as never, {
				mode: "reply",
				sourceUid: "original",
				body: "Thanks",
				replyAll: false,
			}),
		).resolves.toMatchObject({ savedDraftId: "reply-draft" });
		await expect(
			saveEmailDraft({ run } as never, {
				mode: "forward",
				sourceUid: "original",
				body: "",
				to: "person@example.com",
			}),
		).resolves.toMatchObject({ savedDraftId: "forward-draft" });
		for (const [expression] of run.mock.calls)
			expect(expression).toContain("asDraft=[true]");
		expect(run.mock.calls[0]?.[0]).toContain("replyAll=[false]");
	});
	it("treats missing or wrong draft receipts as uncertain without retrying", async () => {
		const run = vi
			.fn()
			.mockResolvedValue(
				response({ sent: false, repliedTo: "different", uid: "draft" }),
			);
		await expect(
			saveEmailDraft({ run } as never, {
				mode: "reply",
				sourceUid: "original",
				body: "Thanks",
				replyAll: false,
			}),
		).rejects.toBeInstanceOf(UncertainDraftError);
		expect(run).toHaveBeenCalledTimes(1);
	});
	it("does not call a successful sent response a draft", async () => {
		const run = vi
			.fn()
			.mockResolvedValue(
				response({ sent: true, forwarded: "original", uid: "id" }),
			);
		await expect(
			saveEmailDraft({ run } as never, {
				mode: "forward",
				sourceUid: "original",
				to: "p@example.com",
				body: "",
			}),
		).rejects.toBeInstanceOf(UncertainDraftError);
	});
	it("stages unique files and obtains an export key before browser download", async () => {
		vi.spyOn(crypto, "randomUUID").mockReturnValue(
			"11111111-1111-1111-1111-111111111111",
		);
		const name = "11111111-1111-1111-1111-111111111111-report.pdf";
		const run = vi
			.fn()
			.mockResolvedValueOnce(
				response({
					success: true,
					uid: "mail",
					attachmentId: "attachment",
					name: "report.pdf",
					filePath: name,
					size: 10,
				}),
			)
			.mockResolvedValueOnce(response("download-key"));
		const file = await stageMailAttachment(
			{ run } as never,
			"insight",
			"mail",
			"attachment",
			"report.pdf",
		);
		await downloadStagedAttachment({ run } as never, file);
		expect(run.mock.calls[0]?.[0]).toContain(`fileName=["${name}"]`);
		expect(run.mock.calls[1]?.[0]).toBe(
			`DownloadInsightAsset(filePath=["${name}"]);`,
		);
		expect(download).toHaveBeenCalledWith("insight", "download-key");
	});
	it("rejects staging receipts from a different selected file", async () => {
		const run = vi.fn().mockResolvedValue(
			response({
				success: true,
				uid: "other",
				attachmentId: "id",
				name: "a",
				filePath: "a",
				size: 1,
			}),
		);
		await expect(
			stageMailAttachment({ run } as never, "insight", "mail", "id", "a"),
		).rejects.toThrow("does not match");
	});
	it("ends an unresolved OAuth attempt with an actionable error", async () => {
		vi.useFakeTimers();
		vi.mocked(oauth).mockReturnValue(new Promise(() => undefined));
		const task = connectMicrosoft(200);
		const assertion = expect(task).rejects.toThrow("Allow popups");
		await vi.advanceTimersByTimeAsync(200);
		await assertion;
	});
	it("accepts HTTPS source links and deduplicates valid addresses", () => {
		expect(safeSourceUrl("javascript:alert(1)")).toBeUndefined();
		expect(safeSourceUrl("http://outlook.office.com")).toBeUndefined();
		expect(
			parseAddresses("a@example.com; a@example.com, b@example.com"),
		).toEqual(["a@example.com", "b@example.com"]);
	});
});
