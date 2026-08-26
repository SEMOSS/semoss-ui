import { CloudUploadIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	cn,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useProject, useWorkbenchCommands } from "@/hooks";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";

/**
 * Compiles and publishes the project, and registers the matching command so the
 * same action is reachable from the command palette. Shared by the CODE, SKILL
 * and AGENT workbenches — for CODE the app preview iframe loads the *published*
 * portal, so this is the step that makes edits visible there.
 */
export const ProjectPublishButton: React.FC = () => {
	const { project } = useProject();
	const insight = useInsight();
	const [isPublishing, setIsPublishing] = useState(false);

	const publish = useCallback(async () => {
		try {
			setIsPublishing(true);

			// Separate calls so we reload successfully compiled classes before
			// publishing
			await insight.actions.run(
				`ReloadInsightClasses(project='${project.project_id}', release=false);`,
			);

			await insight.actions.run(
				`PublishProject(project='${project.project_id}', release=true);`,
			);

			toast.success("Successfully compiled and published");
		} catch (e) {
			toast.error(`Error: ${e}`);
		} finally {
			setIsPublishing(false);
		}
	}, [insight.actions, project.project_id]);

	// useWorkbenchCommands delegates handlers through a ref, so the latest
	// publish closure always runs without re-registering per render.
	useWorkbenchCommands([
		{
			id: "workbench.project.publish",
			category: "Project",
			label: "Compile and Publish",
			description: "Compile the project and publish a new release",
			handler: () => {
				void publish();
			},
		},
	]);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Compile and publish the app"
					data-testid="workbench-project-publish-button"
					className={cn(
						"border border-transparent text-muted-foreground",
						WORKBENCH_STYLES.chromeButton,
					)}
					disabled={isPublishing}
					onClick={() => {
						void publish();
					}}
				>
					{isPublishing ? (
						<Spinner className={WORKBENCH_STYLES.chromeIcon} />
					) : (
						<CloudUploadIcon
							className={WORKBENCH_STYLES.chromeIcon}
						/>
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">
				Compile and publish the app
			</TooltipContent>
		</Tooltip>
	);
};
