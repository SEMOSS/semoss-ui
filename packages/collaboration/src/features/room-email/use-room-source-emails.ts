import { useCallback, useEffect, useState } from "react";
import { toError } from "@semoss/utility/error";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import {
	canReadRoomSource,
	type RoomSource,
} from "@/features/rooms/source-import/room-source";
import { loadRoomSourceEmails } from "./load-room-source-emails";
import type { RoomEmailSession } from "./room-email.context";

interface SourceEmails {
	sourceMessages: WorkspaceMessage[];
	isSourceLoading: boolean;
	sourceError: string | null;
	reloadSource: () => void;
}

interface SourceRead {
	session: RoomEmailSession;
	source: RoomSource;
	messages: WorkspaceMessage[];
	error: string | null;
	isLoading: boolean;
	revision: number;
}

/** Keep source reads with their room and ignore completions after navigation. */
export function useRoomSourceEmails(
	session: RoomEmailSession,
	source: RoomSource | null,
	isReady: boolean,
): SourceEmails {
	const [read, setRead] = useState<SourceRead | null>(null);
	const [revision, setRevision] = useState(0);
	const reloadSource = useCallback(
		() => setRevision((value) => value + 1),
		[],
	);
	const canRead = isReady && canReadRoomSource(source);
	useEffect(() => {
		if (!canRead || !source) return;
		// A retry is explicit; ordinary turn/stream updates do not refetch the source.
		let isCurrent = true;
		const release = session.retain();
		setRead({
			session,
			source,
			messages: [],
			error: null,
			isLoading: true,
			revision,
		});
		void loadRoomSourceEmails(session.insight.actions, source)
			.then(
				(messages) => {
					if (isCurrent)
						setRead({
							session,
							source,
							messages,
							error: null,
							isLoading: false,
							revision,
						});
				},
				(cause: unknown) => {
					if (isCurrent)
						setRead({
							session,
							source,
							messages: [],
							error: toError(cause).message,
							isLoading: false,
							revision,
						});
				},
			)
			.finally(release);
		return () => {
			isCurrent = false;
		};
	}, [canRead, revision, session, source]);
	const current =
		canRead &&
		read?.session === session &&
		read.source === source &&
		read.revision === revision
			? read
			: null;
	return {
		sourceMessages: current?.messages ?? [],
		isSourceLoading: canRead && (!current || current.isLoading),
		sourceError: current?.error ?? null,
		reloadSource,
	};
}
