import { z } from "@semoss/ui/next";
import {
	isAddressEntry,
	readArgFlag,
	readArgList,
	readArgText,
	splitList,
	type ToolArguments,
} from "../core/tool-view-call";
import type { OutgoingMail } from "./mail.pixels";
import type { MailApp } from "./mail-apps";

/*
 * The compose tool view's rules: which form a call gets, what the user's
 * edits change in its arguments, and the other operation it offers instead.
 */

/**
 * What a compose call does. `sendDraft` sends a saved draft by its id, so it
 * has nothing to edit.
 */
export type MailComposeKind =
	| "draft"
	| "send"
	| "reply"
	| "forward"
	| "sendDraft";

/** What the user can change before a compose call runs. */
export interface MailComposeValues {
	/** Addresses, comma separated. */
	to: string;
	cc: string;
	bcc: string;
	subject: string;
	body: string;
	/** Whether a reply goes to everyone on the email. */
	replyAll: boolean;
}

/** The messages the compose form shows when a value cannot be sent. */
export interface MailComposeMessages {
	/** An address list holds something that is not an address. */
	addresses: string;
	/** An email to send has no recipient. */
	recipient: string;
	/** A forward names no one to forward to. */
	forwardTo: string;
	/** A reply has no text. */
	replyBody: string;
}

/** An operation offered in place of a compose call. */
export interface MailComposeAlternative {
	/** What its button does. */
	action: "saveAsDraft" | "sendNow";
	/** The pixel that does it. */
	pixel: string;
	/** What the model is told the user did, such as `savedAsDraft`. */
	userAction: string;
	/** The sentence the model reads about it. */
	summary: string;
}

/**
 * Which compose form a call gets.
 *
 * @param params - The view's URI parameters, whose `intent` is `draft`,
 * `send`, `reply`, or `forward`.
 * @param functionName - The reactor the call runs.
 * @return The kind of compose call.
 */
export const readMailComposeKind = (
	params: Readonly<Record<string, string>>,
	functionName: string,
): MailComposeKind => {
	if (functionName.endsWith("SendDraft")) {
		return "sendDraft";
	}
	const intent = params.intent;
	return intent === "draft" || intent === "reply" || intent === "forward"
		? intent
		: "send";
};

/**
 * The form's starting values: what the model asked for.
 *
 * @param args - The call's arguments.
 * @return The values.
 */
export const toMailComposeValues = (
	args: ToolArguments,
): MailComposeValues => ({
	to: readArgList(args, "to").join(", "),
	cc: readArgList(args, "cc").join(", "),
	bcc: readArgList(args, "bcc").join(", "),
	subject: readArgText(args, "subject"),
	body: readArgText(args, "body"),
	replyAll: readArgFlag(args, "replyAll"),
});

/**
 * The call's arguments with the user's edits in place. Arguments the form
 * does not show, such as attachments, are kept as the model gave them.
 *
 * @param kind - What the call does.
 * @param values - The form's values.
 * @param args - The call's arguments.
 * @return The arguments to run the call with.
 */
export const toMailComposeArguments = (
	kind: MailComposeKind,
	values: MailComposeValues,
	args: ToolArguments,
): Record<string, unknown> => {
	const edited: Record<string, unknown> = { ...args };
	if (kind === "draft" || kind === "send") {
		edited.to = splitList(values.to);
		edited.cc = splitList(values.cc);
		edited.bcc = splitList(values.bcc);
		edited.subject = values.subject;
		edited.body = values.body;
	} else if (kind === "reply") {
		edited.body = values.body;
		edited.replyAll = values.replyAll;
		if (readArgFlag(args, "overrideRecipients")) {
			edited.to = splitList(values.to);
			edited.cc = splitList(values.cc);
		}
	} else if (kind === "forward") {
		edited.to = splitList(values.to);
		edited.body = values.body;
	}
	return edited;
};

/**
 * An email's arguments, as `SendMail` and `SaveDraft` take them.
 *
 * @param args - The call's arguments.
 * @return The email.
 */
