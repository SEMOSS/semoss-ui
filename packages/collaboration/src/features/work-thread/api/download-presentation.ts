import { download } from "@semoss/sdk";
import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** Download a tool result through the same room-bound insight used by its viewer. */
export async function downloadPresentation(
	actions: InsightActions,
	insightId: string,
	path: string,
): Promise<void> {
	const key = await callPixel(
		actions,
		pixel("DownloadInsightAsset", { filePath: path }),
		z.string().min(1),
	);
	await download(insightId, key);
}
