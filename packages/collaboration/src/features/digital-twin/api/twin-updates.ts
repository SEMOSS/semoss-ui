import { type MicrosoftItemRef, saveMicrosoftItem } from "@semoss/connectors";
import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { readTwinRecord, TWIN_FILES_PATH } from "./digital-twin";

// A copy as the twin's pages write one: a single file in one of the folders they copy into. The delete reactor
// removes every file of the twin when it is given no path, and a path that names a folder (".." names the one
// above) removes the folder, so nothing but this shape reaches the reactor that writes over a copy or the one
// that removes it.
const COPY_PATH = /^public\/(emails|teams-chats|files)\/(?!\.{1,2}$)[^/\\]+$/;

const updateSchema = z.object({
	// what settles it
	id: z.string().min(1),
	// the twin's project
	twinId: z.string().min(1),
	kind: z.enum(["email", "chat", "file"]),
	change: z.enum(["changed", "gone", "duplicate"]),
	// the copy, as its record names it: no leading slash
	path: z.string().regex(COPY_PATH),
	// what its place reads the item by: conversation:<id>, a chat's id, or a drive item's id
	key: z.string().min(1),
	// the drive a file is in, when its copy recorded one
	driveId: z.string().optional(),
	// the source's own title: a thread's subject, a file's name as it is now
	title: z.string().optional(),
	// new emails or messages
	count: z.number().optional(),
	// a chat's count is a floor: everything the check read of it was newer than the copy
	more: z.boolean().optional(),
	latestFrom: z.string().optional(),
	// when the source last changed, and when the copy was last known current
	latestAt: z.string().optional(),
	copiedAt: z.string().optional(),
	// where a file opens in its own app
	webUrl: z.string().optional(),
	// for a duplicate, the newer copy of the same item
	newerCopy: z.string().optional(),
});
const checkSchema = z.object({
	id: z.string().nullish(),
	status: z.string().nullish(),
	step: z.string().nullish(),
	progress: z.number().nullish(),
	error: z.string().nullish(),
	startedAt: z.string().nullish(),
	finishedAt: z.string().nullish(),
	counts: z
		.object({
			// by a twin's id: how many of its copies the check compared, and how many of those could not be read
			// where they came from. A twin the check did not read is not in here.
			byTwin: z
				.record(
					z.string(),
					z.object({ copies: z.number(), unknown: z.number() }),
				)
				.optional(),
		})
		.nullish()
		// a job that counts another way says nothing of what it compared
		.catch(null),
});
const listSchema = z.object({
	updates: z.array(z.unknown()),
	lastCheck: checkSchema.nullish(),
});

/** Something a check found in one of the owner's twins that waits for them: a copy to update, or one to remove. */
export type TwinUpdate = z.infer<typeof updateSchema>;

/** A check of the owner's twins, as the server reports its job. */
export type TwinCheck = z.infer<typeof checkSchema>;

/** What waits for the owner across their twins, and their last check. */
export interface TwinUpdates {
	/** The newest first. */
	updates: TwinUpdate[];
	/** Their last check, running or over; null when there was none. */
	lastCheck: TwinCheck | null;
}

const CHECK_POLL_MS = 1500;
const CHECK_TIMEOUT_MS = 10 * 60_000;

/**
 * What the last checks found in the owner's twins and they have not acted on.
 * Reading it starts a check on the server when one is due. An entry whose
 * copy is not one file in a twin's copy folders is left out.
 */
export async function listTwinUpdates(
	actions: InsightActions,
): Promise<TwinUpdates> {
	const { updates, lastCheck } = await callPixel(
		actions,
		pixel("WorkListTwinUpdates"),
		listSchema,
	);
	return {
		updates: updates.flatMap((entry) => {
			const update = updateSchema.safeParse(entry);
			return update.success ? [update.data] : [];
		}),
		lastCheck: lastCheck ?? null,
	};
}

/**
 * Check the owner's twins now, and wait until the check is over.
 *
 * @param onProgress - Told the check as it starts and each time it is read again.
 * @param wait - Waits between reads; a test passes its own.
 * @throws when the owner has to sign in to Microsoft 365 (the server's own
 * error, which names the account as JSON), when the check fails, and when it
 * runs too long.
 */
export async function checkTwinUpdates(
	actions: InsightActions,
	onProgress?: (check: TwinCheck) => void,
	wait: (ms: number) => Promise<void> = (ms) =>
		new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<void> {
	let check = await callPixel(
		actions,
		pixel("WorkCheckTwinUpdates"),
		checkSchema,
	);
	const deadline = Date.now() + CHECK_TIMEOUT_MS;
	while (check.status === "running" && check.id) {
		onProgress?.(check);
		if (Date.now() > deadline)
			throw new Error("Checking your Digital Twins is taking too long.");
		await wait(CHECK_POLL_MS);
		check = await callPixel(
			actions,
			pixel("BrainGetJob", { jobId: check.id }),
			checkSchema,
		);
	}
	if (check.status !== "done")
		throw new Error(check.error || "The check did not finish.");
}

/** The copy's file name, which it keeps through an update. */
export function twinCopyName(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1);
}

