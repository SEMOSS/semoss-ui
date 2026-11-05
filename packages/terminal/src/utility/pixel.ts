import type { useInsight } from "@semoss/sdk/react";
import type { PixelReturn } from "../types";

type InsightActions = ReturnType<typeof useInsight>["actions"];

interface PixelRunReturn {
	pixelReturn: Array<PixelReturn>;
}

/**
 * Execute a pixel command via the Insight store. Mirrors the legacy
 * `insightCtrl.execute([...])` / `insightCtrl.meta([...])` calls but uses
 * a flat pixel string instead of the AngularJS pixel component objects.
 */
export const runPixel = async <O = unknown>(
	actions: InsightActions,
	pixel: string,
): Promise<PixelReturn<O> | null> => {
	try {
		const response = (await (actions as InsightActions).run(pixel)) as
			| PixelRunReturn
			| undefined;

		if (!response || !response.pixelReturn || !response.pixelReturn[0]) {
			return null;
		}

		return response.pixelReturn[0] as PixelReturn<O>;
	} catch (e) {
		console.error("[terminal] pixel error", e);
		return null;
	}
};

/**
 * Wrap a string of pixel code with the encode delimiters used by the legacy
 * terminal for shipping multi-line scripts inside R/Py/Command calls.
 */
export const wrapEncoded = (
	fn: "R" | "Py" | "Command",
	content: string,
): string => {
	if (fn === "Command") {
		const cleaned = content.trim().replace(/"/g, '\\"');
		return `Command("${cleaned}");`;
	}
	return `${fn}("<encode>${content.trim()}</encode>");`;
};
