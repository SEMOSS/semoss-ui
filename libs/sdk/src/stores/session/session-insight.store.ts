import { isRecord } from "@semoss/utility/object";
import { StoreState } from "@semoss/utility/store";
import { runPixel, runPixelAsync } from "../../api/base";
import { download, upload } from "../../api/file";
import { HttpError } from "../../utility/error";

/** No insight yet, and the shape of every snapshot. */
const NO_INSIGHT = {
	/** The insight's id, empty until one is made. */
	insightId: "",
};

/**
 * Whether a request failed because the backend no longer has its insight, as
 * after the session that held it ended.
 *
 * @param error - What the request threw.
 * @returns True for the backend's `INSIGHT_NOT_FOUND` answer.
 */
const isInsightNotFound = (error: unknown): boolean =>
	error instanceof HttpError &&
	isRecord(error.data) &&
	error.data.errorType === "INSIGHT_NOT_FOUND";

/**
 * Read the insight a request ran in from what it returned, as pixel results
 * and `getUserInfo` carry it.
 *
 * @param result - What the request returned.
 * @returns The insight id, or empty when it names none.
 */
const readInsightId = (result: unknown): string =>
	isRecord(result) && typeof result.insightId === "string"
		? result.insightId
		: "";

/**
 * The session's own insight, for work that belongs to no workspace, app or
 * room but must share one insight, such as a pixel that makes a file and the
 * download of that file. Most pixels need none: run them with `runPixel` or
 * `usePixel` and no insight id, and the backend makes a temporary one.
 *
 * It is not a workspace's `InsightStore`: it has no recipe, room or state
 * of its own, only an id that every call shares. It is made on first use and
 * kept, so the backend holds one insight per session; when the backend no
 * longer has it, a new one is made and the call runs once more. Its session
 * clears it whenever the user changes, as the backend drops the old
 * session's insights.
 *
 * @example
 * ```ts
 * const { pixelReturn } = await Session.insight.run("META | ExportFile();");
 * await Session.insight.download(String(pixelReturn[0]?.output));
 * ```
 */
export class SessionInsightStore {
	/**
	 * The insight, starting with none. Held privately so the store's public
	 * types do not depend on how it is kept.
	 */
	private readonly state = new StoreState(NO_INSIGHT);

	/**
	 * Read the current state. The same object until it changes, as
	 * `useSyncExternalStore` requires.
	 *
	 * @returns The current state.
	 */
	getSnapshot = (): typeof NO_INSIGHT => this.state.getSnapshot();

	/**
	 * Hear about every change to the state.
	 *
	 * @param listener - Called after each change; read the new state with
	 * `getSnapshot`.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The insight being made, joined by every caller. */
	private request: Promise<string> | null = null;

	/**
	 * Counts sessions: every clear adds one, and an insight made for the
	 * previous session when it lands is not kept.
	 */
	private version = 0;

	/**
	 * Run a pixel in the insight. Prefix it with `META |` unless it should be
	 * kept in the insight's recipe.
	 *
	 * @param pixel - The pixel to run.
	 * @returns The pixel's results, with any pixel errors in `errors`.
	 * @throws When the request fails.
	 */
	run = <O extends unknown[] | []>(pixel: string) =>
		this.withInsight((insightId) => runPixel<O>(pixel, insightId));

	/**
	 * Start a pixel in the insight without waiting for it.
	 *
	 * @param pixel - The pixel to run.
	 * @returns The job to read the result from.
	 * @throws When the request fails.
	 */
	runAsync = (pixel: string) =>
		// the job names no insight, so the insight is made first
		this.inInsight((insightId) => runPixelAsync(pixel, insightId));

	/**
	 * Upload files through the insight.
	 *
	 * @param files - What to upload.
	 * @param projectId - The project to upload into, or null for the insight.
	 * @param path - The folder to upload into. Defaults to the top.
	 * @returns Each uploaded file's name and location.
	 * @throws When the upload fails.
	 */
	upload = (
		files: File | File[],
		projectId: string | null = null,
		path = "",
	) =>
		// the backend refuses an upload without an existing insight
		this.inInsight((insightId) =>
			upload(files, insightId, projectId, path),
		);

