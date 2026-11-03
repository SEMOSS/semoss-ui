import { describeBilledTo, describeLoggedBilledTo } from "@semoss/shared";
import type { UsageRow } from "./usage.types";

/**
 * Which usage limit a model message's call was billed to, such as "Direct
 * Limit" or "Ops Team Limit".
 *
 * @param row - a model message from the log
 * @returns the limit, "No Limit" when none applied, or "Not Recorded" for a
 * message logged before calls recorded whom they were billed to
 */
export function describeMessageBilledTo(row: UsageRow): string {
	const billedTo = describeLoggedBilledTo(
		row.BILLED_SOURCE_TYPE,
		row.BILLED_SUBJECT_ID,
		row.BILLED_SUBJECT_TYPE,
	);
	if (billedTo !== null) return billedTo;
	// calls record their login type and whom they were billed to together
	return row.USER_TYPE ? describeBilledTo(null) : "Not Recorded";
}
