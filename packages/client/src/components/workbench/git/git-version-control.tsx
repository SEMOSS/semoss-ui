import type { FC } from "react";
import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { Button, Spinner } from "@semoss/ui/next";
import type { GitBranches, GitStatus } from "@/components/git";
import { GitBranchControl } from "@/components/git";
import { useAccess } from "@/hooks";
import type { WorkbenchChromeProps } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";
import type { GitPanelScopeParams } from "./git-panel.types";

export type GitVersionParams = GitPanelScopeParams;

/** Select, create, and refresh branches for a configured Git resource. */
export const GitVersionControl: FC<
	WorkbenchChromeProps<GitVersionParams, number>
> = ({ config, setValue }) => {
	const insight = useInsight();
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
