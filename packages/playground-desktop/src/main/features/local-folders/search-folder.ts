import type { Dirent } from "node:fs";
import { readdir, realpath, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
	type LocalFileEntry,
	type LocalFolderSearchResult,
	MAX_FOLDER_SEARCH_RESULTS,
} from "../../../contract/local-folders";
import { isHiddenName, resolveInsideFolder, toEntry } from "./local-fs";

/** How long one search may walk before it returns what it has, in ms. */
export const SEARCH_TIME_BUDGET_MS = 10_000;

/** How a {@link searchFolder} walk is bounded. */
export interface SearchFolderOptions {
	/** The most matches to return; {@link MAX_FOLDER_SEARCH_RESULTS} by default. */
	limit?: number;
	/** When to stop and return what was found, as `Date.now()` reads it. */
	deadline?: number;
	/** Stops the walk; it then returns what it found. */
	signal?: AbortSignal;
}

/**
 * Comparable text for a name match: any Unicode form, any case.
 *
 * @param text - A name or a search term.
 * @returns It, normalized.
 */
const toComparable = (text: string): string =>
	text.normalize("NFC").toLowerCase();

/**
 * Find the files and folders under one in an attached folder whose names
 * contain a term, at any depth. It finds what the folder's listing shows,
 * so hidden entries are skipped, and it does not follow links to folders,
 * which could lead in a circle or out of the folder; a link still matches by
 * its own name. It walks a level at a time, so the nearest matches come
 * first.
 *
 * @param root - The attached folder's path.
 * @param start - Where to search from, inside it; empty or `/` for all of it.
 * @param term - What names must contain; no matches for an empty term.
 * @param options - The limit, the time budget, and a stop signal.
 * @returns The matches, as the listing has them, and whether some were left
 * out.
 * @throws Error for a start outside the folder, as the listing does.
 */
export const searchFolder = async (
	root: string,
	start: string,
	term: string,
	options: SearchFolderOptions = {},
): Promise<LocalFolderSearchResult> => {
	const { limit = MAX_FOLDER_SEARCH_RESULTS, deadline, signal } = options;
	const rootReal = await realpath(root);
	const from = await resolveInsideFolder(root, start || "/");
	const needle = toComparable(term.trim());
	if (!needle) {
		return { entries: [], isTruncated: false };
	}

	const entries: LocalFileEntry[] = [];
	const queue = [from];
	while (queue.length > 0) {
		if (
			signal?.aborted ||
			(deadline !== undefined && Date.now() > deadline)
		) {
			return { entries: entries, isTruncated: true };
		}
		const directory = queue.shift() as string;
		let dirents: Dirent[];
		try {
			dirents = await readdir(directory, { withFileTypes: true });
		} catch {
			// a folder that cannot be read is left out, as the listing does
			continue;
		}
		for (const dirent of dirents) {
			if (isHiddenName(dirent.name)) continue;
			const target = resolve(directory, dirent.name);
			// a link is not a directory here, so it is never walked into
			if (dirent.isDirectory()) {
				queue.push(target);
			}
			if (!toComparable(dirent.name).includes(needle)) continue;
			try {
				entries.push(toEntry(rootReal, target, await stat(target)));
			} catch {
				// a broken link, or one that cannot be read: leave it out
				continue;
			}
			if (entries.length >= limit) {
				return { entries: entries, isTruncated: true };
			}
		}
	}
	return { entries: entries, isTruncated: false };
};
