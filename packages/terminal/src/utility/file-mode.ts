import type { FileMode } from "../types";

/**
 * Stable key for a FileMode — used to dedupe file editor tabs by
 * `(scope, path)` so the same path opened twice against the same scope
 * refocuses the existing tab. Kept in a tiny utility module so the
 * terminal coordinator can compute tab ids without pulling in the heavy
 * file-editor chunk.
 */
export const modeKey = (m: FileMode): string => {
	if (m.type === "APP") return `APP:${m.app}`;
	if (m.type === "ENGINE") return `ENGINE:${m.engine}`;
	if (m.type === "STORAGE") return `STORAGE:${m.storage}`;
	if (m.type === "USER") return "USER";
	return `INSIGHT:${m.insightId ?? ""}`;
};