	/**
	 * Download a file the insight made. The key belongs to the insight that
	 * made the file, so a pixel run through `run` must have made it.
	 *
	 * @param fileKey - The file's key, from the pixel that made it.
	 * @throws When there is no insight, so no file to download.
	 */
	download = (fileKey: string) =>
		download(this.getSnapshot().insightId, fileKey);

	/**
	 * Run any request in the insight, given the insight's id. When there is no
	 * insight yet, the request runs in `"new"` and the insight it ran in is
	 * kept, read from the `insightId` it returns, so the first call is one
	 * request. When the backend no longer has the insight, a new one is made
	 * and the request runs once more. A request that fails, or whose pixels
	 * fail, fails only its own caller: the insight is kept, or made for the
	 * callers that were waiting on it.
	 *
	 * @param task - The request, given the insight to run in.
	 * @returns What the request returns.
	 * @throws What the request throws.
	 */
	withInsight = <R>(task: (insightId: string) => Promise<R>): Promise<R> => {
		if (this.getSnapshot().insightId || this.request) {
			return this.inInsight(task);
		}

		// whoever needs the insight meanwhile joins this request; one that names
		// no insight, or fails, is followed by a no-op pixel that makes one, so
		// a failed call fails only its caller and never the calls that joined it
		const result = task("new");
		const request = this.make(() =>
			result.then(
				(value) => readInsightId(value) || this.makeEmpty(),
				() => this.makeEmpty(),
			),
		);

		// answer once the insight it ran in is kept, so the caller's next call,
		// such as a download, uses it
		return result.then((value) =>
			readInsightId(value)
				? request.then(
						() => value,
						() => value,
					)
				: value,
		);
	};

	/**
	 * Forget the insight, as when the user changes. An insight being made is
	 * not kept when it lands.
	 */
	clear = (): void => {
		this.version++;
		this.request = null;
		this.state.set(NO_INSIGHT);
	};

	/**
	 * Run a request in an existing insight, making one first when there is
	 * none, and running once more in a new one when the backend no longer has
	 * it.
	 *
	 * @param task - The request, given the insight to run in.
	 * @returns What the request returns.
	 * @throws What the request throws.
	 */
	private inInsight = async <R>(
		task: (insightId: string) => Promise<R>,
	): Promise<R> => {
		const insightId = await this.ensure();
		try {
			return await task(insightId);
		} catch (error) {
			if (!isInsightNotFound(error)) {
				throw error;
			}
			this.forget(insightId);
			return task(await this.ensure());
		}
	};

	/**
	 * The insight's id, made with a no-op pixel when there is none. Every
	 * caller shares one, so the backend holds a single insight per session.
	 * Call it before a long request that is watched by the insight's id, such
	 * as a pixel whose console is read while it runs, so that request does not
	 * have to make the insight itself.
	 *
	 * @returns The insight id.
	 * @throws When the insight cannot be made.
	 */
	ensure = (): Promise<string> => {
		const { insightId } = this.getSnapshot();
		if (insightId) {
			return Promise.resolve(insightId);
		}
		return this.request ?? this.make(this.makeEmpty);
	};

	/**
	 * Make the insight, sharing the request with every caller until it lands.
	 *
	 * @param create - Makes the insight and resolves to its id.
	 * @returns The insight id.
	 * @throws When the insight cannot be made.
	 */
	private make = (create: () => Promise<string>): Promise<string> => {
		const version = this.version;
		const request = create()
			.then((insightId) => {
				// an insight made for a session that has since ended is not kept
				if (version === this.version) {
					this.state.set({ insightId: insightId });
				}
				return insightId;
			})
			.finally(() => {
				if (this.request === request) {
					this.request = null;
				}
			});

		// a caller that joins hears about a failure; no one else needs to
		request.catch(() => undefined);
		this.request = request;
		return request;
	};

	/**
	 * Make an empty insight with a no-op pixel.
	 *
	 * @returns The insight id.
	 */
	private makeEmpty = (): Promise<string> =>
		runPixel("META | init", "new").then((result) => result.insightId);

	/**
	 * Stop using an insight the backend no longer has.
	 *
	 * @param insightId - The insight to forget.
	 */
	private forget = (insightId: string): void => {
		if (this.getSnapshot().insightId === insightId) {
			this.state.set(NO_INSIGHT);
		}
	};
}
