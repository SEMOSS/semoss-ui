import {
	BookOpenIcon,
	CheckIcon,
	ComputerIcon,
	HammerIcon,
	InfoIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import type { MCPConfig, Workspace } from "@/types";
import { AgentSelector } from "./agent-selector";
import { MCPSelector } from "./mcp-selector";
import { splitMcpByType } from "./utility";

type Tab = "AGENT" | "TOOLBOX" | "KNOWLEDGE";
type WorkspaceRef = Pick<Workspace, "workspace_id"> &
	Partial<Pick<Workspace, "name">>;

export interface MCPOverlaySave {
	mcp: MCPConfig[];
	/** Only present when the overlay was opened with an `workspace` prop. */
	workspace?: WorkspaceRef | null;
}

interface MCPOverlayProps {
	/** Open */
	open: boolean;

	/** Which tab is active when the overlay opens */
	defaultTab: Tab;

	/** Full MCP list (any types). The overlay splits these into the two tabs. */
	values: MCPConfig[];

	/**
	 * Currently-selected agent (workspace), if any. The Agent tab is always
	 * rendered as the first tab; this just hydrates it.
	 */
	workspace?: WorkspaceRef | null;

	/**
	 * Whether the user can change the agent inside the overlay. Defaults to
	 * `false` — callers must explicitly opt in. When false the Agent tab is
	 * read-only with an explanatory note (e.g. existing rooms where the
	 * workspace is already baked in).
	 */
	agentEditable?: boolean;

	/**
	 * Fired when the overlay closes. Receives the next draft state when the
	 * user saves, or `undefined` when they cancel.
	 */
	onClose: (next?: MCPOverlaySave) => void;
}

export const MCPOverlay: React.FC<MCPOverlayProps> = ({
	open,
	defaultTab,
	values,
	workspace,
	agentEditable = false,
	onClose,
}) => {
	const { t } = useTranslation("mcp");

	const [knowledge, setKnowledge] = useState<MCPConfig[]>(
		() => splitMcpByType(values).knowledge,
	);
	const [toolbox, setToolbox] = useState<MCPConfig[]>(
		() => splitMcpByType(values).toolbox,
	);
	const [workspaceDraft, setWorkspaceDraft] = useState<WorkspaceRef | null>(
		workspace ?? null,
	);
	const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

	// Reset drafts on the closed → open transition only. Mutations to props
	// while the dialog is already open would otherwise discard the user's
	// in-progress edits.
	const wasOpen = useRef(open);
	useEffect(() => {
		if (open && !wasOpen.current) {
			const next = splitMcpByType(values);
			setKnowledge(next.knowledge);
			setToolbox(next.toolbox);
			setWorkspaceDraft(workspace ?? null);
			setActiveTab(defaultTab);
		}
		wasOpen.current = open;
	}, [open, values, defaultTab, workspace]);

	return (
		<Dialog open={open} onOpenChange={() => onClose()}>
			<DialogContent
				className="flex h-[80vh] max-h-[40rem] w-full flex-col gap-4 sm:max-w-4xl"
				onOpenAutoFocus={(e) => e.preventDefault()}
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>{t("overlay.title")}</DialogTitle>
					<DialogDescription>
						{t("overlay.description")}
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as Tab)}
					className="flex min-h-0 flex-1 flex-col gap-3"
				>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="AGENT" className="relative gap-2">
							<ComputerIcon className="size-4" />
							{t("overlay.tabAgent")}
							{/* Absolutely positioned so the centered label
							    doesn't shift when the indicator appears. */}
							{workspaceDraft ? (
								<CheckIcon className="absolute right-2.5 size-3.5 text-primary" />
							) : null}
						</TabsTrigger>
						<TabsTrigger value="KNOWLEDGE" className="gap-2">
							<BookOpenIcon className="size-4" />
							{t("overlay.tabKnowledge")}
							<Badge variant="outline" className="ml-1">
								{knowledge.length}
							</Badge>
						</TabsTrigger>
						<TabsTrigger value="TOOLBOX" className="gap-2">
							<HammerIcon className="size-4" />
							{t("overlay.tabToolbox")}
							<Badge variant="outline" className="ml-1">
								{toolbox.length}
							</Badge>
						</TabsTrigger>
					</TabsList>

					<TabsContent
						value="AGENT"
						className="flex min-h-0 flex-1 flex-col"
					>
						{activeTab === "AGENT" &&
							(agentEditable ? (
								<AgentSelector
									value={workspaceDraft}
									onChange={setWorkspaceDraft}
								/>
							) : (
								<div className="flex flex-col gap-3">
									<div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
										<InfoIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
										<span className="text-muted-foreground">
											{t("overlay.agentReadOnlyNote")}
										</span>
									</div>
									{workspaceDraft && (
										<div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
											<ComputerIcon className="size-5 shrink-0 text-muted-foreground" />
											<div className="min-w-0 flex-1">
												<div className="truncate font-medium text-sm">
													{workspaceDraft.name ||
														workspaceDraft.workspace_id}
												</div>
											</div>
										</div>
									)}
								</div>
							))}
					</TabsContent>
					<TabsContent
						value="KNOWLEDGE"
						className="flex min-h-0 flex-1 flex-col"
					>
						{activeTab === "KNOWLEDGE" && (
							<MCPSelector
								type="KNOWLEDGE"
								values={knowledge}
								onChange={setKnowledge}
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
							/>
						)}
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="ghost" onClick={() => onClose()}>
						{t("buttons.cancel")}
					</Button>
					<Button
						variant="default"
						onClick={() =>
							onClose({
								mcp: [...knowledge, ...toolbox],
								workspace: workspaceDraft,
							})
						}
					>
						{t("buttons.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
