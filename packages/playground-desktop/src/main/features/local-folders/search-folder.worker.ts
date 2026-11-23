import { parentPort, workerData } from "node:worker_threads";
import type { FolderSearchJob, FolderSearchReply } from "./folder-searches";
import { searchFolder } from "./search-folder";

// one search per worker, off the main process: walking a large folder never
// holds up the window's other calls
const job = workerData as FolderSearchJob;

/**
 * Hand the main process the outcome.
 *
 * @param reply - The matches, or why there are none.
 */
const reply = (reply: FolderSearchReply): void => {
	parentPort?.postMessage(reply);
};

searchFolder(job.root, job.start, job.term, {
	limit: job.limit,
	deadline: Date.now() + job.timeBudgetMs,
}).then(
	(result) => reply({ ok: true, result: result }),
	(error: unknown) =>
		reply({
			ok: false,
			message: error instanceof Error ? error.message : String(error),
		}),
);
