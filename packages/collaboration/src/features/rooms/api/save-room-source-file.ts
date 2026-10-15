import { getFileExplorerAdapter } from "@semoss/shared";
import { z } from "@semoss/ui/next";
import { encodeTextToBase64 } from "@semoss/utility/encoding";
import { callPixel, type InsightActions } from "@/lib/pixel";

/** Overwrite the source asset without renaming files already attached to a room. */
export async function saveRoomSourceFile(
	actions: InsightActions,
	fileLocation: string,
	markdown: string,
): Promise<void> {
	await callPixel(
		actions,
		getFileExplorerAdapter({ type: "INSIGHT" }).save(
			fileLocation,
			encodeTextToBase64(markdown),
			true,
		),
		z.literal("Success!"),
	);
}
