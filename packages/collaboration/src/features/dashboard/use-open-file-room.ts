import { useRef, useState } from "react";
import { Env, useInsight } from "@semoss/sdk/react";
import { toast, z } from "@semoss/ui/next";
import { useRecordIds } from "@/features/collaboration/live/work-updates.context";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { linkRoomTopic } from "@/features/rooms/api/room-topics";
import { showFileOnOpen } from "@/features/rooms/room-file-to-show";
import {
	createRoomSession,
	getRoomSession,
} from "@/features/rooms/room-session";
import { callPixel, pixel } from "@/lib/pixel";
import { useDashboard } from "./dashboard.context";

/** A file in a OneDrive drive, as the listings name it. */
export interface DriveFile {
	id: string;
	/** The drive holding it; the owner's own OneDrive when absent. */
	driveId?: string;
	name: string;
}

interface OpenFileRoom {
	/** The id of the file whose room is opening; empty when none is. */
	openingId: string;
	/** Open the file in its room, making that room first when this browser knows none for it. */
	open: (file: DriveFile) => void;
}

// where MicrosoftOneDriveDownloadFile put the copy, relative to the room's folder
const savedFileSchema = z.object({
	filePath: z.string().min(1),
	name: z.string().nullish(),
});

const fileRoomsSchema = z.object({
	version: z.literal(1),
	rooms: z.record(z.string(), z.string()),
});

/** How many files' rooms are remembered; the oldest are forgotten first. */
const MAX_FILE_ROOMS = 200;

function readFileRooms(storageKey: string): Record<string, string> {
	try {
		const saved = fileRoomsSchema.safeParse(
			JSON.parse(localStorage.getItem(storageKey) ?? "null"),
		);
		return saved.success ? saved.data.rooms : {};
	} catch {
		return {};
	}
}

function saveFileRoom(
	storageKey: string,
	fileKey: string,
	roomId: string,
): void {
	const rooms = readFileRooms(storageKey);
	// taken out first, so a file opened again counts as the newest
	delete rooms[fileKey];
	rooms[fileKey] = roomId;
	try {
		localStorage.setItem(
			storageKey,
			JSON.stringify({
				version: 1,
				rooms: Object.fromEntries(
					Object.entries(rooms).slice(-MAX_FILE_ROOMS),
				),
			}),
		);
	} catch {
		// without storage the next click makes another room, which is all this saves
	}
}

/**
 * Open OneDrive files in a room of their own: the file is copied into the
 * room, shown in its workbench, and the room joins every topic the file is
 * linked to.
 *
 * @returns The action, and which file it is busy with.
 */
// shortcut: a file's room is remembered in this browser only, so another browser
// opens a second room for it; keep the pairing on the server when that matters
export function useOpenFileRoom(): OpenFileRoom {
	const { insightId: scope } = useInsight();
	const { state } = useCollaborationSession();
	const { serverId } = useRecordIds();
	const { openRoom } = useDashboard();
	const [openingId, setOpeningId] = useState("");
	// state lags a second click made in the same frame
	const isOpening = useRef(false);
	const storageKey = `semoss:collaboration:file-rooms:v1:${encodeURIComponent(`${window.location.origin}${Env.MODULE}${window.location.pathname}`)}:${encodeURIComponent(state.profile.email || state.profile.id)}`;

	const openFile = async (file: DriveFile): Promise<void> => {
		const fileKey = `${file.driveId ?? ""}/${file.id}`;
		const savedRoomId = readFileRooms(storageKey)[fileKey];
		let session = savedRoomId
			? getRoomSession(scope, savedRoomId)
			: createRoomSession(scope);
		let release = session.retain();
		try {
			let roomId = savedRoomId;
			if (roomId) {
				await session.initialize();
				// the remembered room no longer loads: start over with a new one
				if (!session.getSnapshot().isReady) roomId = undefined;
			}
			if (!roomId) {
				if (savedRoomId) {
					release();
					session = createRoomSession(scope);
					release = session.retain();
				}
				roomId = await session.create(file.name);
				// only a new room takes the file's topics: one the owner took off a chat stays off
				for (const topic of state.topics) {
					const isLinked = topic.files?.some(
						(linked) =>
							linked.itemId === file.id &&
							(!linked.driveId ||
								!file.driveId ||
								linked.driveId === file.driveId),
					);
					if (isLinked)
						await linkRoomTopic(
							session.insight.actions,
							roomId,
							// a topic made on this page is known to the server by another id
							await serverId(topic.id),
						);
				}
				// before the copy, so a failed copy is tried again in the same room
				saveFileRoom(storageKey, fileKey, roomId);
			}
			// run in the room's own insight, whose folder the copy lands in; a copy already
			// there is brought up to date instead
			const saved = await callPixel(
				session.insight.actions,
				pixel("MicrosoftOneDriveDownloadFile", {
					driveId: file.driveId,
					itemId: file.id,
				}),
				savedFileSchema,
			);
			showFileOnOpen(roomId, {
				path: saved.filePath,
				name: saved.name ?? file.name,
			});
			await openRoom(roomId);
		} finally {
			release();
		}
	};

	return {
		openingId,
		open: (file) => {
			if (isOpening.current) return;
			isOpening.current = true;
			setOpeningId(file.id);
			openFile(file)
				.catch((cause: unknown) =>
					toast.error(
						cause instanceof Error
							? cause.message
							: `${file.name} could not be opened.`,
					),
				)
				.finally(() => {
					isOpening.current = false;
					setOpeningId("");
				});
		},
	};
}
