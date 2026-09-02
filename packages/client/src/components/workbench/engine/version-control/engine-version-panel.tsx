import { GitBranchIcon } from "lucide-react";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { GitCommit, GitDataStatus } from "@/components/git";
import { GitHistory } from "@/components/git";
import { useEngine } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { EngineGitCommitRow } from "./engine-git-commit-row";

const PAGE_SIZE = 20;

/** Connect engine commit history and restore actions to shared Git UI. */
const EngineVersionPanel: WorkbenchComponent<WorkbenchPanelParams> = () => {
	const { engine, permission } = useEngine();
	const history = useIteratorPixel<GitCommit[], GitCommit>(
		(limit, offset) =>
			`EngineCommitDetails(engine=[${JSON.stringify(engine.engine_id)}], limit=["${limit}"], offset=["${offset}"]);`,
		(response) => (response.length < PAGE_SIZE ? -1 : Infinity),
		(response) => response,
		{ limit: PAGE_SIZE },
		[engine.engine_id],
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
				<EngineGitCommitRow
					key={commit.commitId}
					engineId={engine.engine_id}
					commit={commit}
					canRestore={permission === "OWNER" || permission === "EDIT"}
					onRestored={history.reset}
				/>
			)}
		/>
	);
};

/** Keep-alive engine version history panel without unsupported branch actions. */
export const ENGINE_VERSION_PANEL: WorkbenchPanelConfig<WorkbenchPanelParams> =
	{
		name: "Version Control",
		helpText: "Version Control",
		icon: ({ className }) => <GitBranchIcon className={className} />,
		canClose: false,
		canRename: false,
		canSplitTab: true,
		mount: "keepAlive",
		content: EngineVersionPanel,
	};
