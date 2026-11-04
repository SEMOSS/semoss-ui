import type { ViewerController, VisioViewerProps } from "visio-react-viewer";

/** The full ribbon owns drawing tools that the public controller cannot drive. */
export const VISIO_VIEWER_POLICY = {
	showToolbar: true,
	collaboration: null,
} satisfies Pick<VisioViewerProps, "showToolbar" | "collaboration">;

type VisioSnapshotSource = Pick<
	ViewerController,
	"documentGeneration" | "state"
>;

/** An immutable document identity, including replacement by the same model. */
export interface VisioSaveSnapshot {
	document: ViewerController["state"]["document"];
	generation: number;
}

/** Capture the exact source-backed document being exported for host persistence. */
export const getVisioSaveSnapshot = (
	controller: VisioSnapshotSource,
): VisioSaveSnapshot => ({
	document: controller.state.document,
	generation: controller.documentGeneration,
});

/** Later edits, undo/redo and replacement must never be acknowledged by an older save. */
export const isVisioSaveSnapshotCurrent = (
	controller: VisioSnapshotSource,
	snapshot: VisioSaveSnapshot,
): boolean =>
	controller.documentGeneration === snapshot.generation &&
	controller.state.document === snapshot.document;
