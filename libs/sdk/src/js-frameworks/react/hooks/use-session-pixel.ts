import { useStoreSelector } from "../utility/store-selector";
import { type PixelConfig, usePixel } from "./use-pixel";
import { useSessionStore } from "./use-session";

/**
 * Execute a single pixel statement only in the session's existing insight.
 * Waits in INITIAL while its ID is empty; session initialization must supply it.
 * Ignores workspace context and never creates or recovers the session insight.
 *
 * @param pixel - The pixel statement to run
 * @param config - Initial data and callbacks
 * @returns The request state and refresh/update actions
 */
export function useSessionPixel<D>(
	pixel: string,
	config?: Partial<PixelConfig<D>>,
): ReturnType<typeof usePixel<D>> {
	const session = useSessionStore();
	const insightId = useStoreSelector(
		session.insight,
		(snapshot) => snapshot.insightId,
	);

	return usePixel(insightId ? pixel : "", config, insightId);
}
