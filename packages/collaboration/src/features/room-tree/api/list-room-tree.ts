import { z } from "@semoss/ui/next";
import { listRoomsPage } from "@/features/rooms/api/list-rooms";
import {
	type RoomRow,
	roomOptionsEnvelopeSchema,
} from "@/features/rooms/api/room-schemas";
import { roomSourceSchema } from "@/features/rooms/source-import/room-source";
import {
	callPixel,
	type InsightActions,
	type OutputSchema,
	pixel,
} from "@/lib/pixel";
import type { RoomTreeResponse } from "../room-tree.types";
import { groupRoomTree, type RoomTreeAssociation } from "../room-tree-grouping";

const optionalText = z
	.string()
	.nullish()
	.transform((value) => value ?? undefined);
const topicPageSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().min(1),
			name: z.string(),
			short: optionalText,
			status: optionalText,
		}),
	),
	total: z.number().int().nonnegative(),
});
const threadPageSchema = z.object({
	items: z.array(
		z.object({
			id: z.string().min(1),
			roomId: optionalText,
			topicLinks: z.array(z.object({ topicId: z.string().min(1) })),
		}),
	),
	total: z.number().int().nonnegative(),
});
const legacySourceSchema = z.object({ threadId: z.string().min(1) });

/** Stop walking older pages once this account's shell has gone away. */
function assertActive(isActive: () => boolean): void {
	if (!isActive()) throw new Error("Room refresh was superseded.");
}

/** Follow existing directory offsets rather than the Work/Brain screen's loading cap. */
async function readDirectory<T extends { id: string }>(
	actions: InsightActions,
	reactor: "BrainListTopics" | "BrainListThreads",
	schema: OutputSchema<{ items: T[]; total: number }>,
	isActive: () => boolean,
): Promise<T[]> {
	const rows = new Map<string, T>();
	let offset = 0;
	while (true) {
		assertActive(isActive);
		const page = await callPixel(
			actions,
			pixel(reactor, { limit: 250, offset }),
			schema,
		);
		const previousSize = rows.size;
		for (const row of page.items) rows.set(row.id, row);
		offset += page.items.length;
		if (page.items.length > 0 && rows.size === previousSize)
			throw new Error("Could not finish loading topic links. Try again.");
		if (offset >= page.total) return [...rows.values()];
		if (rows.size === previousSize)
			throw new Error("Could not finish loading topic links. Try again.");
	}
}

/** Existing history pages contain summaries only; never open conversations for navigation. */
async function readRooms(
	actions: InsightActions,
	isActive: () => boolean,
): Promise<RoomRow[]> {
	const rooms = new Map<string, RoomRow>();
	let offset = 0;
	while (true) {
		assertActive(isActive);
		const page = await listRoomsPage(actions, offset);
		const previousSize = rooms.size;
		for (const room of page.rooms) rooms.set(room.roomId, room);
		if (page.rooms.length > 0 && rooms.size === previousSize)
			throw new Error("Could not finish loading rooms. Try again.");
		if (!page.hasMore) return [...rooms.values()];
		if (page.nextOffset <= offset || rooms.size === previousSize)
			throw new Error("Could not finish loading rooms. Try again.");
		offset = page.nextOffset;
	}
}

/** A malformed explicit source must not fall through to an unrelated legacy link. */
async function readAssociation(
	actions: InsightActions,
	roomId: string,
): Promise<RoomTreeAssociation> {
	const { OPTIONS: options } = await callPixel(
		actions,
		pixel("GetRoomOptions", { roomId }),
		roomOptionsEnvelopeSchema,
	);
	if (options.source !== undefined)
		return { threadId: roomSourceSchema.parse(options.source).threadId };
	if (options.workThread !== undefined)
		return {
			threadId: legacySourceSchema.parse(options.workThread).threadId,
		};
	return { threadId: null };
}

// TODO(room-tree-cleanup): Replace repeated full-history scans and per-room reads
// with incremental metadata loading/cache invalidation. Retire browser recency
// when existing APIs expose saved activity. Preserve source precedence, account
// isolation, global pagination, and navigation state; keep this frontend-only.
/** Resolve canonical room summaries using existing APIs, before local pagination. */
export async function listRoomTree(
	actions: InsightActions,
	activity: ReadonlyMap<string, string> = new Map(),
	isActive: () => boolean = () => true,
): Promise<RoomTreeResponse> {
	const [topics, threads, rooms] = await Promise.all([
		readDirectory(actions, "BrainListTopics", topicPageSchema, isActive),
		readDirectory(actions, "BrainListThreads", threadPageSchema, isActive),
		readRooms(actions, isActive),
	]);
	const associations = new Map<string, RoomTreeAssociation>();
	let unavailable = 0;
	// Four metadata reads at a time keeps large histories from flooding the existing API.
	for (let offset = 0; offset < rooms.length; offset += 4) {
		assertActive(isActive);
		await Promise.all(
			rooms.slice(offset, offset + 4).map(async (room) => {
				try {
					associations.set(
						room.roomId,
						await readAssociation(actions, room.roomId),
					);
				} catch {
					unavailable += 1;
					associations.set(room.roomId, {
						threadId: null,
						unavailable: true,
					});
				}
			}),
		);
	}
	assertActive(isActive);
	return {
		...groupRoomTree(topics, threads, rooms, associations, activity),
		warning: unavailable
			? "Some topic links could not be read. All rooms are still shown. Retry to check their topics again."
			: undefined,
	};
}
