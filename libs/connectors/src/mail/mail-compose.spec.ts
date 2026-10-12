import { describe, expect, it } from "vitest";
import { MAIL_APPS } from "./mail-apps";
import {
	createMailComposeSchema,
	mailComposeAlternative,
	readMailComposeKind,
	toMailComposeArguments,
	toMailComposeValues,
} from "./mail-compose";

const MESSAGES = {
	addresses: "addresses",
	recipient: "recipient",
	forwardTo: "forwardTo",
	replyBody: "replyBody",
};

describe("mail compose", () => {
	it("tells each compose call apart", () => {
		expect(
			readMailComposeKind({ intent: "reply" }, "GoogleGmailReplyMail"),
		).toBe("reply");
		expect(
			readMailComposeKind(
				{ intent: "send" },
				"MicrosoftOutlookSendDraft",
			),
		).toBe("sendDraft");
		expect(readMailComposeKind({}, "GoogleGmailSendMail")).toBe("send");
	});

	it("starts from the model's arguments and keeps what the form leaves alone", () => {
		const args = {
			to: ["ada@example.com", "grace@example.com"],
			cc: "lin@example.com",
			subject: "Q3",
			body: "Hello",
			html: true,
			attachments: ["notes.pdf"],
			saveToSentItems: false,
		};
		const values = toMailComposeValues(args);
		expect(values).toMatchObject({
			to: "ada@example.com, grace@example.com",
			cc: "lin@example.com",
			bcc: "",
			replyAll: false,
		});
		expect(
			toMailComposeArguments(
				"send",
				{ ...values, to: "ada@example.com", cc: "" },
				args,
			),
		).toEqual({
			...args,
			to: ["ada@example.com"],
			cc: [],
			bcc: [],
		});
	});

	it("changes a reply's recipients only when the call replaces them", () => {
		const values = {
			...toMailComposeValues({}),
			to: "ada@example.com",
			body: "Thanks",
			replyAll: true,
		};
		expect(toMailComposeArguments("reply", values, { id: "m" })).toEqual({
			id: "m",
			body: "Thanks",
			replyAll: true,
		});
		expect(
			toMailComposeArguments("reply", values, {
				id: "m",
				overrideRecipients: true,
			}),
		).toMatchObject({ to: ["ada@example.com"], cc: [] });
	});

	it("offers a draft in place of a send, and a send in place of a draft", () => {
		const app = MAIL_APPS.google;
		const args = { to: ["ada@example.com"], subject: "Q3", body: "Hi" };
		expect(mailComposeAlternative("send", app, args)).toMatchObject({
			action: "saveAsDraft",
			userAction: "savedAsDraft",
			pixel: expect.stringMatching(/^GoogleGmailSaveDraft\(/),
		});
		expect(mailComposeAlternative("draft", app, args)).toMatchObject({
			action: "sendNow",
			userAction: "sent",
			pixel: expect.stringMatching(/^GoogleGmailSendMail\(/),
		});
		expect(
			mailComposeAlternative("reply", MAIL_APPS.microsoft, {
				id: "m",
				body: "Thanks",
				asDraft: true,
			})?.pixel,
		).toContain("asDraft=[false]");
		expect(
			mailComposeAlternative("sendDraft", app, { id: "d" }),
		).toBeNull();
	});

	it("checks addresses, and what each call needs", () => {
		const values = { ...toMailComposeValues({}), body: "" };
		const issues = (
			kind: Parameters<typeof createMailComposeSchema>[0],
			value: typeof values,
		) =>
			createMailComposeSchema(kind, MESSAGES)
				.safeParse(value)
				.error?.issues.map((issue) => issue.message) ?? [];
		expect(issues("send", values)).toEqual(["recipient"]);
		expect(issues("draft", values)).toEqual([]);
		expect(issues("forward", values)).toEqual(["forwardTo"]);
		expect(issues("reply", values)).toEqual(["replyBody"]);
		expect(
			issues("send", {
				...values,
				to: "Ada <ada@example.com>, grace@example.com",
			}),
		).toEqual([]);
		expect(issues("draft", { ...values, cc: "not an address" })).toEqual([
			"addresses",
		]);
	});
});
