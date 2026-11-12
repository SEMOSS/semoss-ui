import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

export type TopicLifecycleChange =
	| { type: "status"; status: "active" | "hibernated" | "archived" }
	| { type: "delete" };

const savedStatus = z.object({
	id: z.string().min(1),
	status: z.enum(["active", "hibernated", "archived"]),
});
const deletedTopic = z.object({
	topicId: z.string().min(1),
	deleted: z.literal(true),
	canUndo: z.literal(false),
});

/** Performs an owner lifecycle action and validates confirmation before changing the local session. */
export async function changeTopicLifecycle(
	actions: InsightActions,
	topicId: string,
	change: TopicLifecycleChange,
): Promise<void> {
	if (change.type === "delete") {
		const result = await callPixel(
			actions,
			pixel("BrainDeleteTopic", { topicId }),
			deletedTopic,
		);
		if (result.topicId !== topicId)
			throw new Error("The server confirmed a different topic deletion.");
		return;
	}
	const result = await callPixel(
		actions,
		pixel("BrainSetTopicStatus", { topicId, status: change.status }),
		savedStatus,
	);
	if (result.id !== topicId || result.status !== change.status) {
		throw new Error(
			"The server did not confirm the requested topic status.",
		);
	}
}
