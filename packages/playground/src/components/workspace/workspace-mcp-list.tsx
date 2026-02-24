import {
	AlertCircle,
	SquareArrowOutUpRightIcon,
	WrenchIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Muted,
	ScrollArea,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { mcpToPlatformUrl } from "@/components";
import type { MCPTool } from "@/types";
import { toSentenceCase } from "@/utility";

const SHOW_MCP_LINK = import.meta.env.VITE_SHOW_MCP_LINK !== "false";

export interface WorkspaceMCPListProps {
	/**
	 * Type of mcp
	 */
	type: "TOOLBOX" | "KNOWLEDGE";

	/**
	 * WorkspaceId
	 */
	workspaceId: string;

	/**
	 * Search the mcps by name
	 */
	search: string;
}

interface ProjectDependency {
	engine_type:
		| "PROJECT"
		| "STORAGE"
		| "DATABASE"
		| "FUNCTION"
		| "MODEL"
		| "VECTOR";
	engine_id: string;
	engine_name: string;
	description?: string;
	engine_discoverable?: boolean;
	permission_name?: "READ_ONLY" | "EDIT" | "OWNER";
	engine_global?: boolean;
	access_permission?: number;
	tags: string; // comma separated tags
}

type EffectivePermission =
	| "READ_ONLY"
	| "EDIT"
	| "OWNER"
	| "REQUESTED"
	| "DISCOVERABLE"
	| "FULLY_PRIVATE";

const PERMISSION_VARIANT: Record<
	EffectivePermission,
	"default" | "secondary" | "outline" | "destructive"
> = {
	OWNER: "default",
	EDIT: "secondary",
	READ_ONLY: "outline",
	REQUESTED: "outline",
	DISCOVERABLE: "outline",
	FULLY_PRIVATE: "destructive",
};

interface AppToolSectionProps {
	dep: ProjectDependency;
	search: string;
	effectivePermission: EffectivePermission;
	label: string;
	type: "TOOLBOX" | "KNOWLEDGE";
	onRequestAccess: (m: ProjectDependency) => void;
}

/**
 * Renders a single app's MCP tools as a collapsible section.
 * Has its own usePixel call so each app loads independently.
 */
const AppToolSection = ({
	dep,
	search,
	effectivePermission,
	label,
	type,
	onRequestAccess,
}: AppToolSectionProps) => {
	const { t } = useTranslation("workspace");

	const hasAccess =
		effectivePermission === "READ_ONLY" ||
		effectivePermission === "EDIT" ||
		effectivePermission === "OWNER";

	const getTools = usePixel<{ tools: MCPTool[] }>(
		hasAccess ? `GetMCPTools("${dep.engine_id}");` : "",
		{ data: { tools: [] } },
	);

	const appNameMatches = useMemo(
		() =>
			!search ||
			dep.engine_name.toLowerCase().includes(search.toLowerCase()),
		[dep.engine_name, search],
	);

	const filteredTools = useMemo(() => {
		const tools = getTools.data?.tools || [];
		// If no search, or if the app name itself matches, show all tools
		if (!search || appNameMatches) return tools;
		return tools.filter(
			(tool) =>
				(tool.title || tool.name)
					.toLowerCase()
					.includes(search.toLowerCase()) ||
				(tool.description || "")
					.toLowerCase()
					.includes(search.toLowerCase()),
		);
	}, [getTools.data, search, appNameMatches]);

	// Hide section if searching and nothing matches (only after tools have loaded)
	if (
		hasAccess &&
		search &&
		!appNameMatches &&
		getTools.status === "SUCCESS" &&
		filteredTools.length === 0
	) {
		return null;
	}

	const accessMissing =
		effectivePermission === "REQUESTED" ||
		effectivePermission === "DISCOVERABLE" ||
		effectivePermission === "FULLY_PRIVATE";

	return (
		<div
			className={`rounded-lg border ${
				accessMissing
					? "border-destructive/50 border-dashed"
					: "border-border"
			}`}
		>
			{/* Section header */}
			<div className="flex items-center gap-2 border-b px-4 py-2">
				<div className="min-w-0 flex-1">
					<span className="truncate font-semibold text-sm">
						{dep.engine_name}
					</span>
				</div>

				<Badge variant="outline" className="shrink-0 text-xs">
					{toSentenceCase(dep.engine_type)}
				</Badge>

				{effectivePermission === "DISCOVERABLE" ? (
					<Button
						size="sm"
						className="h-fit shrink-0 px-2 py-1 text-xs"
						onClick={() => onRequestAccess(dep)}
					>
						{label}
					</Button>
				) : (
					<Badge
						variant={PERMISSION_VARIANT[effectivePermission]}
						className="shrink-0 text-xs"
					>
						{label}
					</Badge>
				)}

				{SHOW_MCP_LINK &&
					(effectivePermission === "FULLY_PRIVATE" ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<AlertCircle className="size-4 shrink-0 cursor-help text-destructive" />
							</TooltipTrigger>
							<TooltipContent>
								{t("mcp.tooltipNoAccess", {
									type:
										type === "TOOLBOX"
											? "toolbox"
											: "knowledge base",
								})}
							</TooltipContent>
						</Tooltip>
					) : (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className={`-mr-2 size-8 shrink-0 ${
										accessMissing ? "text-destructive" : ""
									}`}
									asChild
								>
									<a
										target="_blank"
										href={mcpToPlatformUrl(dep)}
									>
										<SquareArrowOutUpRightIcon className="size-4" />
									</a>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t("mcp.tooltipOpen", {
									type:
										type === "TOOLBOX"
											? "toolbox"
											: "knowledge base",
								})}
							</TooltipContent>
						</Tooltip>
					))}
			</div>

			{/* Tools body */}
			{!hasAccess ? (
				<p className="px-4 py-3 text-muted-foreground text-sm italic">
					{label}
				</p>
			) : getTools.status === "LOADING" ||
				getTools.status === "INITIAL" ? (
				<div className="space-y-3 p-4">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
					<Skeleton className="h-4 w-2/3" />
				</div>
			) : filteredTools.length > 0 ? (
				<ul className="divide-y divide-border">
					{filteredTools.map((tool) => (
						<li
							key={tool.name}
							className="flex items-start gap-3 px-4 py-3"
						>
							<WrenchIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<div className="font-medium text-sm leading-snug">
									{tool.title || tool.name}
								</div>
								{tool.description && (
									<div className="mt-0.5 text-muted-foreground text-xs">
										{tool.description}
									</div>
								)}
							</div>
						</li>
					))}
				</ul>
			) : (
				<p className="px-4 py-3 text-muted-foreground text-sm italic">
					{t("mcp.noDescription")}
				</p>
			)}
		</div>
	);
};

