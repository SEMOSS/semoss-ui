import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** Fail before submitting a run when the server cannot enforce local draft review. */
export async function requireDraftReviewSupport(
	actions: InsightActions,
): Promise<void> {
	try {
		await callPixel(
			actions,
			pixel("GetWorkDraftCapabilities", {}),
			z.object({ draftReviewVersion: z.literal(1) }),
		);
	} catch (cause) {
		throw new Error(
			"The server needs the email draft review update before this assistant can run. Your draft has not been saved.",
			{ cause },
		);
	}
}
