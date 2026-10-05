import { useWorkbenchEvent } from "@semoss/workbench";
import {
	FILE_PANEL_EVENTS,
	type FilesChangedEvent,
} from "../constants/file-panel.constants";
import type { FilePanelMode } from "../types/file-panel.types";
import { getFilePanelScope } from "../types/file-panel.types";

interface UseFilesChangedOptions {
	/** The scope this panel is showing. */
	mode: FilePanelMode;
	/**
	 * The one file this panel shows, if it shows one. An explorer omits it and
	 * takes every change in its scope.
	 */
	path?: string;
	/**
	 * Hold the refresh back. An editor passes its dirty flag: re-reading
	 * re-seeds the buffer from the server, so refreshing under unsaved edits
	 * would silently throw them away.
	 */
	skip?: boolean;
	/** Called when this panel's content is out of date. */
	refresh: () => void;
}

/**
 * Re-read when someone else changes the files this panel is showing.
 *
 * Panels used to find out by accident, or not at all: a branch switch or an
 * agent's edit would leave an editor showing content that is no longer on
 * disk, and the explorer showing a tree that no longer exists.
 *
 * Only for panels inside a dock — it subscribes to the workbench's event bus,
 * so the legacy app-workspace editor, which renders outside one, must not call
 * it.
 *
 * @param options - What this panel shows, and how to re-read it.
 */
export const useFilesChanged = ({
	mode,
	path,
	skip,
	refresh,
}: UseFilesChangedOptions): void => {
	const scope = getFilePanelScope(mode);

	useWorkbenchEvent<FilesChangedEvent>(
		FILE_PANEL_EVENTS.FILES_CHANGED,
		(changed) => {
			if (changed.scope !== scope || skip) {
				return;
			}
			// No paths means the producer could not enumerate them — a branch
			// switch rewrites everything — so take it as "you are stale".
			if (path && changed.paths && !changed.paths.includes(path)) {
				return;
			}
			refresh();
		},
	);
};
