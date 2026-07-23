import { XIcon } from "lucide-react";
import { useState } from "react";
import { Button, ScrollArea } from "@semoss/ui/next";
import type { Engine, MCPConfig } from "../types";
import type { McpOverlayAgent, McpOverlayWorkspaceRef } from "./mcp-overlay";
import { RoomOptionsForm } from "./room-options-form";

export interface RoomSettingsSidebarProps {
	mcp: MCPConfig[];
	onMcpChange: (mcp: MCPConfig[]) => void;
	model?: Engine | null;
	onModelChange?: (model: Engine) => void;
	agents?: readonly McpOverlayAgent[];
	workspace?: McpOverlayWorkspaceRef | null;
	onWorkspaceChange?: (workspace: McpOverlayWorkspaceRef | null) => void;
	onClose?: () => void;
	showCloseButton?: boolean;
}

/**
 * Sidebar-hosted room settings page (playground-style form) used by slash
 * command actions in ChatPanel.
 */
export function RoomSettingsSidebar({
	mcp,
	onMcpChange,
	model,
	onModelChange,
	agents,
	workspace: controlledWorkspace,
	onWorkspaceChange,
	onClose,
	showCloseButton = true,
}: RoomSettingsSidebarProps) {
	const [internalWorkspace, setInternalWorkspace] =
		useState<McpOverlayWorkspaceRef>();
	const [instructions, setInstructions] = useState("");
	const workspace =
		controlledWorkspace !== undefined
			? (controlledWorkspace ?? undefined)
			: internalWorkspace;

	return (
		<div
			data-slot="room-settings-sidebar"
			className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-card"
		>
			<div className="flex items-center gap-2 border-border border-b px-4 py-3">
				<div className="min-w-0 flex-1">
					<div className="font-semibold text-base">Room Settings</div>
					<div className="truncate text-muted-foreground text-sm">
						Configure room options
					</div>
				</div>
				{showCloseButton && onClose ? (
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						aria-label="Close room settings sidebar"
					>
						<XIcon className="size-4" />
					</Button>
				) : null}
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<RoomOptionsForm
					model={model}
					onModelChange={onModelChange}
					agents={agents}
					options={{
						instructions,
						mcp,
						workspace,
					}}
					onOptionsChange={(next) => {
						if (next.instructions !== undefined) {
							setInstructions(next.instructions);
						}
						if ("workspace" in next) {
							if (onWorkspaceChange) {
								onWorkspaceChange(next.workspace ?? null);
							} else {
								setInternalWorkspace(next.workspace);
							}
						}
						if (next.mcp) {
							onMcpChange(next.mcp);
						}
					}}
				/>
			</ScrollArea>
		</div>
	);
}
