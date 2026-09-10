import { GitBranchIcon } from "lucide-react";
import { useEffect } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	WorkbenchAccessError,
	WorkbenchAccessLoading,
} from "@semoss/workbench";
import type { GitCommit, GitDataStatus } from "@/components/git";
import { GitHistory } from "@/components/git";
import { useAccess, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { GitCommitRowAdapter } from "./git-commit-row";
import {
	GitVersionControl,
	type GitVersionParams,
} from "./git-version-control";

const PAGE_SIZE = 20;

/** Connect scoped commit history and panel refresh state to shared Git UI. */
const GitVersionPanel = ({
	config,
	id,
	value,
}: WorkbenchPanelProps<GitVersionParams, number>) => {
	const access = useAccess(config.type, config.id);
	const prefix = config.type === "ENGINE" ? "Engine" : "Project";
	const resource =
		config.type === "ENGINE"
			? `engine=[${JSON.stringify(config.id)}]`
			: `project=[${JSON.stringify(config.id)}]`;
	const history = useIteratorPixel<GitCommit[], GitCommit>(
		(limit, offset) =>
			access.status === "ready"
				? `${prefix}CommitDetails(${resource}, limit=["${limit}"], offset=["${offset}"]);`
				: "",
		(response) => (response.length < PAGE_SIZE ? -1 : Infinity),
		(response) => response,
		{ limit: PAGE_SIZE },
		[config.id, config.type, access.status],
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

	useWorkbenchControl(id, GitVersionControl);

	useEffect(() => {
		if (value === undefined) return;
		history.reset();
	}, [history.reset, value]);

	if (access.status === "loading") {
		return (
			<WorkbenchAccessLoading
				className="size-full"
				label="Loading resource access"
			/>
		);
	}

	if (access.status === "error") {
		return (
			<WorkbenchAccessError
				className="size-full"
				message={access.error}
				onRetry={() => void access.refresh()}
			/>
		);
	}

	return (
		<div className="relative size-full">
			<GitHistory
				commits={history.data}
				status={historyStatus}
				onRetry={history.reset}
				hasMore={history.hasMore}
				isLoadingMore={history.isLoading && history.data.length > 0}
				loadMoreError={history.isError && history.data.length > 0}
				onLoadMore={history.isError ? history.reset : history.next}
				renderCommit={(commit) => (
					<GitCommitRowAdapter
						key={commit.commitId}
						type={config.type}
						id={config.id}
						canRestore={!access.readOnly}
						commit={commit}
						onRestored={history.reset}
					/>
				)}
			/>
			{access.refreshing ? (
				<WorkbenchAccessLoading
					className="absolute inset-0 bg-background/80"
					label="Refreshing resource access"
				/>
			) : null}
			{access.refreshError ? (
				<WorkbenchAccessError
					className="absolute inset-0 bg-background/90"
					message={access.refreshError}
					onRetry={() => void access.refresh()}
				/>
			) : null}
		</div>
	);
};

/** Scope-aware version history blueprint shared by project and engine workbenches. */
export const GIT_VERSION_PANEL: WorkbenchPanelConfig<GitVersionParams, number> =
	{
		name: "Version Control",
		helpText: "Version Control",
		icon: ({ className }) => <GitBranchIcon className={className} />,
		canClose: false,
		canRename: false,
		canSplitTab: true,
		mount: "keepAlive",
		matches: (a, b) => a.type === b.type && a.id === b.id,
		content: GitVersionPanel,
	};
