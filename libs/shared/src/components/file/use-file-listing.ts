import { useCallback, useEffect, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import type { FileItem } from "./file.types";
import type { FileExplorerAdapter } from "./file-explorer.adapters";
import type { FileExplorerStatus } from "./file-explorer.types";
import type { FileSource } from "./file-source";

/** What to list, for {@link useFileListing}. */
export interface FileListingOptions {
	/** The asset tree's Pixels, used when there is no `source`. */
	adapter: FileExplorerAdapter;
	/** A host's own source, used in place of the adapter's Pixels. */
	source?: FileSource | null;
	/** The insight the adapter's Pixels run in. */
	insightId?: string;
	/** The directory to list, or the search's folder. */
	path: string;
	/** A search term; empty lists `path`. Used only when the tree can search. */
	term?: string;
	/** Search everything rather than under `path`. */
	isSearchAll?: boolean;
	/** False waits at `INITIAL` without asking for anything. */
	enabled: boolean;
}

/** One listing's state, shaped like `usePixel`'s. */
export interface FileListing {
	status: FileExplorerStatus;
	/** The entries; empty until the listing lands. */
	items: FileItem[];
	error?: Error;
	/** List again. Its identity is stable. */
	refresh: () => void;
}

/** The state a source's listing keeps. */
interface SourceListingState {
	status: FileExplorerStatus;
	items: FileItem[];
	error?: Error;
}

const NO_ITEMS: FileItem[] = [];
const INITIAL_STATE: SourceListingState = {
	status: "INITIAL",
	items: NO_ITEMS,
};

/**
 * List one directory, or search under it, from an asset tree's Pixels or a
 * host's own source. The Pixel path is `usePixel` as it has always been; a
 * source is asked directly. Either way the entries reset to empty while a new
 * listing loads, as `usePixel` does, and a listing that lands after a newer
 * one started is dropped.
 *
 * @param options - What to list.
 * @returns The listing.
 */
export const useFileListing = (options: FileListingOptions): FileListing => {
	const { adapter, source, insightId, path, term, isSearchAll, enabled } =
		options;
	const isSearching = Boolean(
		term &&
			(source ? source.capabilities.search : adapter.capabilities.search),
	);
	const listedPath = isSearching && isSearchAll ? "" : path;

	// an empty pixel keeps usePixel at INITIAL
	const pixel =
		source || !enabled
			? ""
			: isSearching
				? adapter.search(listedPath, term ?? "")
				: adapter.browse(path);
	const pixelListing = usePixel<unknown[]>(pixel, { data: [] }, insightId);
	const pixelItems = useMemo(
		() => adapter.mapEntries(pixelListing.data, listedPath),
		[adapter, pixelListing.data, listedPath],
	);

	const [sourceState, setSourceState] =
		useState<SourceListingState>(INITIAL_STATE);
	const [sourceCount, setSourceCount] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies(sourceCount): a bump lists again
	useEffect(() => {
		if (!source || !enabled) {
			setSourceState(INITIAL_STATE);
			return;
		}

		let isCancelled = false;
		setSourceState({ status: "LOADING", items: NO_ITEMS });
		const request =
			isSearching && source.search
				? source.search(listedPath, term ?? "")
				: source.list(path);
		request.then(
			(items) => {
				if (!isCancelled) {
					setSourceState({ status: "SUCCESS", items: items });
				}
			},
			(error: unknown) => {
				if (!isCancelled) {
					setSourceState({
						status: "ERROR",
						items: NO_ITEMS,
						error:
							error instanceof Error
								? error
								: new Error(String(error)),
					});
				}
			},
		);

		return () => {
			isCancelled = true;
		};
	}, [enabled, isSearching, listedPath, path, source, sourceCount, term]);

	const refreshSource = useCallback(() => {
		setSourceCount((previous) => previous + 1);
	}, []);

	if (source) {
		return {
			status: sourceState.status,
			items: sourceState.items,
			error: sourceState.error,
			refresh: refreshSource,
		};
	}

	return {
		status: pixelListing.status,
		items: pixelItems,
		error: pixelListing.error,
		refresh: pixelListing.refresh,
	};
};
