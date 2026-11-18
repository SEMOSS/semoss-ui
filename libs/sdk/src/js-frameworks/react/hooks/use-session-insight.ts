import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { SessionInsightStore } from "../../../stores/session/session-insight.store";
import { useSessionStore } from "./use-session";

/**
 * Use the session's own insight, for work that belongs to no workspace but
 * must share one insight, such as a pixel that makes a file and the download
 * of that file. Most pixels need none: use `usePixel` or `runPixel` with no
 * insight id. The insight is made on first use, not when the view mounts.
 *
 * @returns The insight's id, empty until one is made, and its actions, which
 * never change between renders.
 *
 * @example
 * ```tsx
 * const { run, download } = useSessionInsight();
 * const handleExport = async () => {
 *     const { pixelReturn } = await run("META | ExportFile();");
 *     await download(String(pixelReturn[0]?.output));
 * };
 * ```
 */
export const useSessionInsight = (): Pick<
	SessionInsightStore,
	"run" | "runAsync" | "upload" | "download" | "withInsight" | "ensure"
> & {
	/** The insight's id, empty until one is made. */
	insightId: string;
} => {
	const { insight } = useSessionStore();
	const insightId = useStoreSelector(
		insight,
		(snapshot) => snapshot.insightId,
	);

	return {
		insightId: insightId,
		run: insight.run,
		runAsync: insight.runAsync,
		upload: insight.upload,
		download: insight.download,
		withInsight: insight.withInsight,
		ensure: insight.ensure,
	};
};
