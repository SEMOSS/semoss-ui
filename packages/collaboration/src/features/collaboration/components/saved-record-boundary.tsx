import type { ReactNode } from "react";
import { Navigate } from "react-router";
import type { SearchKind } from "../api/collaboration-search";
import { useRecordIds } from "../live/work-updates.context";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { MissingSavedRecord } from "./missing-saved-record";

interface SavedRecordBoundaryProps {
	/** Record kind and identity read from the route. */
	kind: SearchKind;
	id: string;
	/** Detail view, mounted once its record is available. */
	children: ReactNode;
}

/** Makes search destinations and direct links work outside the initial list batch. */
export function SavedRecordBoundary({
	kind,
	id,
	children,
}: SavedRecordBoundaryProps) {
	const { state } = useCollaborationSession();
	const { localId } = useRecordIds();
	const records =
		kind === "thread"
			? state.threads
			: kind === "person"
				? state.people
				: state.topics;
	if (records.some((row) => row.id === id)) return children;
	const local = localId(id);
	// a record made on this page keeps its own id, which its views read from the route
	if (records.some((row) => row.id === local))
		return (
			<Navigate
				to={`../${encodeURIComponent(local)}`}
				relative="path"
				replace
			/>
		);
	return <MissingSavedRecord key={`${kind}:${id}`} kind={kind} id={id} />;
}
