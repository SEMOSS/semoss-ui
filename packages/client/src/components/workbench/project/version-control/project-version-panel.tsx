import { GitBranchIcon } from "lucide-react";
import { useEffect } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { GitCommit, GitDataStatus } from "@/components/git";
import { GitHistory } from "@/components/git";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { ProjectGitCommitRow } from "./project-git-commit-row";
import { ProjectVersionControl } from "./project-version-control";

const PAGE_SIZE = 20;

/** Connect project commit history and panel refresh state to shared Git UI. */
const ProjectVersionPanel: WorkbenchComponent<WorkbenchPanelParams, number> = ({
	id,
	value,
}) => {
	const { project, permission } = useProject();
	const history = useIteratorPixel<GitCommit[], GitCommit>(
		(limit, offset) =>
			`ProjectCommitDetails(project=[${JSON.stringify(project.project_id)}], limit=["${limit}"], offset=["${offset}"]);`,
		(response) => (response.length < PAGE_SIZE ? -1 : Infinity),
		(response) => response,
		{ limit: PAGE_SIZE },
		[project.project_id],
	);
	const historyStatus: GitDataStatus = history.isError
		? history.data.length === 0
			? "ERROR"
			: "SUCCESS"
		: history.isLoading
			? history.data.length === 0
				? "LOADING"
				: "SUCCESS"
			: history.totalCount === 0
				? "INITIAL"
				: "SUCCESS";

	useWorkbenchControl(id, ProjectVersionControl);

	useEffect(() => {
		if (value === undefined) {
			return;
		}
		history.reset();
	}, [history.reset, value]);

	return (
		<GitHistory
			commits={history.data}
			status={historyStatus}
			onRetry={history.reset}
			hasMore={history.hasMore}
			isLoadingMore={history.isLoading && history.data.length > 0}
			loadMoreError={history.isError && history.data.length > 0}
			onLoadMore={history.isError ? history.reset : history.next}
			renderCommit={(commit) => (
				<ProjectGitCommitRow
					key={commit.commitId}
					projectId={project.project_id}
					commit={commit}
					canRestore={permission === "OWNER" || permission === "EDIT"}
					onRestored={history.reset}
				/>
			)}
		/>
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
