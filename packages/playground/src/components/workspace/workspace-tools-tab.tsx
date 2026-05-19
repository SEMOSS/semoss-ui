import {
	Archive,
	Bolt,
	Bot,
	ChevronLeft,
	ChevronRight,
	Database,
	Globe,
	LayoutGrid,
	Loader2,
	Search,
	ShieldCheck,
	Sigma,
	Wrench,
} from "lucide-react";
import { type ComponentType, useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	cn,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	toast,
	useDebouncedValue,
} from "@semoss/ui/next";
import type { MCPTool, ProjectDependency } from "@/types";

interface ParamSchema {
	type?: string;
	description?: string;
	enum?: string[];
	default?: unknown;
	minimum?: number;
	maximum?: number;
	items?: { type?: string };
	format?: string;
}

const ENGINE_CONFIG: Record<
	string,
	{ label: string; Icon: ComponentType<{ className?: string }> }
> = {
	PROJECT: { label: "Project", Icon: LayoutGrid },
	MODEL: { label: "Model", Icon: Bot },
	DATABASE: { label: "Database", Icon: Database },
	VECTOR: { label: "Vector", Icon: Bolt },
	FUNCTION: { label: "Function", Icon: Sigma },
	STORAGE: { label: "Storage", Icon: Archive },
	GUARDRAIL: { label: "Guardrail", Icon: ShieldCheck },
	REMOTE: { label: "Remote", Icon: Globe },
};

const ENGINE_TYPE_ORDER = [
	"PROJECT",
	"MODEL",
	"DATABASE",
	"VECTOR",
	"FUNCTION",
	"STORAGE",
	"GUARDRAIL",
	"REMOTE",
];

export interface WorkspaceToolsTabProps {
	workspaceId: string;
	search: string;
}

