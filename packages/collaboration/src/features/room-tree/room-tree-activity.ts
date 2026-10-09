import { z } from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";

const savedActivitySchema = z.object({
	roomId: z
		.string()
		.min(1)
		.refine((value) => value.trim().length > 0),
	dateUpdated: z.iso.datetime({ offset: true }),
});

/** Browser recency belongs to one signed-in account and one deployment. */
export function roomTreeActivityStorageKey(
	account: string,
	deployment: string,
): string {
	return `semoss:collaboration:room-activity:v1:${encodeURIComponent(deployment)}:${encodeURIComponent(account)}`;
}

/** Restore only room IDs and valid saved timestamps, ignoring corrupt entries. */
export function readRoomTreeActivity(key: string): Map<string, string> {
	const activity = new Map<string, string>();
	try {
		const stored = window.localStorage.getItem(key);
		if (!stored) return activity;
		const parsed: unknown = JSON.parse(stored);
		if (!isRecord(parsed)) return activity;
		for (const [roomId, dateUpdated] of Object.entries(parsed)) {
			const saved = savedActivitySchema.safeParse({
				roomId,
				dateUpdated,
			});
			if (saved.success)
				activity.set(
					saved.data.roomId,
					new Date(saved.data.dateUpdated).toISOString(),
				);
		}
	} catch {
		// Recency remains usable for the current session when storage is unavailable.
	}
	return activity;
}

/** Save transcript activity without persisting room titles or notification payloads. */
export function recordRoomTreeActivity(
	key: string,
	activity: Map<string, string>,
	detail: unknown,
): boolean {
	const saved = savedActivitySchema.safeParse(detail);
	if (!saved.success) return false;
	const timestamp = new Date(saved.data.dateUpdated).toISOString();
	const previous = activity.get(saved.data.roomId);
	if (previous && previous >= timestamp) return false;
	activity.set(saved.data.roomId, timestamp);
	try {
		window.localStorage.setItem(
			key,
			JSON.stringify(Object.fromEntries(activity)),
		);
	} catch {
		// Optional browser persistence must not prevent the visible tree from updating.
	}
	return true;
}
