import { CloudUploadIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useProject, useWorkbench } from "@/hooks";

/**
 * Compiles and publishes the project, and registers the matching command so the
 * same action is reachable from the command palette. Shared by the CODE, SKILL
 * and AGENT workbenches — for CODE the app preview iframe loads the *published*
 * portal, so this is the step that makes edits visible there.
 */
export const ProjectPublishButton: React.FC = () => {
	const { project } = useProject();
	const insight = useInsight();
	const registerCommand = useWorkbench((state) => state.registerCommand);
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

	// The command palette invokes handlers outside React, so route it through a
	// ref rather than re-registering the command on every publish.
	const publishRef = useRef(publish);
	publishRef.current = publish;

	useEffect(() => {
		return registerCommand({
			id: "workbench.project.publish",
			label: "Compile and Publish",
			description: "Compile the project and publish a new release",
			icon: <CloudUploadIcon />,
			handler: () => {
				void publishRef.current();
			},
		});
	}, [registerCommand]);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Compile and publish the app"
					data-testid="workbench-project-publish-button"
					disabled={isPublishing}
					onClick={() => {
						void publish();
					}}
				>
					{isPublishing ? (
						<Spinner className="size-3" />
					) : (
						<CloudUploadIcon className="size-3" />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">
				Compile and publish the app
			</TooltipContent>
		</Tooltip>
	);
};
