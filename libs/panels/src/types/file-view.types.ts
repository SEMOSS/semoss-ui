import type { FilePanelParams, FilePanelValue } from "../hooks/use-file-panel";

/** One entry in a file view's view switch. */
export interface FileViewMode {
	value: string;
	label: string;
}

/**
 * What a file view publishes for whatever chrome its host draws.
 *
 * A view renders a file and nothing else: the refresh, save and view switch
 * that go with it are drawn by the host, because a workbench draws them in the
 * tab strip and the legacy FlexLayout workspace draws them in a toolbar of its
 * own. Both read this.
 *
 * `viewModes` is what decides whether the switch appears, so a view that has
 * one lists its modes and a view that doesn't simply omits them.
 *
 * It extends `FilePanelValue` because a workbench host publishes it verbatim as
 * the panel's scratch value, and other panels reach for `refresh` on that.
 */
export interface FileViewControls extends FilePanelValue {
	/** Whether the host may offer a save. */
	canSave: boolean;
	/** A read, save, download, or the view's own work is in flight. */
	isBusy: boolean;
	/**
	 * Unsaved edits. Hosts hold an external refresh back on this: re-reading
	 * re-seeds the buffer from the server, throwing those edits away.
	 */
	isDirty?: boolean;
	/** Omitted by a view with nothing to save. */
	save?: () => void;
	/**
	 * False when re-reading would do nothing: the download prompt fetches
	 * only once the user asks for the raw view.
	 */
	canRefresh?: boolean;
	/** The view switch's options. Omit for a view with a single view. */
	viewModes?: FileViewMode[];
	viewMode?: string;
	setViewMode?: (mode: string) => void;
}

/** The props every file view takes. */
export interface FileViewProps {
	/** The scope and file to show. */
	config: FilePanelParams;
	/**
	 * Rename the host's tab. Views with a buffer use it for the unsaved-work
	 * `*` marker, which is the only signal that a tab has edits in it.
	 */
	rename: (name: string) => void;
	/** Receive the view's chrome state. Must be identity-stable. */
	onControls?: (controls: FileViewControls) => void;
}
