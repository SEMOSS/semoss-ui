import type { FileMode } from "@semoss/shared";
import { getFileEditorPathScope } from "@semoss/shared";
import type { ResourceType } from "../access";

/**
 * The scopes a file panel can be opened for.
 *
 * The shared `FileMode` with two narrowings:
 *
 * - **INSIGHT's `insightId` is required.** It is optional on `FileMode`, and
 *   an id-less one would make a panel's path-event scope differ from its
 *   explorer's — renames would silently stop reaching open editors, with no
 *   error anywhere. A panel config always knows its insight.
 * - **No STORAGE.** Buckets have no read or save reactors, which is why the
 *   storage explorer opens a file by pulling it into a new insight and opening
 *   an INSIGHT-scoped panel instead.
 */
export type FilePanelMode =
	| Extract<FileMode, { type: "APP" } | { type: "ENGINE" } | { type: "USER" }>
	| { type: "INSIGHT"; insightId: string };

/** The resource a mode's permissions are resolved against. */
export interface FilePanelResource {
	type: ResourceType;
	id: string;
}

/**
 * The resource to check access for.
 *
 * `useAccess` speaks the session's `ENGINE | PROJECT | INSIGHT` vocabulary,
 * so this is the one remaining translation — down from two, the other being a
 * hand-written inverse that silently returned `false` for any mode it had not
 * been taught.
 *
 * @param mode - The panel's scope.
 * @return The resource to resolve a permission for, or null when the scope has
 * no resource of its own (a user's own files).
 */
export const getFilePanelResource = (
	mode: FilePanelMode,
): FilePanelResource | null => {
	switch (mode.type) {
		case "APP":
			return { type: "PROJECT", id: mode.app };
		case "ENGINE":
			return { type: "ENGINE", id: mode.engine };
		case "INSIGHT":
			return { type: "INSIGHT", id: mode.insightId };
		default:
			return null;
	}
};

/**
 * The path-event scope for a mode.
 *
 * Both an explorer and the editors it opens must derive the same string, or
 * a rename stops reaching them. One function so they cannot drift.
 *
 * @param mode - The panel's scope.
 * @return The scope key `notifyFileEditorPathMoved` broadcasts on.
 */
export const getFilePanelScope = (mode: FilePanelMode): string =>
	getFileEditorPathScope(
		mode,
		mode.type === "INSIGHT" ? mode.insightId : undefined,
	);

/** Whether two modes name the same resource. */
export const sameFileMode = (a: FileMode, b: FileMode): boolean => {
	if (a.type !== b.type) return false;
	switch (a.type) {
		case "APP":
			return a.app === (b as typeof a).app;
		case "ENGINE":
			return a.engine === (b as typeof a).engine;
		case "STORAGE":
			return a.storage === (b as typeof a).storage;
		case "INSIGHT":
			return a.insightId === (b as typeof a).insightId;
		default:
			return true;
	}
};

/**
 * Whether two file panel configs name the same open file.
 *
 * The blueprint `matches` for every file panel. Never dereference `a.mode.type`
 * directly in one of those — `matches` runs inside `selectPanel`, a store
 * action outside any error boundary, so a config it cannot read must return
 * false rather than throw.
 */
export const matchesFilePanel = (
	a: { mode?: FilePanelMode; path?: string },
	b: { mode?: FilePanelMode; path?: string },
): boolean =>
	Boolean(a.mode) &&
	Boolean(b.mode) &&
	sameFileMode(a.mode as FilePanelMode, b.mode as FilePanelMode) &&
	a.path === b.path;
