import { GitBranchIcon, GitCommitHorizontalIcon } from "lucide-react";
import { useEffect } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	Muted,
	Skeleton,
} from "@semoss/ui/next";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { GitCommitRow } from "./git-commit-row";
import { ProjectVersionControl } from "./project-version-control";
import type { ProjectGitCommit } from "./version-control.types";

const PAGE_SIZE = 20;

const ProjectVersionPanel: WorkbenchComponent<WorkbenchPanelParams, number> = ({
	id,
	value,
}) => {
	const { project } = useProject();
	const history = usePixel<ProjectGitCommit[]>(
		`ProjectCommitDetails(project=[${JSON.stringify(project.project_id)}], limit=["${PAGE_SIZE}"], offset=["0"]);`,
	);

	useWorkbenchControl(id, ProjectVersionControl);

	useEffect(() => {
		if (value === undefined) {
			return;
		}
		history.refresh();
	}, [history.refresh, value]);

	return (
		<Accordion
			type="multiple"
			defaultValue={["history"]}
			className="h-full min-h-0 overflow-y-auto"
		>
			<AccordionItem value="history">
				<AccordionTrigger className="px-3 py-2 hover:no-underline">
					<span className="flex items-center gap-2">
						<GitCommitHorizontalIcon
							className="size-4"
							aria-hidden="true"
						/>
						<span className="font-medium text-sm">
							Commit History
						</span>
					</span>
				</AccordionTrigger>
				<AccordionContent className="pb-1">
					{history.status === "INITIAL" ||
					history.status === "LOADING" ? (
						<div className="flex flex-col gap-2 px-3 py-2">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : null}
					{history.status === "ERROR" ? (
						<div
							className="flex flex-col items-start gap-2 px-3 py-2"
							role="alert"
						>
							<Muted>Unable to load commit history.</Muted>
							<Button
								size="sm"
								variant="outline"
								onClick={history.refresh}
							>
								Retry
							</Button>
						</div>
					) : null}
					{history.status === "SUCCESS" &&
					history.data?.length === 0 ? (
						<Muted className="block px-3 py-2">
							No commits yet.
						</Muted>
					) : null}
					{history.data?.map((commit) => (
						<GitCommitRow
							key={commit.commitId}
							projectId={project.project_id}
							commit={commit}
						/>
					))}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
};

/** Keep-alive project version history panel. */
export const PROJECT_VERSION_PANEL: WorkbenchPanelConfig<
	WorkbenchPanelParams,
	number
> = {
	name: "Version Control",
	helpText: "Version Control",
	icon: ({ className }) => <GitBranchIcon className={className} />,
	canClose: false,
	canRename: false,
	canSplitTab: true,
	mount: "keepAlive",
	content: ProjectVersionPanel,
};
