import { z } from "@semoss/ui/next";
import { topicOrganizationGroupSchema } from "./topic-organization-schema";

/** Deselected proposals can be incomplete; only selected groups become reviewed requests. */
export const topicOrganizationProposalFormSchema = z
	.object({
		groups: z.array(
			z.object({
				topicKeys: z.array(z.string()),
				targetKey: z.string(),
				name: z.string().max(255),
				description: z.string().max(12000),
				terms: z.string().max(4000),
				selected: z.boolean(),
			}),
		),
	})
	.superRefine((values, context) => {
		if (!values.groups.some((group) => group.selected))
			context.addIssue({
				code: "custom",
				path: ["groups"],
				message: "Choose a proposal to preview",
			});
		values.groups.forEach((group, index) => {
			if (!group.selected) return;
			const parsed = topicOrganizationGroupSchema.safeParse(group);
			if (!parsed.success)
				for (const issue of parsed.error.issues)
					context.addIssue({
						...issue,
						path: ["groups", index, ...issue.path],
					});
		});
	});

export type TopicOrganizationProposalValues = z.infer<
	typeof topicOrganizationProposalFormSchema
>;
