import { z } from "@semoss/ui/next";
import { topicCluesSchema } from "./topic-clues";

/** The only structural proposal the assistant and direct controls can send. */
export const topicOrganizationGroupSchema = z
	.object({
		topicKeys: z.array(z.string().min(1).max(100)).min(1).max(100),
		targetKey: z.string().min(1).max(100),
		name: z.string().trim().min(1, "Name the combined topic").max(255),
		description: z.string().max(12000),
		terms: topicCluesSchema,
	})
	.superRefine((group, context) => {
		if (
			new Set(group.topicKeys).size !== group.topicKeys.length ||
			!group.topicKeys.includes(group.targetKey)
		) {
			context.addIssue({
				code: "custom",
				path: ["topicKeys"],
				message:
					"Choose distinct topics and retain one of their profiles",
			});
		}
	});

export const topicOrganizationGroupsSchema = z
	.array(topicOrganizationGroupSchema)
	.min(1)
	.max(100)
	.superRefine((groups, context) => {
		const keys = groups.flatMap((group) => group.topicKeys);
		if (keys.length > 100 || new Set(keys).size !== keys.length) {
			context.addIssue({
				code: "custom",
				message: "Each topic can contribute to only one group",
			});
		}
	});

export type TopicOrganizationGroup = z.infer<
	typeof topicOrganizationGroupSchema
>;
