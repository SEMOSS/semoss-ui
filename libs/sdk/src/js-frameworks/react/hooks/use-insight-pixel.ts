import { useInsight } from "./use-insight";
import { type PixelConfig, usePixel } from "./use-pixel";

/**
 * Execute a single pixel statement only in the nearest InsightProvider.
 * Waits in INITIAL while its ID is empty and never falls back to the session.
 *
 * @param pixel - The pixel statement to run
 * @param config - Initial data and callbacks
 * @returns The request state and refresh/update actions
 * @throws When there is no InsightProvider
 */
export function useInsightPixel<D>(
	pixel: string,
	config?: Partial<PixelConfig<D>>,
): ReturnType<typeof usePixel<D>> {
	const { insightId } = useInsight();

	return usePixel(insightId ? pixel : "", config, insightId);
}
