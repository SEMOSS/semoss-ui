import type { FC } from "react";
import { useState } from "react";
import { FILE_PANEL_EVENTS, useAccess } from "@semoss/panels";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { Button, Spinner } from "@semoss/ui/next";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import {
	useWorkbench,
	useWorkbenchEvent,
	useWorkbenchPanel,
	WORKBENCH_STYLES,
} from "@semoss/workbench";
import type { GitBranches, GitStatus } from "@/components/git";
import { GitBranchControl } from "@/components/git";
import { WORKBENCH_EVENTS } from "@/stores/workbench";
import { type GitPanelScopeParams, gitFileScope } from "./git-panel.types";

export type GitVersionParams = GitPanelScopeParams;

/** Select, create, and refresh branches for a configured Git resource. */
export const GitVersionControl: FC<WorkbenchPanelProps> = ({ id }) => {
	const { config, setValue } = useWorkbenchPanel<GitVersionParams, number>(
		id,
	);

	const insight = useInsight();
	const emit = useWorkbench((s) => s.events.actions.emit);
	const scope = gitFileScope(config);
	const access = useAccess(config.type, config.id);
	const [isBranchesOpen, setIsBranchesOpen] = useState(false);
	const readOnly = access.status !== "ready" || access.readOnly;
	const prefix = config.type === "ENGINE" ? "Engine" : "Project";
	const resource =
		config.type === "ENGINE"
			? `engine=[${JSON.stringify(config.id)}]`
			: `project=[${JSON.stringify(config.id)}]`;
	const hasAccess = access.status === "ready";
	const status = usePixel<GitStatus>(
		hasAccess ? `${prefix}GitStatus(${resource});` : "",
	);
	const branches = usePixel<GitBranches>(
		hasAccess && isBranchesOpen ? `${prefix}GitBranches(${resource});` : "",
	);

	// Staging happens in the diff panel, which is a different panel; without
	// this the staged/unstaged counts here stayed wrong until a manual refresh.
	useWorkbenchEvent<{ scope: string }>(
		WORKBENCH_EVENTS.GIT_STATUS_CHANGED,
		(changed) => {
			if (changed.scope === scope) {
				status.refresh();
			}
		},
	);

	const refresh = () => {
		if (access.status !== "loading") {
			void access.refresh().catch(() => undefined);
		}
		status.refresh();
		setValue((revision = 0) => revision + 1);
	};

	const switchBranch = async (branch: string) => {
		if (readOnly) return;
		await insight.actions.run(
			`${prefix}GitCheckout(${resource}, branch=[${JSON.stringify(branch)}]);`,
		);
		// A checkout rewrites the whole working tree, so every explorer and
		// open editor in this resource is showing the old branch. No paths: the
		// pixel does not report what it touched, and "everything" is the honest
		// answer anyway.
		emit(FILE_PANEL_EVENTS.FILES_CHANGED, { scope });
	};

	const createBranch = async (branch: string) => {
		if (readOnly) return;
		await insight.actions.run(
			`${prefix}GitCreateBranch(${resource}, branch=[${JSON.stringify(branch)}], startPoint=["HEAD"]);`,
		);
	};

	if (access.status === "loading") {
		return <Spinner aria-label="Loading version control access" />;
	}
	if (access.status === "error") {
		return (
			<Button
				type="button"
				size="sm"
				onClick={() => void access.refresh().catch(() => undefined)}
			>
				Retry access
			</Button>
		);
	}

	return (
		<GitBranchControl
			status={status.data}
			branches={branches.data}
			branchesStatus={branches.status}
			isRefreshing={status.status === "LOADING" || access.refreshing}
			label={`${config.type === "ENGINE" ? "Engine" : "Project"} version`}
			readOnly={readOnly}
			onOpenChange={setIsBranchesOpen}
			onSwitch={switchBranch}
			onCreate={createBranch}
			onRefresh={refresh}
			triggerClassName={WORKBENCH_STYLES.chromeSelect}
			refreshClassName={WORKBENCH_STYLES.chromeButton}
			refreshIconClassName={WORKBENCH_STYLES.chromeIcon}
		/>
	);
};
