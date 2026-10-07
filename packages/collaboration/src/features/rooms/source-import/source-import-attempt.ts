import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import type { InsightActions } from "@/lib/pixel";
import { uploadRoomFiles } from "../api/upload-room-files";
import { createRoomSession, type RoomSession } from "../room-session";
import {
	loadSourceThread,
	type SourceThreadDocument,
} from "./load-source-thread";
import type { RoomSource } from "./room-source";
import { roomSourceFromDocument, sourceThreadFile } from "./source-thread-file";

interface SourceImportSnapshot {
	phase:
		| "loading-source"
		| "creating-room"
		| "saving-file"
		| "ready"
		| "failed";
	error: string | null;
	roomId: string;
}

/** Verified room and file destinations produced by one source import. */
export interface SourceImportResult {
	roomId: string;
	file: RoomSource["file"];
}

/** One route activation owns one import, including all retries of its partial work. */
export interface SourceImportAttempt {
	retain: () => () => void;
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => SourceImportSnapshot;
	start: () => Promise<SourceImportResult | null>;
}

const pendingImports = new Map<
	string,
	{
		attempt: SourceImportAttempt;
		setStateReader: (reader: () => CollaborationState) => void;
	}
>();

/** Create a lazy import; repeated starts join the same active transaction. */
export function createSourceImportAttempt(
	scope: string,
	threadId: string,
	actions: InsightActions,
	getState: () => CollaborationState,
): SourceImportAttempt {
	const key = JSON.stringify([scope, threadId]);
	const existing = pendingImports.get(key);
	if (existing) {
		existing.setStateReader(getState);
		return existing.attempt;
	}
	const listeners = new Set<() => void>();
	let stateReader = getState;
	let owners = 0;
	let session: RoomSession | undefined;
	let document: SourceThreadDocument | undefined;
	let uploadedFile: RoomSource["file"] | undefined;
	let pending: Promise<SourceImportResult | null> | undefined;
	let snapshot: SourceImportSnapshot = {
		phase: "loading-source",
		error: null,
		roomId: "",
	};
	const update = (changes: Partial<SourceImportSnapshot>) => {
		snapshot = { ...snapshot, ...changes };
		for (const listener of listeners) listener();
	};
	const assertActive = () => {
		if (owners === 0)
			throw new DOMException(
				"This thread is no longer open.",
				"AbortError",
			);
	};
	const run = async (): Promise<SourceImportResult | null> => {
		let releaseRoom: (() => void) | undefined;
		try {
			assertActive();
			if (snapshot.phase === "ready" && uploadedFile)
				return { roomId: snapshot.roomId, file: uploadedFile };
			update({
				error: null,
				phase: document ? "creating-room" : "loading-source",
			});
			document ??= await loadSourceThread(
				actions,
				() => stateReader(),
				threadId,
				assertActive,
			);
			assertActive();
			session ??= createRoomSession(scope);
			releaseRoom = session.retain();
			update({ phase: "creating-room" });
			await session.initialize();
			assertActive();
			const roomId = await session.create(document.thread.subject);
			assertActive();
			update({ phase: "saving-file", roomId });
			if (!uploadedFile) {
				const [file] = await uploadRoomFiles(
					session.insight.insightId,
					[sourceThreadFile(document)],
				);
				if (!file)
					throw new Error("The source file could not be saved.");
				uploadedFile = file;
			}
			assertActive();
			await session.setSource(
				roomSourceFromDocument(document, uploadedFile),
			);
			assertActive();
			update({ phase: "ready", roomId });
			return { roomId, file: uploadedFile };
		} catch (error) {
			if (owners > 0)
				update({
					phase: "failed",
					error:
						error instanceof Error
							? error.message
							: "This thread could not be opened.",
				});
			return null;
		} finally {
			releaseRoom?.();
			if (owners === 0 && session && !session.getSnapshot().roomId) {
				session.dispose();
				session = undefined;
			}
		}
	};
	const attempt: SourceImportAttempt = {
		retain: () => {
			owners += 1;
			let released = false;
			return () => {
				if (released) return;
				released = true;
				owners -= 1;
			};
		},
		subscribe: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		getSnapshot: () => snapshot,
		start: () => {
			if (!pending) {
				pendingImports.set(key, {
					attempt,
					setStateReader: (reader) => {
						stateReader = reader;
					},
				});
				pending = run().finally(() => {
					pending = undefined;
					if (pendingImports.get(key)?.attempt === attempt)
						pendingImports.delete(key);
				});
			}
			return pending;
		},
	};
	return attempt;
}
