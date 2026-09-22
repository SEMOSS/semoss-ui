import { MoreHorizontal, PanelBottom, PanelRight, X } from "lucide-react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { useToolWorkbench } from "../tool-workbench.context";

/** Explicit location actions for a tool message card. */
export function ToolCallMenu({ toolId }: { toolId: string }) {
	const { getToolDisplayMode, openInline, openWorkbench, closeTool } =
		useToolWorkbench();
	const displayMode = getToolDisplayMode(toolId);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="shrink-0"
					aria-label="Tool display options"
					onClick={(event) => event.stopPropagation()}
				>
					<MoreHorizontal aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onSelect={() => openInline(toolId)}>
					<PanelBottom aria-hidden="true" />
					Open inline
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={() => openWorkbench(toolId)}>
					<PanelRight aria-hidden="true" />
					Open in workbench
				</DropdownMenuItem>
				{displayMode !== "hidden" && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={() => closeTool(toolId)}>
							<X aria-hidden="true" />
							Close tool
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
