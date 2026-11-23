import type { Worker, WorkerOptions } from "node:worker_threads";
import type { LocalFolderSearchResult } from "../../../contract/local-folders";

/** What one search worker is handed. */
export interface FolderSearchJob {
	/** The attached folder's path. */
	root: string;
	/** Where to search from, inside it. */
	start: string;
	term: string;
	limit: number;
	/** How long it may walk before it returns what it has, in ms. */
	timeBudgetMs: number;
}

/** What a search worker posts back. */
export type FolderSearchReply =
	| { ok: true; result: LocalFolderSearchResult }
	| { ok: false; message: string };

/** The searches running, one per attached folder at most. */
export interface FolderSearches {
	/**
	 * Search a folder in a worker of its own. A newer search under the same
	 * key stops the one before, whose promise then rejects.
	 *
	 * @param key - The folder, such as its partition, room, and id.
	 * @param job - What to search.
	 * @returns The matches.
	 */
	search(key: string, job: FolderSearchJob): Promise<LocalFolderSearchResult>;
}

/** How long past its budget a search may run before it is stopped, in ms. */
const GRACE_MS = 2_000;

/**
 * The folder searches, each in a `worker_threads` worker so the main process
 * keeps answering the window while a large folder is walked.
 *
 * @param startWorker - Starts a worker over `search-folder.worker.ts`.
 * @returns The searches.
 */
export const createFolderSearches = (
	startWorker: (options: WorkerOptions) => Worker,
): FolderSearches => {
	const running = new Map<string, Worker>();

	return {
		search: (key, job) =>
			new Promise((resolve, reject) => {
				// the page only wants the newest answer for a folder
				void running.get(key)?.terminate();
				const worker = startWorker({ workerData: job });
				running.set(key, worker);
				let isSettled = false;
				const settle = (finish: () => void) => {
					if (isSettled) return;
					isSettled = true;
					clearTimeout(backstop);
					if (running.get(key) === worker) running.delete(key);
					finish();
				};
				// the walk returns at its budget; this is for one that cannot
				const backstop = setTimeout(
					() => void worker.terminate(),
					job.timeBudgetMs + GRACE_MS,
				);

				worker.once("message", (reply: FolderSearchReply) => {
					settle(() =>
						reply.ok
							? resolve(reply.result)
							: reject(new Error(reply.message)),
					);
					void worker.terminate();
				});
				worker.once("error", (error) => settle(() => reject(error)));
				worker.once("exit", () =>
					settle(() => reject(new Error("The search was stopped"))),
				);
			}),
	};
};