export const WorkspaceToolsTab = ({
	workspaceId,
	search,
}: WorkspaceToolsTabProps) => {
	const { t } = useTranslation("workspace");

	const [selectedEngine, setSelectedEngine] =
		useState<ProjectDependency | null>(null);
	const [collapsedTypes, setCollapsedTypes] = useState<Set<string>>(
		new Set(),
	);
	const [toolSearch, setToolSearch] = useState("");
	const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
	const debouncedToolSearch = useDebouncedValue(toolSearch);

	const getDependencies = usePixel<{
		engines: ProjectDependency[];
		dependencies: string[];
	}>(
		workspaceId
			? `GetProjectDependencies(project=["${workspaceId}"]);`
			: "",
		{
			onError: (_d, e) => {
				toast.error(
					t("mcp.failedToLoad") +
						`: ${e instanceof Error ? e.message : "Unknown error"}`,
				);
			},
		},
	);

	const getTools = usePixel<{ tools: MCPTool[] }>(
		selectedEngine
			? `GetMCPTools(engine=["${selectedEngine.engine_id}"]);`
			: "",
		{ data: { tools: [] } },
	);

	const groupedEngines = useMemo(() => {
		const topLevelIds = getDependencies.data?.dependencies || [];
		const allEngines = getDependencies.data?.engines || [];
		const topLevel = allEngines.filter((e) =>
			topLevelIds.includes(e.engine_id),
		);

		const searched = search
			? topLevel.filter(
					(e) =>
						e.engine_name
							.toLowerCase()
							.includes(search.toLowerCase()) ||
						e.engine_id
							.toLowerCase()
							.includes(search.toLowerCase()),
				)
			: topLevel;

		const groups: Record<string, ProjectDependency[]> = {};
		for (const engine of searched) {
			if (!groups[engine.engine_type]) groups[engine.engine_type] = [];
			groups[engine.engine_type].push(engine);
		}

		const orderedTypes = [
			...ENGINE_TYPE_ORDER.filter((t) => groups[t]?.length),
			...Object.keys(groups).filter(
				(t) => !ENGINE_TYPE_ORDER.includes(t) && groups[t]?.length,
			),
		];

		return orderedTypes.map((type) => ({
			type,
			engines: groups[type],
			config: ENGINE_CONFIG[type] ?? { label: type, Icon: Wrench },
		}));
	}, [getDependencies.data, search]);

	const filteredTools = useMemo(() => {
		const tools = getTools.data?.tools ?? [];
		if (!debouncedToolSearch) return tools;
		const q = debouncedToolSearch.toLowerCase();
		return tools.filter(
			(tool) =>
				(tool.title || tool.name).toLowerCase().includes(q) ||
				tool.description?.toLowerCase().includes(q),
		);
	}, [getTools.data, debouncedToolSearch]);

	const totalEngines = getDependencies.data?.dependencies?.length ?? 0;

	return (
		<div className="flex h-full w-full overflow-hidden">
			{/* Left panel: engine list */}
			<div className="flex w-64 shrink-0 flex-col border-border border-r">
				{getDependencies.status === "LOADING" ? (
					<div className="flex h-full items-center justify-center">
						<Loader2 className="size-5 animate-spin text-muted-foreground" />
					</div>
				) : groupedEngines.length === 0 ? (
					<div className="flex h-full items-center justify-center p-4 text-center">
						<Muted>{t("tools.noConnections")}</Muted>
					</div>
				) : (
					<ScrollArea className="flex-1">
						<div className="py-2">
							{groupedEngines.map(({ type, engines, config }) => {
								const { label, Icon } = config;
								const isCollapsed = collapsedTypes.has(type);
								return (
									<div key={type}>
										<button
											type="button"
											onClick={() =>
												setCollapsedTypes((prev) => {
													const next = new Set(prev);
													next.has(type)
														? next.delete(type)
														: next.add(type);
													return next;
												})
											}
											className="flex w-full items-center gap-2 px-3 py-1.5 hover:bg-accent"
										>
											<Icon className="size-3.5 shrink-0 text-muted-foreground" />
											<span className="flex-1 text-left font-medium text-muted-foreground text-sm uppercase tracking-wide">
												{label}
											</span>
											<Badge
												variant="secondary"
												className="h-4 px-1 text-xs"
											>
												{engines.length}
											</Badge>
											<ChevronRight
												className={cn(
													"size-3.5 shrink-0 text-muted-foreground transition-transform",
													!isCollapsed && "rotate-90",
												)}
											/>
										</button>
										{!isCollapsed &&
											engines.map((engine) => (
												<button
													key={engine.engine_id}
													type="button"
													onClick={() => {
														setSelectedEngine(
															engine,
														);
														setSelectedTool(null);
														setToolSearch("");
													}}
													className={cn(
														"flex w-full items-center px-4 py-2 text-left text-sm transition-colors hover:bg-accent",
														selectedEngine?.engine_id ===
															engine.engine_id &&
															"bg-primary/10 font-medium text-primary",
													)}
												>
													<span className="flex-1 truncate">
														{engine.engine_name}
													</span>
												</button>
											))}
									</div>
								);
							})}
						</div>
					</ScrollArea>
				)}
			</div>

			{/* Right panel */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{!selectedEngine ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
						<Wrench className="size-8 text-muted-foreground/40" />
						<p className="font-medium text-muted-foreground text-sm">
							{t("tools.selectConnection")}
						</p>
						<p className="text-muted-foreground/60 text-xs">
							{t("tools.selectConnectionDescription", {
								count: totalEngines,
							})}
						</p>
					</div>
				) : selectedTool ? (
					<ToolDetail
						tool={selectedTool}
						onBack={() => setSelectedTool(null)}
						t={t}
					/>
				) : (
					<>
						{/* Engine header + search */}
						<div className="flex flex-col gap-3 border-border border-b p-4">
							<div className="flex items-center gap-2">
								{(() => {
									const config =
										ENGINE_CONFIG[
											selectedEngine.engine_type
										];
									const Icon = config?.Icon ?? Wrench;
									return (
										<Icon className="size-4 shrink-0 text-muted-foreground" />
									);
								})()}
								<span className="font-semibold text-sm">
									{selectedEngine.engine_name}
								</span>
								<Badge
									variant="outline"
									className="ml-auto text-xs"
								>
									{ENGINE_CONFIG[selectedEngine.engine_type]
										?.label ?? selectedEngine.engine_type}
								</Badge>
							</div>
							<InputGroup className="bg-background">
								<InputGroupInput
									placeholder={t("tools.searchTools")}
									value={toolSearch}
									onChange={(e) =>
										setToolSearch(e.target.value)
									}
								/>
								<InputGroupAddon>
									<Search className="size-4" />
								</InputGroupAddon>
							</InputGroup>
						</div>

						{/* Tool list */}
						{getTools.status === "LOADING" ||
						getTools.status === "INITIAL" ? (
							<div className="flex flex-1 items-center justify-center">
								<Loader2 className="size-6 animate-spin text-muted-foreground" />
							</div>
						) : getTools.status === "ERROR" ? (
							<div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
								<p className="font-semibold text-destructive text-sm">
									{t("tools.loadFailed")}
								</p>
								<p className="text-muted-foreground text-xs">
									{t("tools.loadFailedDescription")}
								</p>
							</div>
						) : filteredTools.length === 0 ? (
							<div className="flex flex-1 items-center justify-center">
								<Muted className="text-sm">
									{debouncedToolSearch
										? t("tools.noToolsMatchSearch")
										: t("tools.noTools")}
								</Muted>
							</div>
						) : (
							<ScrollArea className="flex-1">
								<div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
									{filteredTools.map((tool) => (
										<button
											key={tool.name}
											type="button"
											onClick={() =>
												setSelectedTool(tool)
											}
											className="space-y-1.5 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:shadow-sm"
										>
											<div className="font-semibold text-sm leading-tight">
												{tool.title || tool.name}
											</div>
											{tool.description && (
												<p className="line-clamp-2 text-muted-foreground text-xs">
													{tool.description}
												</p>
											)}
										</button>
									))}
								</div>
							</ScrollArea>
						)}
					</>
				)}
			</div>
		</div>
	);
};