/**
 * Renders the list of MCP apps and their individual tools for a workspace.
 *
 * @component
 */
export const WorkspaceMCPList = ({
	type,
	workspaceId,
	search,
}: WorkspaceMCPListProps) => {
	const { t } = useTranslation("workspace");
	const { actions } = useInsight();

	const getDependencies = usePixel<ProjectDependency[]>(
		workspaceId
			? `GetProjectDependencies(project=["${workspaceId}"]);`
			: "",
		{
			data: null,
			onError: (_d, e) => {
				toast.error(
					t("mcp.failedToLoad") +
						`: ${e instanceof Error ? e.message : "Unknown error"}`,
				);
			},
		},
	);

	// Filter by type only — search is handled per-section in AppToolSection
	const filteredDeps = useMemo(() => {
		return (
			getDependencies.data?.filter((m) =>
				type === "TOOLBOX"
					? m.engine_type !== "VECTOR"
					: m.engine_type === "VECTOR",
			) || []
		);
	}, [getDependencies.data, type]);

	const getEffectivePermission = (
		m: ProjectDependency,
	): {
		effectivePermission: EffectivePermission;
		label: string;
	} => {
		if (m.permission_name) {
			return {
				effectivePermission: m.permission_name,
				label: toSentenceCase(
					m.permission_name === "EDIT" ? "Editor" : m.permission_name,
				),
			};
		} else if (m.engine_global) {
			return {
				effectivePermission: "READ_ONLY",
				label: toSentenceCase("READ_ONLY"),
			};
		} else if (m.engine_discoverable) {
			if (typeof m.access_permission === "number") {
				return {
					effectivePermission: "REQUESTED",
					label: t("mcp.accessRequested"),
				};
			} else {
				return {
					effectivePermission: "DISCOVERABLE",
					label: t("mcp.requestAccess"),
				};
			}
		}
		return {
			effectivePermission: "FULLY_PRIVATE",
			label: t("mcp.noAccess"),
		};
	};

	const handleRequestAccess = async (m: ProjectDependency) => {
		try {
			const response = await actions.run(
				m.engine_type === "PROJECT"
					? `RequestProject(project=${JSON.stringify(
							m.engine_id,
						)}, permission=${JSON.stringify("READ_ONLY")})`
					: `RequestEngine(engine=${JSON.stringify(m.engine_id)}, permission=${JSON.stringify("READ_ONLY")})`,
			);
			if (
				response.pixelReturn.some((r) =>
					r.operationType.some((op) => op === "ERROR"),
				)
			) {
				throw new Error("Failed to request access");
			}
			toast.success(t("mcp.requestedSuccess", { name: m.engine_name }));
			getDependencies.refresh();
		} catch {
			toast.error(t("mcp.requestedFailed"));
		}
	};

	if (filteredDeps.length === 0) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Muted>
					{type === "TOOLBOX"
						? t("mcp.noToolboxes")
						: t("mcp.noKnowledge")}
				</Muted>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full w-full">
			<div className="space-y-4 p-4">
				{filteredDeps.map((m) => {
					const { effectivePermission, label } =
						getEffectivePermission(m);
					return (
						<AppToolSection
							key={m.engine_id}
							dep={m}
							search={search}
							effectivePermission={effectivePermission}
							label={label}
							type={type}
							onRequestAccess={handleRequestAccess}
						/>
					);
				})}
			</div>
		</ScrollArea>
	);
};
