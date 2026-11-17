import { useCallback, useEffect, useRef, useState } from "react";
import { listVectorDocuments, type VectorDocument } from "@semoss/sdk";
import { useSessionInsight } from "@semoss/sdk/react";
import type { KnowledgeReadStatus } from "@/features/knowledge/use-knowledge-sources";

/** What {@link useKnowledgeDocuments} returns. */
export interface KnowledgeDocumentsState {
	/** The documents last read. */
	documents: readonly VectorDocument[];
	/** Where the read stands. */
	status: KnowledgeReadStatus;
	/** Reads the documents again, as after embedding more. */
	refresh: () => void;
}

/**
 * Reads the documents embedded in a knowledge source, in the session's
 * insight.
 *
 * @param engineId - The knowledge source.
 * @returns Its documents, where the read stands, and how to read them again.
 */
export const useKnowledgeDocuments = (
	engineId: string,
): KnowledgeDocumentsState => {
	const { withInsight } = useSessionInsight();
	const [documents, setDocuments] = useState<readonly VectorDocument[]>([]);
	const [status, setStatus] = useState<KnowledgeReadStatus>("LOADING");
	// counts reads, so one that a newer read or an unmount replaced is dropped
	const requestRef = useRef(0);

	const load = useCallback(() => {
		const request = ++requestRef.current;
		setStatus("LOADING");
		withInsight((insightId) => listVectorDocuments(insightId, engineId))
			.then((next) => {
				if (request !== requestRef.current) return;
				setDocuments(next);
				setStatus("READY");
			})
			.catch(() => {
				if (request === requestRef.current) setStatus("ERROR");
			});
	}, [withInsight, engineId]);

	useEffect(() => {
		load();
		return () => {
			requestRef.current++;
		};
	}, [load]);

	return { documents: documents, status: status, refresh: load };
};
