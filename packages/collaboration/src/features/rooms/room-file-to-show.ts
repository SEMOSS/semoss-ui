/** A file in a room's folder, as its workbench opens it. */
interface RoomFile {
	path: string;
	name: string;
}

// asked for on one page and shown on the next, so it cannot live in either page's state
const requests = new Map<string, RoomFile>();

/**
 * Have a room show a file in its workbench as soon as the room is on screen.
 *
 * @param roomId - The room about to be opened.
 * @param file - The file, already in the room's folder.
 */
export function showFileOnOpen(roomId: string, file: RoomFile): void {
	requests.set(roomId, file);
}

/**
 * The file a room was asked to show, handed over once.
 *
 * @param roomId - The room now on screen.
 * @returns The file, or undefined when none is waiting.
 */
export function takeFileToShow(roomId: string): RoomFile | undefined {
	const file = requests.get(roomId);
	requests.delete(roomId);
	return file;
}
