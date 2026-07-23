import {
	BookOpenIcon,
	Bot,
	BotIcon,
	CheckIcon,
	HammerIcon,
	PlusIcon,
	SearchIcon,
	SquareArrowOutUpRightIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import { AppCatalogAvatar, MCPSelector, splitMcpByType } from "@semoss/shared";
import {
	Badge,
	Button,
	Card,
	CardContent,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { App, MCPConfig } from "../types";

type Tab = "AGENT" | "KNOWLEDGE" | "TOOLBOX";
export type McpOverlayOpenMode = "side" | "inline";

export interface McpOverlayWorkspaceRef {
	workspace_id: string;
	name?: string;
}

function AgentSelector({
	value,
	onChange,
}: {
	value: McpOverlayWorkspaceRef | null;
	onChange: (next: McpOverlayWorkspaceRef | null) => void;
}) {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);

	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			`META | MyProjects(${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}projectType=["WORKSPACE"], limit=[${limit}], offset=[${offset}])`,
		(response) => (response.length < 25 ? -1 : Number.POSITIVE_INFINITY),
		(response) => response,
		{ limit: 25 },
		[debouncedSearch],
	);

	const { setScroll } = useInfiniteScroll({
		disabled: getWorkspaces.isLoading || !getWorkspaces.hasMore,
		onNext: () => {
			getWorkspaces.next();
		},
	});

	function selectWorkspace(workspace: App) {
		const next: McpOverlayWorkspaceRef = {
			workspace_id: workspace.project_id,
			name: workspace.project_display_name || workspace.project_name,
		};
		onChange(value?.workspace_id === next.workspace_id ? null : next);
	}

	function getPermissionLabel(permission: number | undefined) {
		if (permission === 1) {
			return "Owner";
		}
		if (permission === 2) {
			return "Editor";
		}
		return "Read-only";
	}

	return (
		<div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
			<div className="flex w-full shrink-0 flex-row gap-2 border-border border-b bg-muted p-4">
				<div className="flex-1">
					<InputGroup className="bg-background">
						<InputGroupInput
							autoFocus
							placeholder="Search agents"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
						<InputGroupAddon>
							<SearchIcon />
						</InputGroupAddon>
					</InputGroup>
				</div>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								window.open("#/agent/new", "_blank");
							}}
							data-testid="agent-selector--create-btn"
						>
							<PlusIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Create an Agent</TooltipContent>
				</Tooltip>
			</div>

			<ScrollArea
				className="min-h-0 w-full flex-1"
				viewportRef={(element) => setScroll(element)}
			>
				{getWorkspaces.isLoading && getWorkspaces.data.length === 0 ? (
					<div className="flex h-64 w-full items-center justify-center">
						<Spinner />
					</div>
				) : null}
				{!getWorkspaces.isLoading && getWorkspaces.data.length === 0 ? (
					<div className="flex h-64 w-full items-center justify-center">
						<Muted>No agents found</Muted>
					</div>
				) : null}
				{getWorkspaces.data.length !== 0 ? (
					<>
						<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
							{getWorkspaces.data.map((workspace) => {
								const isSelected =
									value?.workspace_id ===
									workspace.project_id;
								const permissionLabel = getPermissionLabel(
									workspace.user_permission,
								);

								return (
									<Card
										key={workspace.project_id}
										onClick={() =>
											selectWorkspace(workspace)
										}
										className={cn(
											"cursor-pointer p-0 transition-colors hover:bg-muted/30",
											isSelected && "border-primary",
										)}
									>
										<CardContent className="flex flex-col gap-2 p-3">
											<div className="flex items-center gap-2">
												<div className="flex min-w-0 flex-1 items-center gap-1.5">
													<Tooltip>
														<TooltipTrigger asChild>
															<a
																href={`#/agent/${workspace.project_id}`}
																onClick={(
																	event,
																) => {
																	event.preventDefault();
																	event.stopPropagation();
																	window.open(
																		`#/agent/${workspace.project_id}`,
																		"_blank",
																	);
																}}
																className="text-muted-foreground hover:text-foreground"
															>
																<SquareArrowOutUpRightIcon className="size-4" />
															</a>
														</TooltipTrigger>
														<TooltipContent>
															Open agent page
														</TooltipContent>
													</Tooltip>
													{permissionLabel ? (
														<span className="-translate-y-px text-[10px] text-muted-foreground capitalize">
															{permissionLabel}
														</span>
													) : null}
												</div>
												<div className="flex shrink-0 items-center gap-1.5">
													<div
														className={cn(
															"flex size-4 items-center justify-center rounded border transition-colors",
															isSelected
																? "border-primary bg-primary text-primary-foreground"
																: "border-muted-foreground/40",
														)}
													>
														{isSelected ? (
															<CheckIcon
																className="size-3"
																strokeWidth={3}
															/>
														) : null}
													</div>
												</div>
											</div>

											<div className="flex items-start gap-2">
												<AppCatalogAvatar
													name={
														workspace.project_display_name ||
														workspace.project_name
													}
													className="size-10 shrink-0 rounded-md text-sm"
												/>
												<div className="flex min-w-0 flex-1 flex-col gap-0.5">
													<div className="wrap-break-word line-clamp-2 font-medium text-sm leading-tight">
														{workspace.project_display_name ||
															workspace.project_name}
													</div>
													<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
														<Bot className="size-3.5 shrink-0" />
														<span>Agent</span>
													</div>
												</div>
											</div>

											{workspace.description ? (
												<div className="wrap-break-words line-clamp-4 text-muted-foreground text-xs">
													{workspace.description}
												</div>
											) : (
												<div
													className="h-1"
													aria-hidden
												/>
											)}
										</CardContent>
									</Card>
								);
							})}
						</div>
						{getWorkspaces.isLoading ? (
							<div className="flex w-full items-center justify-center pb-4">
								<Spinner />
							</div>
						) : null}
					</>
				) : null}
			</ScrollArea>
		</div>
	);
}

