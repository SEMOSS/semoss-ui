import { z } from "@semoss/ui/next";
import {
	isAddressEntry,
	readArgFlag,
	readArgList,
	readArgText,
	splitList,
	type ToolArguments,
} from "../core/tool-view-call";

/*
 * The event form's rules: what it starts from, and what the user's edits
 * change in the call's arguments. A create sends what is filled in; an update
 * changes only what is filled in or was asked for, and leaves the rest of the
 * event as it is.
 */

/** Whether the call creates an event or changes one. */
export type CalendarEventIntent = "create" | "update";

/** What the user can change before an event is created or changed. */
export interface CalendarEventValues {
	subject: string;
	/** A date and time, or a date for an all day event. */
	start: string;
	end: string;
	/** The zone a time without one is read in, such as `America/New_York`. */
	timeZone: string;
	isAllDay: boolean;
	location: string;
	/** Addresses, comma separated. */
	attendees: string;
	optionalAttendees: string;
	body: string;
	isOnlineMeeting: boolean;
}

/** The messages the event form shows when a value cannot be sent. */
export interface CalendarEventMessages {
	/** A created event needs a start and an end. */
	timeRequired: string;
	/** A time cannot be read. */
	timeInvalid: string;
	/** An address list holds something that is not an address. */
	addresses: string;
}

/** The text arguments the form shows, each sent only when filled in. */
const TEXT_KEYS = [
	"subject",
	"start",
	"end",
	"timeZone",
	"location",
	"body",
] as const;

/** The address lists the form shows, each sent only when it holds one. */
const LIST_KEYS = ["attendees", "optionalAttendees"] as const;

/** The yes or no arguments the form shows. */
const FLAG_KEYS = ["isAllDay", "isOnlineMeeting"] as const;

/** A date, or a date and time with an optional zone, as the reactors read them. */
const EVENT_TIME =
	/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * The form's starting values: what the model asked for.
 *
 * @param args - The call's arguments.
 * @return The values.
 */
export const toCalendarEventValues = (
	args: ToolArguments,
): CalendarEventValues => ({
	subject: readArgText(args, "subject"),
	start: readArgText(args, "start"),
	end: readArgText(args, "end"),
	timeZone: readArgText(args, "timeZone"),
	isAllDay: readArgFlag(args, "isAllDay"),
	location: readArgText(args, "location"),
	attendees: readArgList(args, "attendees").join(", "),
	optionalAttendees: readArgList(args, "optionalAttendees").join(", "),
	body: readArgText(args, "body"),
	isOnlineMeeting: readArgFlag(args, "isOnlineMeeting"),
});

/**
 * The call's arguments with the user's edits in place. A field left empty is
 * left out, so an update keeps what the event has. A yes or no field is sent
 * when creating, when the model set it, or when the user changed it.
 * Arguments the form does not show, such as a reminder or a recurrence, are
 * kept as the model gave them.
 *
 * @param intent - Whether the call creates or changes an event.
 * @param values - The form's values.
 * @param args - The call's arguments.
 * @param changed - Which yes or no fields the user changed.
 * @return The arguments to run the call with.
 */
export const toCalendarEventArguments = (
	intent: CalendarEventIntent,
	values: CalendarEventValues,
	args: ToolArguments,
	changed: Partial<Record<(typeof FLAG_KEYS)[number], boolean>>,
): Record<string, unknown> => {
	const edited: Record<string, unknown> = { ...args };
	for (const key of TEXT_KEYS) {
		const value = values[key].trim();
		if (value) {
			edited[key] = value;
		} else {
			delete edited[key];
		}
	}
	for (const key of LIST_KEYS) {
		const list = splitList(values[key]);
		if (list.length > 0) {
			edited[key] = list;
		} else {
			delete edited[key];
		}
	}
	for (const key of FLAG_KEYS) {
		if (intent === "create" || key in args || changed[key]) {
			edited[key] = values[key];
		}
	}
	return edited;
};

/**
 * The event form's rules.
 *
 * @param intent - Whether the call creates or changes an event.
 * @param messages - What the form says when a value cannot be sent.
 * @return The schema.
 */
export const createCalendarEventSchema = (
	intent: CalendarEventIntent,
	messages: CalendarEventMessages,
) => {
	const time = z
		.string()
		.trim()
		.refine((value) => value === "" || EVENT_TIME.test(value), {
			message: messages.timeInvalid,
		})
		.refine((value) => intent === "update" || value !== "", {
			message: messages.timeRequired,
		});
	const addresses = z
		.string()
		.refine((value) => splitList(value).every(isAddressEntry), {
			message: messages.addresses,
		});
	return z.object({
		subject: z.string(),
		start: time,
		end: time,
		timeZone: z.string(),
		isAllDay: z.boolean(),
		location: z.string(),
		attendees: addresses,
		optionalAttendees: addresses,
		body: z.string(),
		isOnlineMeeting: z.boolean(),
	});
};
