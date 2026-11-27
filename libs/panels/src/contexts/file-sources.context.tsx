import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { FileExplorerRoot, FileSource } from "@semoss/shared";
import type { FilePanelMode } from "../types/file-panel.types";

/** What a host lists beside an explorer panel's own tree. */
export interface FileSources {
	/** The row over the panel's own tree once there are other roots. */
	primaryLabel: string;
	/**
	 * Which explorer panels list the host's roots under their own tree;
	 * others show only their own.
	 *
	 * @param mode - The explorer panel's scope.
	 * @returns True to show the roots there.
	 */
	isShownIn: (mode: FilePanelMode) => boolean;
	/** What a panel says when its mount is not here, such as a folder attached on another machine. */
	missingMountMessage: string;
}

/** A host's mount, as a file panel opened from it reads it. */
export interface FileMount {
	id: string;
	name: string;
	source: FileSource;
}

/** Add, replace, or remove a root, by its id. */
type RegisterRoot = (id: string, root: FileExplorerRoot | null) => void;

const FileSourcesContext = createContext<FileSources | null>(null);
const FileRootsContext = createContext<readonly FileExplorerRoot[]>([]);
const RegisterRootContext = createContext<RegisterRoot | null>(null);

/** Props for {@link FileSourcesProvider}. */
export interface FileSourcesProviderProps {
	/** Keep its identity stable, or every explorer rerenders. */
	sources: FileSources;
	/**
	 * The dock, and the host's components that add roots with
	 * `useFileExplorerRoot`.
	 */
	children: ReactNode;
}

/**
 * Give the file panels below it the host's roots: the explorers its
 * components add with `useFileExplorerRoot`, such as one per folder on the
 * user's machine.
 *
 * The roots are React state, not a store: each is an explorer api and the
 * host's buttons, built by a component and alive only while it is mounted.
 * Registering reads from a context of its own, so a component that adds a
 * root does not rerender when the list changes.
 */
export const FileSourcesProvider = ({
	sources,
	children,
}: FileSourcesProviderProps) => {
	const [roots, setRoots] = useState<readonly FileExplorerRoot[]>([]);
	const register = useCallback<RegisterRoot>((id, root) => {
		setRoots((previous) => {
			const index = previous.findIndex((other) => other.id === id);
			if (!root) {
				return index === -1
					? previous
					: previous.filter((other) => other.id !== id);
			}
			if (index === -1) {
				return [...previous, root];
			}
			if (previous[index] === root) {
				return previous;
			}
			return previous.map((other, position) =>
				position === index ? root : other,
			);
		});
	}, []);

	return (
		<FileSourcesContext.Provider value={sources}>
			<RegisterRootContext.Provider value={register}>
				<FileRootsContext.Provider value={roots}>
					{children}
				</FileRootsContext.Provider>
			</RegisterRootContext.Provider>
		</FileSourcesContext.Provider>
	);
};

/**
 * The nearest host's sources.
 *
 * @returns Them, or null when there is no host.
 */
export const useFileSources = (): FileSources | null =>
	useContext(FileSourcesContext);

/**
 * The roots the host's components added, in the order they were added.
 *
 * @returns The roots; none without a host.
 */
export const useFileExplorerRoots = (): readonly FileExplorerRoot[] =>
	useContext(FileRootsContext);

/**
 * List an explorer beside the Files panel's own tree for as long as the
 * calling component is mounted. Call it with the root every render: its
 * explorer's state, and the host's buttons, reach the panel that way.
 *
 * @param root - The explorer, from a per-mode hook such as
 * `useSourceFileExplorer`, and its row.
 */
export const useFileExplorerRoot = (root: FileExplorerRoot): void => {
	const register = useContext(RegisterRootContext);
	const { id } = root;

	// every render: the row's buttons and the tree's state are new each time
	useEffect(() => {
		register?.(id, root);
	});
	useEffect(() => () => register?.(id, null), [id, register]);
};

/**
 * The mount a panel's mode names.
 *
 * @param mode - The panel's scope.
 * @returns The mount, or null for another scope or a mount that is not here.
 */
export const useFileMount = (mode: FilePanelMode): FileMount | null => {
	const roots = useFileExplorerRoots();
	const mountId = mode.type === "MOUNT" ? mode.mountId : null;

	return useMemo(() => {
		if (!mountId) {
			return null;
		}
		for (const root of roots) {
			const { mode: rootMode, source } = root.explorer;
			if (
				rootMode.type === "MOUNT" &&
				rootMode.mountId === mountId &&
				source
			) {
				return { id: root.id, name: root.name, source: source };
			}
		}
		return null;
	}, [mountId, roots]);
};
