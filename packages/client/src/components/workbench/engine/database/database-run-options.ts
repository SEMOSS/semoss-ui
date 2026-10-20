import { z } from "@semoss/ui/next";

/** The longest timeout SqlQuery takes, in seconds. */
const MAX_TIMEOUT_SECONDS = 2_147_483_647;

const WHOLE_NUMBER = /^\d+$/;

/** Shown beside the timeout when it is not a whole number of seconds. */
export const TIMEOUT_PROBLEM = "Use 1 or more whole seconds, or leave it blank";

/** Whether the timeout text is blank or a whole number of seconds SqlQuery takes. */
const isTimeoutText = (text: string): boolean => {
	const trimmed = text.trim();
	if (!trimmed) {
		return true;
	}
	if (!WHOLE_NUMBER.test(trimmed)) {
		return false;
	}
	const seconds = Number(trimmed);
	return seconds >= 1 && seconds <= MAX_TIMEOUT_SECONDS;
};

/**
 * How a SQL query panel runs its script: one statement at a time, each
 * committing on its own, or every statement in one transaction that commits
 * once, with an optional timeout for the whole script. The timeout is checked
 * only in one transaction, and a blank one means no limit. A field that is not
 * shown is left out, so it takes its default.
 */
export const DATABASE_RUN_OPTIONS_SCHEMA = z
	.object({
		isOneTransaction: z.boolean().default(false),
		timeout: z.string().default(""),
	})
	.superRefine((values, context) => {
		if (values.isOneTransaction && !isTimeoutText(values.timeout)) {
			context.addIssue({
				code: "custom",
				path: ["timeout"],
				message: TIMEOUT_PROBLEM,
			});
		}
	})
	.transform(({ isOneTransaction, timeout }) => {
		const trimmed = timeout.trim();
		return {
			isOneTransaction,
			timeoutSeconds:
				isOneTransaction && trimmed ? Number(trimmed) : undefined,
		};
	});

/** The run options as the fields hold them. */
export type DatabaseRunOptionsInput = z.input<
	typeof DATABASE_RUN_OPTIONS_SCHEMA
>;

/** The run options once checked, with the timeout in seconds. */
export type DatabaseRunOptions = z.output<typeof DATABASE_RUN_OPTIONS_SCHEMA>;

/** A query panel starts running one statement at a time, with no timeout. */
export const DATABASE_RUN_OPTIONS_DEFAULTS: DatabaseRunOptionsInput = {
	isOneTransaction: false,
	timeout: "",
};
