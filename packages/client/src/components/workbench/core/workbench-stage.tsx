import { type FC, Fragment } from "react";
import { cn } from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";
import { isTabset, type WorkbenchLayoutNode } from "@/stores/workbench";
import { WorkbenchResizer } from "./workbench-resizer";
import { WorkbenchTabset } from "./workbench-tabset";

const WorkbenchNode: FC<{ node: WorkbenchLayoutNode }> = ({ node }) => {
	if (isTabset(node)) {
		return <WorkbenchTabset node={node} />;
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

/**
 * The dock tree. A maximized dock lifts itself out over the top rather than
 * replacing the tree, so every other dock stays mounted and in place —
 * the backdrop is what hides them.
 */
export const WorkbenchStage: FC = () => {
	const tree = useWorkbench((s) => s.layout.tree);
	const actions = useWorkbench((s) => s.layout.actions);
	const maximized = useWorkbench((s) => Boolean(s.layout.maximizedTabsetId));

	return (
		<>
			<WorkbenchNode node={tree} />
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
