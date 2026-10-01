import { useInsight, usePixel } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { useProject } from "@/hooks";

/**
 * Warns once when the user lacks access to any of the project's engine
 * dependencies. Renders nothing — it exists only for the pixel side effect, and
 * must be mounted inside the project-bound `InsightProvider`.
 */
export const ProjectDependencyWarning: React.FC = () => {
	const insight = useInsight();
	const { project } = useProject();

	usePixel(
		insight.isReady && project.project_id
			? `ValidateUserProjectDependencies(project="${project.project_id}");`
			: "",
		{
			onSuccess: (data: Record<string, boolean>) => {
				const needsAccess: string[] = [];
				Object.entries(data).forEach((kv) => {
					const hasAccess = kv[1];

					if (!hasAccess) {
						needsAccess.push(kv[0]);
					}
				});
				if (needsAccess.length) {
					toast.warning(
						`You do not have access to the following dependencies: ${needsAccess.join(
							", ",
						)}.`,
					);
				}
			},
		},
		insight.insightId,
	);

	return null;
};
