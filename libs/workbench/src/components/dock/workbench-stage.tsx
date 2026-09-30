import { type FC, Fragment, type ReactNode } from "react";
import { cn } from "@semoss/ui/next";
import { useWorkbench } from "../../hooks";
import { isTabset } from "../../stores";
import type { WorkbenchLayoutNode } from "../../types";
import { WorkbenchResizer } from "./workbench-resizer";
import { WorkbenchTabset } from "./workbench-tabset";

const WorkbenchNode: FC<{
	node: WorkbenchLayoutNode;
	stageActions?: ReactNode;
}> = ({ node, stageActions }) => {
	if (isTabset(node)) {
		return <WorkbenchTabset node={node} stageActions={stageActions} />;
	}
	const rowAxis = node.type === "row";
	return (
		<div
			style={{ flexGrow: node.size, flexBasis: 0 }}
			className={cn(
				"flex min-h-0 min-w-0",
				rowAxis ? "flex-row" : "flex-col",
			)}
		>
			{node.children.map((child, index) => (
				<Fragment key={child.id}>
					<WorkbenchNode node={child} />
					{index < node.children.length - 1 && (
						<WorkbenchResizer
							kind="container"
							container={node}
							index={index}
						/>
					)}
				</Fragment>
			))}
		</div>
	);
};

interface WorkbenchStageProps {
	/** Chrome appended to the root tabset's tab strip. Not passed to splits. */
	stageActions?: ReactNode;
}

/**
 * The dock tree. A maximized dock lifts itself out over the top rather than
 * replacing the tree, so every other dock stays mounted and in place —
 * the backdrop is what hides them.
 */
export const WorkbenchStage: FC<WorkbenchStageProps> = ({ stageActions }) => {
	const tree = useWorkbench((s) => s.layout.tree);
	const actions = useWorkbench((s) => s.layout.actions);
	const maximized = useWorkbench((s) => Boolean(s.layout.maximizedTabsetId));

	return (
		<>
			<WorkbenchNode node={tree} stageActions={stageActions} />
			{maximized && (
				<button
					type="button"
					aria-label="Minimize"
					onClick={() => actions.toggleMaximize()}
					className="fixed inset-0 z-40 cursor-default bg-black/50"
				/>
			)}
		</>
	);
};
