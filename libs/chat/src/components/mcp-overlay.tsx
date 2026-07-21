import { BookOpenIcon, HammerIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MCPSelector, splitMcpByType } from "@semoss/shared";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import type { MCPConfig } from "../types";

type Tab = "KNOWLEDGE" | "TOOLBOX";
export type McpOverlayOpenMode = "side" | "inline";

export interface McpOverlayProps {
	open: boolean;
	/** Which tab is active when the overlay opens. */
	defaultTab: Tab;
	/** Presentation mode: right-side panel or centered dialog. Defaults to side. */
	openMode?: McpOverlayOpenMode;
	/** Full MCP list (both types) currently attached — the overlay splits these into its two tabs. */
	values: MCPConfig[];
	/** Fired on Save with the combined next list; not fired on Cancel/dismiss. */
	onSave: (mcp: MCPConfig[]) => void;
	onOpenChange: (open: boolean) => void;
}

/**
 * Knowledge/Toolbox attachment dialog — ported from playground's real
 * `components/mcp/mcp-overlay.tsx`, reusing `@semoss/shared`'s real
 * `MCPSelector` directly for both tabs (already self-contained — it calls
 * `usePixel`/`useIteratorPixel` itself, same pattern `EngineSelect` already
 * uses). Deliberately narrower than playground's version: no Agent tab (no
 * `AgentSelector` in `@semoss/shared`, and agent-mode ties into
 * workspace-management concepts already out of scope — see
 * docs/chat-components/PLAN.md's Batch 9 notes) and no create-new-knowledge
 * sub-flow (achieved for free by simply not passing `MCPSelector`'s
 * `onRequestCreateKnowledge` — its "+" button only renders when that
 * callback is provided at all).
 */
export function McpOverlay({
	open,
	defaultTab,
	openMode = "side",
	values,
	onSave,
	onOpenChange,
}: McpOverlayProps) {
	const [knowledge, setKnowledge] = useState<MCPConfig[]>(
		() => splitMcpByType(values).knowledge,
	);
	const [toolbox, setToolbox] = useState<MCPConfig[]>(
		() => splitMcpByType(values).toolbox,
	);
	const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

	// Reset drafts on the closed -> open transition only, so in-progress
	// edits aren't discarded by an unrelated prop change while still open.
	const wasOpen = useRef(open);
	useEffect(() => {
		if (open && !wasOpen.current) {
			const next = splitMcpByType(values);
			setKnowledge(next.knowledge);
			setToolbox(next.toolbox);
			setActiveTab(defaultTab);
		}
		wasOpen.current = open;
	}, [open, values, defaultTab]);

	const selectorContent = (
		<>
			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as Tab)}
				className="flex min-h-0 flex-1 flex-col gap-3"
			>
				<TabsList className="h-10 w-full p-1">
					<TabsTrigger value="KNOWLEDGE" className="flex-1 gap-2">
						<BookOpenIcon className="size-4" />
						Knowledge
						<Badge variant="outline" className="ms-1">
							{knowledge.length}
						</Badge>
					</TabsTrigger>
					<TabsTrigger value="TOOLBOX" className="flex-1 gap-2">
						<HammerIcon className="size-4" />
						Toolbox
						<Badge variant="outline" className="ms-1">
							{toolbox.length}
						</Badge>
					</TabsTrigger>
				</TabsList>

				<TabsContent
					value="KNOWLEDGE"
					className="flex min-h-0 flex-1 flex-col"
				>
					{activeTab === "KNOWLEDGE" && (
						<MCPSelector
							type="KNOWLEDGE"
							values={knowledge}
							onChange={setKnowledge}
							autoFocus
						/>
					)}
				</TabsContent>
				<TabsContent
					value="TOOLBOX"
					className="flex min-h-0 flex-1 flex-col"
				>
					{activeTab === "TOOLBOX" && (
						<MCPSelector
							type="TOOLBOX"
							values={toolbox}
							onChange={setToolbox}
							autoFocus
						/>
					)}
				</TabsContent>
			</Tabs>
		</>
	);

	const actionButtons = (
		<>
			<Button variant="ghost" onClick={() => onOpenChange(false)}>
				Cancel
			</Button>
			<Button
				variant="default"
				onClick={() => {
					onSave([...knowledge, ...toolbox]);
					onOpenChange(false);
				}}
			>
				Save
			</Button>
		</>
	);

	if (openMode === "inline") {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="flex h-[80vh] max-h-160 w-full flex-col gap-4 sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle>Knowledge & Tools</DialogTitle>
						<DialogDescription>
							Attach knowledge sources or tools for this
							conversation.
						</DialogDescription>
					</DialogHeader>
					{selectorContent}
					<DialogFooter>{actionButtons}</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex h-full w-[min(56rem,96vw)] max-w-none flex-col gap-4 sm:w-[min(64rem,90vw)]"
			>
				<SheetHeader>
					<SheetTitle>Knowledge & Tools</SheetTitle>
					<SheetDescription>
						Attach knowledge sources or tools for this conversation.
					</SheetDescription>
				</SheetHeader>
				{selectorContent}
				<SheetFooter className="pt-0 sm:flex-row sm:justify-end">
					{actionButtons}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
