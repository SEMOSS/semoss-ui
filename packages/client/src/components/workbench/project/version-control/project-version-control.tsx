import type { FC } from "react";
import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import type { GitBranches, GitStatus } from "@/components/git";
import { GitBranchControl } from "@/components/git";
import { useProject } from "@/hooks";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";

/** Select, create, and refresh project Git branches from panel chrome. */
export const ProjectVersionControl: FC<
	WorkbenchChromeProps<WorkbenchPanelParams, number>
> = ({ setValue }) => {
	const { project } = useProject();
	const insight = useInsight();
	const [isBranchesOpen, setIsBranchesOpen] = useState(false);
	const status = usePixel<GitStatus>(
		`ProjectGitStatus(project=[${JSON.stringify(project.project_id)}]);`,
	);
	const branches = usePixel<GitBranches>(
		isBranchesOpen
			? `ProjectGitBranches(project=[${JSON.stringify(project.project_id)}]);`
			: "",
	);
	/** Refresh branch status and increment the panel's history revision. */
	const refresh = () => {
		status.refresh();
		setValue((revision = 0) => revision + 1);
	};

	/** Check out an existing project branch through the active insight. */
	const switchBranch = async (value: string) => {
		await insight.actions.run(
			`ProjectGitCheckout(project=[${JSON.stringify(project.project_id)}], branch=[${JSON.stringify(value)}]);`,
		);
	};

	/** Create a project branch from HEAD through the active insight. */
	const createBranch = async (branch: string) => {
		await insight.actions.run(
			`ProjectGitCreateBranch(project=[${JSON.stringify(project.project_id)}], branch=[${JSON.stringify(branch)}], startPoint=["HEAD"]);`,
		);
	};

	return (
		<GitBranchControl
			status={status.data}
			branches={branches.data}
			branchesStatus={branches.status}
			label="Project version"
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
