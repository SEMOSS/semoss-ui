import { z } from "@semoss/ui/next";

/** How many opened twins are remembered; the oldest are forgotten first. */
const MAX_OPENED = 500;
const openedSchema = z.object({
	version: z.literal(1),
	ids: z.array(z.string()),
});

// a twin's id is its own everywhere, so one list per person serves every server this browser signs in to
const storageKey = (person: string): string =>
	`semoss:collaboration:opened-twins:v1:${encodeURIComponent(person)}`;

/**
 * The twins whose chat page a person has opened in this browser, so a list
 * can mark the ones shared with them that they have not looked at yet.
 *
 * @param person - The signed-in person: their email, or their id without one.
 */
// shortcut: remembered in this browser only, so a twin is new again in another browser; keep it on the server when that matters
export function readOpenedTwins(person: string): ReadonlySet<string> {
	try {
		const saved = openedSchema.safeParse(
			JSON.parse(localStorage.getItem(storageKey(person)) ?? "null"),
		);
		return new Set(saved.success ? saved.data.ids : []);
	} catch {
		return new Set();
	}
}

/** Remember that the person opened the twin's chat page here. */
export function markTwinOpened(person: string, twinId: string): void {
	const ids = readOpenedTwins(person);
	if (!twinId || ids.has(twinId)) return;
	try {
		localStorage.setItem(
			storageKey(person),
			JSON.stringify({
				version: 1,
				ids: [...ids, twinId].slice(-MAX_OPENED),
			}),
		);
	} catch {
		// without storage the twin keeps its mark, which is all this saves
	}
}
