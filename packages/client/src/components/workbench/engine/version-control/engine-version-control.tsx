import type { FC } from "react";
import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import type { GitBranches, GitStatus } from "@/components/git";
import { GitBranchControl } from "@/components/git";
import { useEngine } from "@/hooks";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../../core/workbench.chrome";

/** Select, create, and refresh engine Git branches from panel chrome. */
export const EngineVersionControl: FC<
	WorkbenchChromeProps<WorkbenchPanelParams, number>
> = ({ setValue }) => {
	const { engine } = useEngine();
	const insight = useInsight();
	const [isBranchesOpen, setIsBranchesOpen] = useState(false);
	const status = usePixel<GitStatus>(
		`EngineGitStatus(engine=[${JSON.stringify(engine.engine_id)}]);`,
	);
	const branches = usePixel<GitBranches>(
		isBranchesOpen
			? `EngineGitBranches(engine=[${JSON.stringify(engine.engine_id)}]);`
			: "",
	);
	/** Refresh branch status and increment the panel's history revision. */
	const refresh = () => {
		status.refresh();
		setValue((revision = 0) => revision + 1);
	};

	/** Check out an existing engine branch through the active insight. */
	const switchBranch = async (value: string) => {
		await insight.actions.run(
			`EngineGitCheckout(engine=[${JSON.stringify(engine.engine_id)}], branch=[${JSON.stringify(value)}]);`,
		);
	};

	/** Create an engine branch from HEAD through the active insight. */
	const createBranch = async (branch: string) => {
		await insight.actions.run(
			`EngineGitCreateBranch(engine=[${JSON.stringify(engine.engine_id)}], branch=[${JSON.stringify(branch)}], startPoint=["HEAD"]);`,
		);
	};

	return (
		<GitBranchControl
			status={status.data}
			branches={branches.data}
			branchesStatus={branches.status}
			label="Engine version"
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
