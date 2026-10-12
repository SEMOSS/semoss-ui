import { useCallback, useEffect, useRef, useState } from "react";
import { toError } from "@semoss/utility/error";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { MAIL_SENT_EVENT } from "@/features/connectors/api/microsoft";
import type { SourceThreadDocument } from "@/features/rooms/source-import/load-source-thread";
import {
	canReadRoomSource,
	type RoomSource,
} from "@/features/rooms/source-import/room-source";
import {
	roomSourceFromDocument,
	type SourceEmailDraft,
	sourceThreadMarkdown,
} from "@/features/rooms/source-import/source-thread-file";
import { loadRoomSourceEmails } from "./load-room-source-emails";
import type { RoomEmailSession } from "./room-email.context";
import { roomSourceDocument } from "./room-source-document";

interface SourceEmails {
	sourceMessages: WorkspaceMessage[];
	isSourceLoading: boolean;
	sourceError: string | null;
	reloadSource: () => void;
}

interface SourceRead {
	session: RoomEmailSession;
	key: string;
	messages: WorkspaceMessage[];
	error: string | null;
	isLoading: boolean;
}

const EMPTY_DRAFTS: SourceEmailDraft[] = [];

/** Refresh the active room's source and file without sending an assistant message. */
export function useRoomSourceEmails(
	session: RoomEmailSession,
	source: RoomSource | null,
	isReady: boolean,
	drafts: SourceEmailDraft[] = EMPTY_DRAFTS,
	onFileUpdated?: (path: string) => void,
): SourceEmails {
	const collaboration = useOptionalCollaborationSession();
	const updates = useWorkUpdates();
	const [read, setRead] = useState<SourceRead | null>(null);
	const currentInput = useRef({
		source,
		drafts,
		collaboration,
		onFileUpdated,
	});
	currentInput.current = { source, drafts, collaboration, onFileUpdated };
	const refreshRef = useRef<(() => void) | null>(null);
	const writeRef = useRef<(() => void) | null>(null);
	const reloadSource = useCallback(() => refreshRef.current?.(), []);
	const key = source
		? JSON.stringify([
				source.threadId,
				source.file,
				source.kind,
				source.channel,
			])
		: "";
	const canRead =
		isReady &&
		(canReadRoomSource(source) ||
			(source?.channel === "email" &&
				(source.kind === "brain" ||
					(source.kind === "outlook" && Boolean(source.nativeId)))));
	const sourceRevision = JSON.stringify([
		collaboration?.state.threads.find(
			(thread) => thread.id === source?.threadId,
		),
		collaboration?.state.rules,
		collaboration?.state.people,
		collaboration?.state.deletedSourceIds,
	]);
	const previousRevision = useRef([sourceRevision, updates?.lastUpdated]);

	useEffect(() => {
		if (!canRead) return;
		let isCurrent = true;
		let isReading = false;
		let hasQueuedRead = false;
		let document: SourceThreadDocument | null = null;
		let lastWritten = "";
		let pendingWrite: { revision: string } | null = null;
		let writeTimer: ReturnType<typeof setTimeout> | undefined;
		const write = async () => {
			const input = currentInput.current;
			if (!isCurrent || !document || input.source?.channel !== "email")
				return;
			const refreshedSource = {
				...roomSourceFromDocument(document, input.source.file),
				nativeId: input.source.nativeId,
				webLink: input.source.webLink,
			};
			const markdown = sourceThreadMarkdown(document, input.drafts);
			const revision = JSON.stringify([refreshedSource, markdown]);
			if (
				pendingWrite
					? pendingWrite.revision === revision
					: revision === lastWritten
			)
				return;
			const request = { revision };
			pendingWrite = request;
			try {
				await session.updateSourceFile(refreshedSource, markdown);
				if (!isCurrent) return;
				lastWritten = revision;
				input.onFileUpdated?.(refreshedSource.file.fileLocation);
			} finally {
				if (pendingWrite === request) pendingWrite = null;
			}
		};
		const reportError = (cause: unknown) => {
			if (isCurrent)
				setRead((previous) => ({
					session,
					key,
					messages:
						previous?.session === session && previous.key === key
							? previous.messages
							: [],
					error: toError(cause).message,
					isLoading: false,
				}));
		};
		const refresh = async () => {
			if (!isCurrent) return;
			if (isReading) {
				hasQueuedRead = true;
				return;
			}
			const input = currentInput.current;
			if (!input.source) return;
			isReading = true;
			const release = session.retain();
			setRead((previous) => ({
				session,
				key,
				messages:
					previous?.session === session && previous.key === key
						? previous.messages
						: [],
				error: null,
				isLoading: true,
			}));
			try {
				const messages = await loadRoomSourceEmails(
					session.insight.actions,
					input.source,
					input.source.channel === "email",
				);
				if (!isCurrent) return;
				if (input.source.channel !== "email") {
					setRead({
						session,
						key,
						messages,
						error: null,
						isLoading: false,
					});
					return;
				}
				document = roomSourceDocument(
					input.source,
					messages,
					currentInput.current.collaboration?.state ?? null,
				);
				const allowed = new Set(
					document.messages.map((message) => message.id),
				);
				setRead({
					session,
					key,
					messages: messages.filter((message) =>
						allowed.has(message.id),
					),
					error: null,
					isLoading: false,
				});
				if (input.source.channel === "email") await write();
			} catch (cause) {
				reportError(cause);
			} finally {
				release();
				isReading = false;
				if (isCurrent && hasQueuedRead) {
					hasQueuedRead = false;
					void refresh();
				}
			}
		};
		const refreshVisible = () => {
			if (window.document.visibilityState === "visible") void refresh();
		};
		refreshRef.current = () => void refresh();
		writeRef.current = () => {
			clearTimeout(writeTimer);
			writeTimer = setTimeout(() => void write().catch(reportError), 300);
		};
		void refresh();
		// shortcut: poll visible source bodies until the server exposes a cheap thread revision.
		const isEmail = currentInput.current.source?.channel === "email";
		const interval = isEmail
			? setInterval(refreshVisible, 30_000)
			: undefined;
		if (isEmail) {
			window.addEventListener("focus", refreshVisible);
			window.document.addEventListener(
				"visibilitychange",
				refreshVisible,
			);
			window.addEventListener(MAIL_SENT_EVENT, refreshVisible);
		}
		return () => {
			isCurrent = false;
			refreshRef.current = null;
			writeRef.current = null;
			clearInterval(interval);
			clearTimeout(writeTimer);
			window.removeEventListener("focus", refreshVisible);
			window.document.removeEventListener(
				"visibilitychange",
				refreshVisible,
			);
			window.removeEventListener(MAIL_SENT_EVENT, refreshVisible);
		};
	}, [canRead, key, session]);

	useEffect(() => {
		if (
			previousRevision.current[0] === sourceRevision &&
			previousRevision.current[1] === updates?.lastUpdated
		)
			return;
		previousRevision.current = [sourceRevision, updates?.lastUpdated];
		if (currentInput.current.source?.channel === "email")
			refreshRef.current?.();
	}, [sourceRevision, updates?.lastUpdated]);
	useEffect(() => {
		void drafts;
		writeRef.current?.();
	}, [drafts]);
	const current =
		canRead && read?.session === session && read.key === key ? read : null;
	return {
		sourceMessages: current?.messages ?? [],
		isSourceLoading: canRead && (!current || current.isLoading),
		sourceError: current?.error ?? null,
		reloadSource,
	};
}
