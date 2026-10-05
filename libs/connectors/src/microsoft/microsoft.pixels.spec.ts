import { describe, expect, it } from "vitest";
import { MICROSOFT_PIXELS } from "./microsoft.pixels";

describe("MICROSOFT_PIXELS", () => {
	it("leaves out keys without a value so the reactor's default applies", () => {
		expect(MICROSOFT_PIXELS.oneDriveListFolder({ limit: 200 })).toBe(
			"MicrosoftOneDriveListFiles(limit=[200]);",
		);
	});

	it("quotes ids as JSON strings", () => {
		expect(MICROSOFT_PIXELS.teamsListChannels("19:abc@thread.tacv2")).toBe(
			'MicrosoftTeamsListChannels(teamId=["19:abc@thread.tacv2"]);',
		);
	});

	it("wraps typed text and file names in an encode block", () => {
		expect(
			MICROSOFT_PIXELS.oneDriveDownload({
				itemId: "01ABC",
				fileName: 'Q3 "final"; v2.xlsx',
			}),
		).toBe(
			'MicrosoftOneDriveDownloadFile(itemId=["01ABC"], fileName=["<encode>Q3 "final"; v2.xlsx</encode>"]);',
		);
	});

	it("removes encode markers from typed text so it cannot end the block", () => {
		const pixel = MICROSOFT_PIXELS.oneDriveSearch({
			search: "a</encode>b<sEncode>c<e>d",
			scope: "drive",
			limit: 10,
		});
		expect(pixel).toBe(
			'MicrosoftOneDriveSearchFiles(search=["<encode>abcd</encode>"], scope=["drive"], limit=[10]);',
		);
	});

	it("sends true flags and leaves false ones to the default", () => {
		expect(
			MICROSOFT_PIXELS.outlookListMail({
				folder: "inbox",
				limit: 25,
				subject: "   ",
				unreadOnly: false,
			}),
		).toBe(
			'MicrosoftOutlookListMail(folder=["inbox"], limit=[25], includeBody=[false]);',
		);
		expect(
			MICROSOFT_PIXELS.outlookListMail({
				folder: "inbox",
				limit: 25,
				unreadOnly: true,
			}),
		).toContain("unreadOnly=[true]");
	});

	it("names a reply only for a reply", () => {
		const root = MICROSOFT_PIXELS.teamsDownloadAttachment({
			teamId: "t",
			channelId: "c",
			messageId: "m",
			attachmentId: "a",
			fileName: "x.pdf",
		});
		expect(root).not.toContain("replyId");
		expect(root).not.toContain("chatId");
	});
});