export interface McpOverlayProps {
	open: boolean;
	/** Which tab is active when the overlay opens. */
	defaultTab: Tab;
	/** Presentation mode: right-side panel or centered dialog. Defaults to side. */
	openMode?: McpOverlayOpenMode;
	/** Full MCP list (both types) currently attached — the overlay splits these into its two tabs. */
	values: MCPConfig[];
	/** Current selected workspace/agent for the conversation. */
	workspace?: McpOverlayWorkspaceRef | null;
	/** Enables AGENT tab and workspace selection when true. */
	agentEditable?: boolean;
	/** Fired on Save with the combined next list; not fired on Cancel/dismiss. */
	onSave: (mcp: MCPConfig[]) => void;
	/** Optional callback fired on Save with the selected workspace/agent. */
	onSaveWorkspace?: (workspace: McpOverlayWorkspaceRef | null) => void;
	onOpenChange: (open: boolean) => void;
}

/**
 * Knowledge/Toolbox attachment dialog — ported from playground's real
 * `components/mcp/mcp-overlay.tsx`, reusing `@semoss/shared`'s real
 * `MCPSelector` directly for both tabs (already self-contained — it calls
 * `usePixel`/`useIteratorPixel` itself, same pattern `EngineSelect` already
 * uses). Presentation is intentionally dialog-only to match playground's
 * overlay instead of the previous side sheet variant.
 */
export function McpOverlay({
	open,
	defaultTab,
	values,
	workspace,
	agentEditable = false,
	onSave,
	onSaveWorkspace,
	onOpenChange,
}: McpOverlayProps) {
	const [knowledge, setKnowledge] = useState<MCPConfig[]>(
		() => splitMcpByType(values).knowledge,
	);
	const [toolbox, setToolbox] = useState<MCPConfig[]>(
		() => splitMcpByType(values).toolbox,
	);
	const [workspaceDraft, setWorkspaceDraft] =
		useState<McpOverlayWorkspaceRef | null>(workspace ?? null);
	const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

	// Reset drafts on the closed -> open transition only, so in-progress
	// edits aren't discarded by an unrelated prop change while still open.
	const wasOpen = useRef(open);
	useEffect(() => {
		if (open && !wasOpen.current) {
			const next = splitMcpByType(values);
			setKnowledge(next.knowledge);
			setToolbox(next.toolbox);
			setWorkspaceDraft(workspace ?? null);
			setActiveTab(
				defaultTab === "AGENT" && !agentEditable
					? "KNOWLEDGE"
					: defaultTab,
			);
		}
		wasOpen.current = open;
	}, [open, values, defaultTab, workspace, agentEditable]);

	const selectorContent = (
		<>
			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as Tab)}
				className="flex min-h-0 flex-1 flex-col gap-3"
			>
				<TabsList
					className={`grid h-10 w-full p-1 ${agentEditable ? "grid-cols-3" : "grid-cols-2"}`}
				>
					{agentEditable ? (
						<TabsTrigger value="AGENT" className="flex-1 gap-2">
							<BotIcon className="size-4" />
							Agent
							{workspaceDraft ? (
								<CheckIcon className="ms-1 size-3.5 text-primary" />
							) : null}
						</TabsTrigger>
					) : null}
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

				{agentEditable ? (
					<TabsContent
						value="AGENT"
						className="flex min-h-0 flex-1 flex-col"
					>
						{activeTab === "AGENT" ? (
							<AgentSelector
								value={workspaceDraft}
								onChange={setWorkspaceDraft}
							/>
						) : null}
					</TabsContent>
				) : null}

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
					onSaveWorkspace?.(workspaceDraft);
					onOpenChange(false);
				}}
			>
				Save
			</Button>
		</>
	);

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					onOpenChange(false);
				}
			}}
		>
			<DialogContent
				className="flex h-[80vh] max-h-[40rem] w-full flex-col gap-4 sm:max-w-4xl"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					(event.currentTarget as HTMLElement)
						.querySelector<HTMLElement>("input")
						?.focus();
				}}
				onCloseAutoFocus={(event) => event.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Knowledge & Tools</DialogTitle>
					<DialogDescription>
						Attach knowledge sources or tools for this conversation.
					</DialogDescription>
				</DialogHeader>
				{selectorContent}
				<DialogFooter>{actionButtons}</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
