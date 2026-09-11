import { useCallback, useEffect, useRef, useState } from "react";
import type { FilePanelApi } from "./use-file-panel";

interface UseFileBufferOptions {
	/** The shared machinery this buffer edits through. */
	panel: FilePanelApi;
	/** The file's name, for the tab title. */
	name: string;
	/** Panel-provided rename, used for the dirty marker. */
	rename: (name: string) => void;
	/**
	 * What to save, given the buffer's current text. The notebook serializes
	 * from its own editor handle instead in notebook view. Defaults to the
	 * buffer's text unchanged.
	 */
	getContent?: (bufferContent: string) => string;
	/**
	 * Treat an empty result from `getContent` as "not ready" and skip the
	 * save. Only for a buffer whose content is serialized from somewhere else
	 * — an empty *text* file is a legitimate thing to save.
	 */
	skipEmptySave?: boolean;
	/** Called after a load re-seeds the buffer, e.g. to bump a remount key. */
	onLoaded?: (content: string) => void;
}

/** An editable working copy of a file, and its dirty state. */
export interface FileBuffer {
	content: string;
	/** Write the working copy. Updates the tab's dirty marker as a side effect. */
	setContent: (content: string) => void;
	/** The live buffer, for callbacks that must not close over a stale render. */
	contentRef: { current: string };
	isDirty: boolean;
	/**
	 * Re-derive the tab's dirty marker for a value held somewhere else, without
	 * writing the buffer. For an editor that owns its own content (the
	 * notebook) and only needs the marker.
	 */
	markDirty: (content: string) => void;
	/** Save, then re-baseline and clear the dirty marker. */
	save: () => Promise<void>;
}

/**
 * The editable half of a text-backed file panel: the working copy, the
 * baseline it is diffed against, and the tab's dirty marker.
 *
 * The marker is a trailing `*` on the panel name, and that is load-bearing
 * beyond this file — `useWorkbenchFilePanels` preserves it across a rename by
 * inspecting `record.name.endsWith("*")`. Expressing dirtiness any other way
 * would silently drop the only unsaved-work signal when a file is renamed.
 *
 * @param options - The panel machinery, the file name, and optional overrides.
 * @return The working copy and its save.
 */
export const useFileBuffer = ({
	panel,
	name,
	rename,
	getContent,
	skipEmptySave = false,
	onLoaded,
}: UseFileBufferOptions): FileBuffer => {
	const [content, setContentState] = useState("");
	const baselineRef = useRef("");
	const contentRef = useRef("");
	const appliedRevisionRef = useRef(0);
	const { data, status, revision } = panel.read;

	contentRef.current = content;

	useEffect(() => {
		if (status !== "SUCCESS" || appliedRevisionRef.current === revision) {
			return;
		}
		appliedRevisionRef.current = revision;
		baselineRef.current = data;
		contentRef.current = data;
		setContentState(data);
		rename(name);
		onLoaded?.(data);
	}, [data, status, revision, name, rename, onLoaded]);

	/**
	 * Write the working copy and re-derive the dirty marker.
	 *
	 * The marker lives here rather than at the call site because the baseline
	 * it is compared against is private to this hook — a panel deriving it
	 * itself would be guessing.
	 */
	const markDirty = useCallback(
		(next: string) => {
			rename(next === baselineRef.current ? name : `${name}*`);
		},
		[name, rename],
	);

	const setContent = useCallback(
		(next: string) => {
			contentRef.current = next;
			setContentState(next);
			markDirty(next);
		},
		[markDirty],
	);

	const save = useCallback(async () => {
		const next = getContent
			? getContent(contentRef.current)
			: contentRef.current;
		if (skipEmptySave && !next) return;
		if (await panel.save(next)) {
			baselineRef.current = next;
			rename(name);
		}
	}, [getContent, name, panel, rename, skipEmptySave]);

	return {
		content,
		setContent,
		contentRef,
		isDirty: content !== baselineRef.current,
		markDirty,
		save,
	};
};
