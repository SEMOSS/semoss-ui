import { createContext, type ReactNode, useContext } from "react";
import type { FileSource } from "@semoss/shared";
import type { FilePanelMode } from "../types/file-panel.types";

/**
 * One tree a host mounts beside the panel's own, such as a folder on the
 * user's machine. Its panels open with `{ type: "MOUNT", mountId: id }`.
 */
export interface FileMount {
	/** Unique among the host's mounts; part of every panel config opened from it. */
	id: string;
	/** What its section is called, such as the folder's name. */
	name: string;
	/** The {@link FileMountGroup} it is listed under. */
	group: string;
	/** Where its files are read and written. Keep its identity stable. */
	source: FileSource;
}

/** A heading the host's mounts are listed under, such as Desktop. */
export interface FileMountGroup {
	id: string;
	label: string;
	/** Buttons on the group's heading, such as Attach Folder. */
	actions?: ReactNode;
	/** Shown in place of the group's mounts when it has none; left out, the group hides. */
	emptyState?: ReactNode;
	/** Buttons on each mount's heading, such as Detach. */
	mountActions?: (mount: FileMount) => ReactNode;
}

/** What a host mounts beside the explorer panels below it. */
export interface FileSources {
	/** The heading over the panel's own tree once there are sections. */
	primaryLabel: string;
	/**
	 * Which explorer panels list the mounts under their own tree; others
	 * show only their own.
	 *
	 * @param mode - The explorer panel's scope.
	 * @returns True to show the sections there.
	 */
	isShownIn: (mode: FilePanelMode) => boolean;
	/** The headings, in order. */
	groups: readonly FileMountGroup[];
	/** Every mount, in order within its group. */
	mounts: readonly FileMount[];
	/** What a panel says when its mount is not here, such as a folder attached on another machine. */
	missingMountMessage: string;
}

const FileSourcesContext = createContext<FileSources | null>(null);

/** Props for {@link FileSourcesProvider}. */
export interface FileSourcesProviderProps {
	/** The host's mounts. Keep its identity stable, or every explorer rerenders. */
	sources: FileSources;
	children: ReactNode;
}

/** Give the file panels below it the host's mounted trees. */
export const FileSourcesProvider = ({
	sources,
	children,
}: FileSourcesProviderProps) => (
	<FileSourcesContext.Provider value={sources}>
		{children}
	</FileSourcesContext.Provider>
);

/**
 * The nearest host's mounted trees.
 *
 * @returns The host's mounts, or null when it has none.
 */
export const useFileSources = (): FileSources | null =>
	useContext(FileSourcesContext);

/**
 * The mount a panel's mode names.
 *
 * @param mode - The panel's scope.
 * @returns The mount, or null for another scope or a mount that is not here.
 */
export const useFileMount = (mode: FilePanelMode): FileMount | null => {
	const sources = useFileSources();
	if (mode.type !== "MOUNT") {
		return null;
	}

	return sources?.mounts.find((mount) => mount.id === mode.mountId) ?? null;
};
