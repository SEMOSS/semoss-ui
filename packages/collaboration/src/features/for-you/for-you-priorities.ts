import { z } from "@semoss/ui/next";
import type { Priority } from "./for-you.model";

const prioritiesSchema = z.object({
	version: z.literal(1),
	priorities: z.record(
		z
			.string()
			.min(1)
			.max(500)
			.regex(/^(action|run|review|memory):.+$/),
		z.enum(["P0", "P1", "P2", "P3"]),
	),
});

/** Persist opaque identities and priority only, separately for each account and deployment. */
export function forYouPriorityStorageKey(
	account: string,
	deployment: string,
): string {
	return `semoss:collaboration:for-you-priorities:v1:${encodeURIComponent(deployment)}:${encodeURIComponent(account)}`;
}

/** Corrupt or unavailable browser preferences leave the pending collection usable. */
export function readForYouPriorities(key: string): {
	priorities: Record<string, Priority>;
	error: string;
} {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return { priorities: {}, error: "" };
		const value = prioritiesSchema.safeParse(JSON.parse(raw));
		if (value.success)
			return { priorities: value.data.priorities, error: "" };
		return {
			priorities: {},
			error: "Saved priorities could not be read. Default priorities are shown.",
		};
	} catch {
		return {
			priorities: {},
			error: "Browser priority storage is unavailable. Changes will last for this session.",
		};
	}
}

/** Required writes report failure; callers retain unsaved changes in this session. */
export function saveForYouPriorities(
	key: string,
	priorities: Record<string, Priority>,
): void {
	localStorage.setItem(
		key,
		JSON.stringify(prioritiesSchema.parse({ version: 1, priorities })),
	);
}