interface ToolDetailProps {
	tool: MCPTool;
	onBack: () => void;
	t: (key: string, options?: Record<string, unknown>) => string;
}

const ToolDetail = ({ tool, onBack, t }: ToolDetailProps) => {
	const params = Object.entries(tool.inputSchema?.properties ?? {}) as [
		string,
		ParamSchema,
	][];
	const required = tool.inputSchema?.required ?? [];
	const executionMode = tool._meta?.SMSS_MCP_EXECUTION;
	const displayLocation = tool._meta?.SMSS_MCP_UI?.displayLocation;

	return (
		<>
			{/* Header */}
			<div className="flex shrink-0 items-center gap-3 border-border border-b p-4">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					<ChevronLeft className="size-4" />
					{t("tools.back")}
				</button>
			</div>

			<ScrollArea className="flex-1">
				<div className="space-y-6 p-6">
					{/* Title + description */}
					<div className="space-y-2">
						<h2 className="font-semibold text-base leading-tight">
							{tool.title || tool.name}
						</h2>
						{tool.description ? (
							<p className="text-muted-foreground text-sm">
								{tool.description}
							</p>
						) : (
							<p className="text-muted-foreground/60 text-sm italic">
								{t("tools.noDescription")}
							</p>
						)}
					</div>

					{/* Parameters */}
					<div className="space-y-3">
						<h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
							{t("tools.parameters", { count: params.length })}
						</h3>
						{params.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								{t("tools.noParams")}
							</p>
						) : (
							<div className="space-y-2">
								{params.map(([name, schema]) => {
									const isRequired = required.includes(name);
									return (
										<div
											key={name}
											className="space-y-1 rounded-md border border-border p-3"
										>
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-mono font-semibold text-sm">
													{name}
												</span>
												{schema.type && (
													<Badge
														variant="outline"
														className="text-xs"
													>
														{schema.type}
														{schema.items?.type
															? `<${schema.items.type}>`
															: ""}
													</Badge>
												)}
												{schema.enum && (
													<Badge
														variant="outline"
														className="text-xs"
													>
														enum
													</Badge>
												)}
												<Badge
													variant={
														isRequired
															? "secondary"
															: "outline"
													}
													className={cn(
														"ml-auto text-xs",
														!isRequired &&
															"text-muted-foreground",
													)}
												>
													{isRequired
														? t("tools.required")
														: t("tools.optional")}
												</Badge>
											</div>
											{schema.description && (
												<p className="text-muted-foreground text-xs">
													{schema.description}
												</p>
											)}
											{schema.enum && (
												<div className="flex flex-wrap gap-1 pt-1">
													{schema.enum.map((v) => (
														<Badge
															key={v}
															variant="secondary"
															className="font-mono text-xs"
														>
															{v}
														</Badge>
													))}
												</div>
											)}
											{(schema.minimum !== undefined ||
												schema.maximum !==
													undefined) && (
												<p className="text-muted-foreground text-xs">
													{schema.minimum !==
														undefined &&
														`Min: ${schema.minimum}`}
													{schema.minimum !==
														undefined &&
														schema.maximum !==
															undefined &&
														" · "}
													{schema.maximum !==
														undefined &&
														`Max: ${schema.maximum}`}
												</p>
											)}
											{schema.default !== undefined && (
												<p className="text-muted-foreground text-xs">
													Default:{" "}
													<span className="font-mono">
														{String(schema.default)}
													</span>
												</p>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Execution metadata */}
					{(executionMode || displayLocation) && (
						<div className="space-y-3">
							<h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
								{t("tools.execution")}
							</h3>
							<div className="space-y-2 rounded-md border border-border p-3">
								{executionMode && (
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground text-xs">
											{t("tools.executionMode")}
										</span>
										<Badge
											variant="secondary"
											className="text-xs"
										>
											{executionMode}
										</Badge>
									</div>
								)}
								{displayLocation && (
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground text-xs">
											{t("tools.displayLocation")}
										</span>
										<Badge
											variant="secondary"
											className="text-xs"
										>
											{displayLocation}
										</Badge>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</ScrollArea>
		</>
	);
};
