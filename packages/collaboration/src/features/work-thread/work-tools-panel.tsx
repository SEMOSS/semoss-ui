import { Wrench } from "lucide-react";
import { createElement } from "react";
import { Badge, Button, H3, P, Small } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { getToolDisplayLocation } from "@/features/tools/utils/tool-metadata";
/** Discover results and approvals without automatically replacing the active panel. */
export function WorkToolsPanel() {
	const workbench = useToolWorkbench();
	const tools = Object.values(workbench.tools).filter(
		(tool) =>
			getToolDisplayLocation(tool) !== "hidden" ||
			workbench.pendingApprovals.some(
				(approval) => approval.toolId === tool.id,
			),
	);
	return (
		<div className="h-full space-y-4 overflow-y-auto p-4">
			<div className="space-y-2">
				<H3 className="text-lg">Tools</H3>
				<P className="text-muted-foreground">
					Results and requests from this conversation.
				</P>
			</div>
			{tools.length === 0 && (
				<P className="rounded-lg bg-muted p-4 text-muted-foreground">
					Tool results will appear here when Assistant uses a tool.
					Add capabilities in Settings.
				</P>
			)}
			<div className="divide-y">
				{tools.map((tool) => {
					const approval = workbench.pendingApprovals.find(
						(candidate) => candidate.toolId === tool.id,
					);
					return (
						<div
							key={tool.id}
							className="flex flex-wrap items-center gap-3 py-3"
						>
							<Wrench
								aria-hidden="true"
								className="size-4 shrink-0 text-muted-foreground"
							/>
							<div className="min-w-0 flex-1">
								<P className="break-words font-medium">
									{tool.title || tool.name || "Tool result"}
								</P>
								<Small className="text-muted-foreground">
									{approval
										? "Needs your review"
										: tool.status}
								</Small>
							</div>
							{approval && (
								<Badge variant="outline">Approval</Badge>
							)}
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => workbench.openWorkbench(tool.id)}
							>
								{approval ? "Review" : "Open"}
							</Button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
export const WORK_TOOLS_PANEL: WorkbenchPanelConfig = {
	name: "Tools",
	icon: ({ className }) =>
		createElement(Wrench, { className, "aria-hidden": true }),
	canRename: false,
	mount: "keepAlive",
	content: WorkToolsPanel,
};