function requireCopyPath(path: string): void {
	if (!COPY_PATH.test(path))
		throw new Error("That is not a copy in a Digital Twin.");
}

/**
 * What is at a suggestion's path now. A suggestion is as old as its check:
 * since then its copy may have been removed, and a file of another item, or
 * of none, may have taken the name. "held" only while the file is there and
 * the twin's record still names this item for it; for the older of two
 * copies, only while the newer one is still held too.
 */
async function copyNow(
	actions: InsightActions,
	update: TwinUpdate,
): Promise<"held" | "replaced" | "gone"> {
	const [found, record] = await Promise.all([
		// every file under the twin's folder, as the page reads what the twin holds; a listing starts its paths with a slash
		callPixel(
			actions,
			pixel("SearchAppAssets", {
				project: update.twinId,
				filePath: TWIN_FILES_PATH,
				search: ".",
				options: ["regex"],
			}),
			z.array(z.object({ path: z.string() })),
		),
		readTwinRecord(actions, update.twinId),
	]);
	const listed = new Set(found.map((item) => item.path.replace(/^\/+/, "")));
	const isCopy = (path: string | undefined): boolean =>
		path !== undefined && listed.has(path) && record[path] === update.key;
	if (!listed.has(update.path)) return "gone";
	if (!isCopy(update.path)) return "replaced";
	return update.change === "duplicate" && !isCopy(update.newerCopy)
		? "replaced"
		: "held";
}

/** Drop a suggestion whose copy is not what it was about, and say so. Nothing in the twin is touched. */
async function refuse(
	actions: InsightActions,
	update: TwinUpdate,
	now: "replaced" | "gone",
): Promise<never> {
	await settle(actions, update, "dismissed");
	throw new Error(
		now === "gone"
			? "That copy is no longer in your Digital Twin."
			: "That copy has changed since the last check. Check again.",
	);
}

function settle(
	actions: InsightActions,
	update: TwinUpdate,
	action: "applied" | "dismissed",
): Promise<unknown> {
	return callPixel(
		actions,
		pixel("WorkSettleTwinUpdate", { updateId: update.id, action }),
		z.unknown(),
	);
}

/** The item a copy came from, as its viewer saves it. */
function toItem(update: TwinUpdate): MicrosoftItemRef {
	switch (update.kind) {
		case "email":
			return {
				kind: "email",
				conversationId: update.key.replace(/^conversation:/, ""),
			};
		case "chat":
			return { kind: "chat", chatId: update.key };
		default:
			return {
				kind: "file",
				itemId: update.key,
				driveId: update.driveId,
				name: twinCopyName(update.path),
			};
	}
}

/**
 * Bring a copy up to date: the item is saved again into the page's files,
 * the way its viewer saves it, and written over the copy under the name the
 * copy has. A copy the owner removed since is not brought back, and a file
 * that is no longer this item's copy is not written over; the suggestion is
 * dropped and that is said.
 *
 * @param insightId - The page's insight, whose files the item is saved into.
 * @throws when the copy is gone or is another file now, when the item could
 * not be read (also when Microsoft 365 needs a sign in), or when the copy
 * could not be written.
 */
export async function applyTwinUpdate(
	actions: InsightActions,
	insightId: string,
	update: TwinUpdate,
): Promise<void> {
	requireCopyPath(update.path);
	const now = await copyNow(actions, update);
	if (now !== "held") return refuse(actions, update, now);
	const saved = await saveMicrosoftItem(insightId, toItem(update));
	const { targetFilePath } = await callPixel(
		actions,
		pixel("Copy", {
			sourceType: "INSIGHT",
			sourceFilePath: saved.path,
			target: update.twinId,
			targetType: "PROJECT",
			targetFilePath: update.path,
			override: true,
		}),
		z.object({ targetFilePath: z.string() }),
	);
	if (targetFilePath !== update.path)
		throw new Error(`The copy was written to "${targetFilePath}" instead.`);
	await settle(actions, update, "applied");
}

/**
 * Remove a copy from its twin: one whose original is gone, or the older of
 * two copies of one item. A copy that is already gone only loses its
 * suggestion.
 *
 * @throws when the file is no longer this item's copy, or the newer copy it
 * was to make way for is gone: nothing is removed then.
 */
export async function removeTwinCopy(
	actions: InsightActions,
	update: TwinUpdate,
): Promise<void> {
	requireCopyPath(update.path);
	const now = await copyNow(actions, update);
	if (now === "replaced") return refuse(actions, update, now);
	if (now === "held")
		await callPixel(
			actions,
			pixel("DeleteAppAssets", {
				project: update.twinId,
				filePath: `/${update.path}`,
			}),
			z.unknown(),
		);
	await settle(actions, update, "dismissed");
}

/** Keep the copy as it is. The suggestion stays away until the original changes again. */
export async function dismissTwinUpdate(
	actions: InsightActions,
	update: TwinUpdate,
): Promise<void> {
	await settle(actions, update, "dismissed");
}
