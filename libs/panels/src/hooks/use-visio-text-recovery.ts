import { useCallback, useEffect, useState } from "react";
import type { ViewerHandle } from "visio-react-viewer";

/** A refused text draft retained until corrected, dismissed or the file changes. */
export interface VisioTextEditFailure {
	pageId: string;
	shapeId: string;
	text: string;
	message: string;
}

interface VisioTextRecovery {
	failures: readonly VisioTextEditFailure[];
	dismiss: (failure: VisioTextEditFailure) => void;
}

/** Retains refused drafts from the patched viewer without accepting unsafe edits. */
export const useVisioTextRecovery = (
	element: ViewerHandle["element"] | null,
	sourceKey: string,
): VisioTextRecovery => {
	const [recovery, setRecovery] = useState<{
		sourceKey: string;
		failures: VisioTextEditFailure[];
	}>({ sourceKey, failures: [] });
	useEffect(() => {
		// A refresh can dispose the old native viewer before its ref update
		// reaches this render. Its controller getters are no longer readable.
		if (!element?.isConnected) return;
		let generation = element.controller.sourceGeneration;
		const resetSource = () => {
			if (!element.isConnected) return;
			if (generation === element.controller.sourceGeneration) return;
			const hadSource = generation > 0;
			generation = element.controller.sourceGeneration;
			// An Activity reveal mounts the same file again. Keep its recovery
			// drafts; an actual replacement of an already loaded file clears them.
			if (hadSource) setRecovery({ sourceKey, failures: [] });
		};
		const handleTextEdit = (event: Event) => {
			if (!element.isConnected || !(event instanceof CustomEvent)) return;
			const detail: unknown = event.detail;
			if (
				typeof detail !== "object" ||
				detail === null ||
				!("sourceGeneration" in detail) ||
				detail.sourceGeneration !==
					element.controller.sourceGeneration ||
				!("pageId" in detail) ||
				typeof detail.pageId !== "string" ||
				!("shapeId" in detail) ||
				typeof detail.shapeId !== "string" ||
				!("text" in detail) ||
				typeof detail.text !== "string" ||
				!("status" in detail) ||
				(detail.status !== "applied" && detail.status !== "rejected")
			)
				return;
			const { pageId, shapeId, text, status } = detail;
			if (
				status === "rejected" &&
				(!("message" in detail) || typeof detail.message !== "string")
			)
				return;
			const message =
				"message" in detail && typeof detail.message === "string"
					? detail.message
					: "";
			resetSource();
			setRecovery((previous) => {
				const failures =
					previous.sourceKey === sourceKey ? previous.failures : [];
				const remaining = failures.filter(
					(failure) =>
						failure.pageId !== pageId ||
						failure.shapeId !== shapeId,
				);
				return {
					sourceKey,
					failures:
						status === "applied"
							? remaining
							: [
									...remaining,
									{ pageId, shapeId, text, message },
								],
				};
			});
		};
		element.addEventListener("visio-text-edit", handleTextEdit);
		element.addEventListener("document-change", resetSource);
		element.addEventListener("document-load", resetSource);
		return () => {
			element.removeEventListener("visio-text-edit", handleTextEdit);
			element.removeEventListener("document-change", resetSource);
			element.removeEventListener("document-load", resetSource);
		};
	}, [element, sourceKey]);
	const dismiss = useCallback((failure: VisioTextEditFailure) => {
		setRecovery((previous) => ({
			...previous,
			failures: previous.failures.filter((entry) => entry !== failure),
		}));
	}, []);
	return {
		failures: recovery.sourceKey === sourceKey ? recovery.failures : [],
		dismiss,
	};
};
