import { BookOpenIcon, HammerIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { isKnowledgeMcp } from "@semoss/shared";
import {
	Badge,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import type { MCPConfig } from "../types";
import { McpOverlay } from "./mcp-overlay";

export interface McpMenuButtonProps {
	/** Full MCP list (both types) currently attached to this room. */
	mcp: MCPConfig[];
	/** Fired with the combined next list once the user saves the overlay. */
	onChange: (mcp: MCPConfig[]) => void;
	disabled?: boolean;
}

/**
 * The composer's "+" trigger into knowledge/toolbox attachment — ported
 * from playground's real room-input.tsx (`RoomInputMenuMCP` dropdown items
 * + count badges, `room-input.tsx:281-285` for the count derivation via
 * `@semoss/shared`'s own `isKnowledgeMcp`, not reinvented). Playground's
 * real "+" menu also has Attach file / File Explorer / Activity Log /
 * Settings items — those are out of scope here (file attach is its own
 * deferred batch, the rest are app-shell concerns), so this is just the
 * two MCP items. Composed into `ChatInput`'s `trailingActions` by the
 * host, same pattern as `EngineSelect`/`PromptOptimizer` — not baked into
 * `ChatInput`'s core.
 */
export function McpMenuButton({ mcp, onChange, disabled }: McpMenuButtonProps) {
	const [overlayTab, setOverlayTab] = useState<
		"KNOWLEDGE" | "TOOLBOX" | null
	>(null);

	const knowledgeCount = mcp.filter(isKnowledgeMcp).length;
	const toolboxCount = mcp.length - knowledgeCount;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Add knowledge or tools"
						disabled={disabled}
					>
						<PlusIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuItem
						onClick={() => setOverlayTab("KNOWLEDGE")}
					>
						<BookOpenIcon />
						Add Knowledge
						<Badge variant="outline" className="ms-auto">
							{knowledgeCount}
						</Badge>
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setOverlayTab("TOOLBOX")}>
						<HammerIcon />
						Add Toolbox
						<Badge variant="outline" className="ms-auto">
							{toolboxCount}
						</Badge>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<McpOverlay
				open={overlayTab !== null}
				defaultTab={overlayTab ?? "KNOWLEDGE"}
				values={mcp}
				onSave={onChange}
				onOpenChange={(open) => {
					if (!open) {
						setOverlayTab(null);
					}
				}}
			/>
		</>
	);
}