const toOutgoingMail = (args: ToolArguments): OutgoingMail => ({
	to: readArgList(args, "to"),
	cc: readArgList(args, "cc"),
	bcc: readArgList(args, "bcc"),
	subject: readArgText(args, "subject"),
	body: readArgText(args, "body"),
	html: readArgFlag(args, "html"),
	attachments: readArgList(args, "attachments"),
});

/**
 * The operation offered in place of a compose call, on the same mailbox: a
 * send can be saved as a draft instead, and a draft sent now.
 *
 * @param kind - What the call does.
 * @param app - The mailbox.
 * @param args - The call's arguments, with the user's edits.
 * @return The operation, or null when there is none.
 */
export const mailComposeAlternative = (
	kind: MailComposeKind,
	app: MailApp,
	args: ToolArguments,
): MailComposeAlternative | null => {
	const isDraft = readArgFlag(args, "asDraft");
	switch (kind) {
		case "send":
			return {
				action: "saveAsDraft",
				pixel: app.pixels.saveDraft(toOutgoingMail(args)),
				userAction: "savedAsDraft",
				summary:
					"The user saved this email as a draft instead of sending it.",
			};
		case "draft":
			return {
				action: "sendNow",
				pixel: app.pixels.sendMail(toOutgoingMail(args)),
				userAction: "sent",
				summary:
					"The user sent this email instead of saving it as a draft.",
			};
		case "reply":
			return {
				action: isDraft ? "sendNow" : "saveAsDraft",
				pixel: app.pixels.replyMail({
					id: readArgText(args, "id"),
					body: readArgText(args, "body"),
					html: readArgFlag(args, "html"),
					replyAll: readArgFlag(args, "replyAll"),
					overrideRecipients: readArgFlag(args, "overrideRecipients"),
					to: readArgList(args, "to"),
					cc: readArgList(args, "cc"),
					asDraft: !isDraft,
					attachments: readArgList(args, "attachments"),
				}),
				userAction: isDraft ? "sent" : "savedAsDraft",
				summary: isDraft
					? "The user sent this reply instead of saving it as a draft."
					: "The user saved this reply as a draft instead of sending it.",
			};
		case "forward":
			return {
				action: isDraft ? "sendNow" : "saveAsDraft",
				pixel: app.pixels.forwardMail({
					id: readArgText(args, "id"),
					to: readArgList(args, "to"),
					body: readArgText(args, "body"),
					html: readArgFlag(args, "html"),
					asDraft: !isDraft,
					attachments: readArgList(args, "attachments"),
				}),
				userAction: isDraft ? "sent" : "savedAsDraft",
				summary: isDraft
					? "The user sent this forward instead of saving it as a draft."
					: "The user saved this forward as a draft instead of sending it.",
			};
		default:
			return null;
	}
};

/**
 * The compose form's rules for one kind of call.
 *
 * @param kind - What the call does.
 * @param messages - What the form says when a value cannot be sent.
 * @return The schema.
 */
export const createMailComposeSchema = (
	kind: MailComposeKind,
	messages: MailComposeMessages,
) => {
	const addresses = z
		.string()
		.refine((value) => splitList(value).every(isAddressEntry), {
			message: messages.addresses,
		});
	return z
		.object({
			to: addresses,
			cc: addresses,
			bcc: addresses,
			subject: z.string(),
			body: z.string(),
			replyAll: z.boolean(),
		})
		.superRefine((values, context) => {
			const hasRecipient = [values.to, values.cc, values.bcc].some(
				(value) => splitList(value).length > 0,
			);
			if (kind === "send" && !hasRecipient) {
				context.addIssue({
					code: "custom",
					path: ["to"],
					message: messages.recipient,
				});
			}
			if (kind === "forward" && splitList(values.to).length === 0) {
				context.addIssue({
					code: "custom",
					path: ["to"],
					message: messages.forwardTo,
				});
			}
			if (kind === "reply" && values.body.trim() === "") {
				context.addIssue({
					code: "custom",
					path: ["body"],
					message: messages.replyBody,
				});
			}
		});
};
