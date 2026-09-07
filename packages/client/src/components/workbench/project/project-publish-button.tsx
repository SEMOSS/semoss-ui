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
	const [isLoading, setIsLoading] = useState(false);

	/** Compile the project. */
	const compile = useCallback(async () => {
		try {
			setIsLoading(true);

			// compile
			await insight.actions.run(
				`CompileAppReactors(project='${project.project_id}', release=false);`,
			);

			toast.success("Successfully compiled");

			return true;
		} catch (e) {
			toast.error(`Error: ${e}`);
			return false;
		} finally {
			setIsLoading(false);
		}
	}, [insight.actions, project.project_id]);

	/** Publish the project. */
	const publish = useCallback(async () => {
		try {
			setIsLoading(true);

			// publish
			await insight.actions.run(
				`PublishProject(project='${project.project_id}', release=true);`,
			);

			toast.success("Successfully published");
		} catch (e) {
			toast.error(`Error: ${e}`);
		} finally {
			setIsLoading(false);
		}
	}, [insight.actions, project.project_id]);

	useWorkbenchCommands([
		{
			id: "workbench.project.compile",
			category: "",
			label: "Compile",
			description: "Compile the project",
			handler: () => {
				void compile();
			},
		},
		{
			id: "workbench.project.publish",
			category: "",
			label: "Publish",
			description: "Publish a new release",
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
					disabled={isLoading}
					onClick={async () => {
						const compiled = await compile();
						if (compiled) {
							await publish();
						}
					}}
				>
					{isLoading ? (
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
