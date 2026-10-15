import { describe, expect, it } from "vitest";
import { MAIL_APPS } from "./mail-apps";

describe("mail pixels", () => {
	it("sends true flags and leaves false ones to the default", () => {
		const pixels = MAIL_APPS.microsoft.pixels;
		expect(
			pixels.listMail({
				folder: "inbox",
				limit: 25,
				subject: "   ",
				unreadOnly: false,
			}),
		).toBe(
			'MicrosoftOutlookListMail(folder=["inbox"], limit=[25], includeBody=[false]);',
		);
		expect(
			pixels.listMail({ folder: "inbox", limit: 25, unreadOnly: true }),
		).toContain("unreadOnly=[true]");
	});

	it("calls each mailbox's own reactor with the same keys", () => {
		const options = { folder: "inbox", limit: 10 };
		expect(MAIL_APPS.google.pixels.listMail(options)).toBe(
			'GoogleGmailListMail(folder=["inbox"], limit=[10], includeBody=[false]);',
		);
		expect(MAIL_APPS.microsoft.pixels.getMail("m/1")).toBe(
			'MicrosoftOutlookGetMail(id=["m/1"], includeAttachments=[true]);',
		);
		expect(MAIL_APPS.google.pixels.getMail("m/1")).toBe(
			'GoogleGmailGetMail(id=["m/1"], includeAttachments=[true]);',
		);
		expect(
			MAIL_APPS.google.pixels.downloadAttachment({
				messageId: "m",
				attachmentId: "1",
				fileName: "q3.pdf",
			}),
		).toBe(
			'GoogleGmailDownloadAttachment(id=["m"], attachmentId=["1"], fileName=["<encode>q3.pdf</encode>"]);',
		);
		expect(MAIL_APPS.google.pixels.listFolders()).toBe(
			"GoogleGmailListMailFolders();",
		);
	});

	it("passes the raw page offset to both providers, including zero", () => {
		for (const app of Object.values(MAIL_APPS)) {
			expect(
				app.pixels.listMail({ folder: "inbox", limit: 25, offset: 0 }),
			).toContain("offset=[0]");
			expect(
				app.pixels.listMail({
					folder: "inbox",
					limit: 25,
					offset: 125,
				}),
			).toContain("offset=[125]");
		}
	});

	it("writes every recipient, and leaves empty lists out", () => {
		expect(
			MAIL_APPS.google.pixels.saveDraft({
				to: ["ada@example.com", "grace@example.com"],
				cc: [],
				bcc: [],
				subject: "Q3",
				body: "See you there; bring notes.",
				attachments: ["notes.pdf"],
			}),
		).toBe(
			'GoogleGmailSaveDraft(to=["ada@example.com", "grace@example.com"], subject=["<encode>Q3</encode>"], body=["<encode>See you there; bring notes.</encode>"], attachments=["notes.pdf"]);',
		);
		expect(
			MAIL_APPS.microsoft.pixels.sendMail({
				to: ["ada@example.com"],
				cc: ["grace@example.com"],
				bcc: [],
				html: true,
				attachments: [],
			}),
		).toBe(
			'MicrosoftOutlookSendMail(to=["ada@example.com"], cc=["grace@example.com"], html=[true]);',
		);
	});

	it("says whether a reply or forward is a draft, and sends replaced recipients only when told to", () => {
		const reply = {
			id: "m",
			body: "Thanks",
			replyAll: false,
			to: ["ada@example.com"],
			cc: [],
			asDraft: true,
			attachments: [],
		};
		expect(MAIL_APPS.microsoft.pixels.replyMail(reply)).toBe(
			'MicrosoftOutlookReplyMail(id=["m"], body=["<encode>Thanks</encode>"], replyAll=[false], asDraft=[true]);',
		);
		expect(
			MAIL_APPS.microsoft.pixels.replyMail({
				...reply,
				overrideRecipients: true,
			}),
		).toContain('overrideRecipients=[true], to=["ada@example.com"]');
		expect(
			MAIL_APPS.google.pixels.forwardMail({
				id: "m",
				to: ["ada@example.com"],
				asDraft: false,
				attachments: [],
			}),
		).toBe(
			'GoogleGmailForwardMail(id=["m"], to=["ada@example.com"], asDraft=[false]);',
		);
	});
});
