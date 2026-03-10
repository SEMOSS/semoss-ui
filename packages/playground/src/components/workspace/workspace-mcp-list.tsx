import {
	AlertCircle,
	ImageIcon,
	SquareArrowOutUpRightIcon,
	TriangleAlert,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Muted,
	ScrollArea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { mcpToPlatformUrl } from "@/components";
import { toSentenceCase } from "@/utility";

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
	engine_subtype?: string;
	description?: string;
	engine_discoverable?: boolean;
	permission_name?: "READ_ONLY" | "EDIT" | "OWNER";
	engine_global?: boolean;
	access_permission?: number; // The permission level the user has requested, if any
	tags?: string; // comma separated tags
	can_view_dependencies?: boolean;
	engine_date_created?: string;
	dependencies?: string[]; // Array of dependency engine IDs
}

/**
 * Renders a card representing a workspace
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

	const getDependencies = usePixel<{
		engines: ProjectDependency[];
		dependencies: string[]; // Top-level dependency IDs
	}>(
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

	const searchedMCP = useMemo(() => {
		// Filter engines to get only top-level dependencies
		const topLevelIds = getDependencies.data?.dependencies || [];
		const allEngines = getDependencies.data?.engines || [];
		const topLevelDeps = allEngines.filter((engine) =>
			topLevelIds.includes(engine.engine_id),
		);
		const dataWithType = topLevelDeps.filter((m) =>
			type === "TOOLBOX"
				? m.engine_type !== "VECTOR"
				: m.engine_type === "VECTOR",
		);
		if (!search) {
			return dataWithType;
		}
		return dataWithType.filter(
			(m) =>
				m.engine_id.toLowerCase().includes(search.toLowerCase()) ||
				m.engine_name.toLowerCase().includes(search.toLowerCase()),
		);
	}, [getDependencies.data, search, type]);

	if (searchedMCP.length === 0) {
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

	const getEffectivePermission = (
		m: ProjectDependency,
	): {
		effectivePermission:
			| "READ_ONLY"
			| "EDIT"
			| "OWNER"
			| "REQUESTED"
			| "DISCOVERABLE"
			| "FULLY_PRIVATE";
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

	return (
		<ScrollArea className="h-full w-full">
			<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
				{searchedMCP.map((m) => {
					const { effectivePermission, label } =
						getEffectivePermission(m);

					const accessMissing =
						effectivePermission === "REQUESTED" ||
						effectivePermission === "DISCOVERABLE" ||
						effectivePermission === "FULLY_PRIVATE";
					const missingSubDependencies =
						m.can_view_dependencies === false;
					return (
						<Card
							key={m.engine_id}
							className={`col-span-1 p-0 ${
								accessMissing
									? "border-destructive/50 border-dashed"
									: ""
							}`}
						>
							<CardContent className="space-y-2 p-4">
								{/* Title & Open Button */}
								<div className="flex items-start justify-between gap-2">
									<div className="wrap-break-word min-w-0 flex-1 font-semibold text-sm leading-tight">
										{m.engine_name}
									</div>
									<Tooltip>
										<TooltipTrigger asChild>
											{effectivePermission ===
											"FULLY_PRIVATE" ? (
												<AlertCircle className="size-4 shrink-0 cursor-help text-destructive" />
											) : (
												<Button
													variant="ghost"
													size="icon"
													className={`-m-2 shrink-0 ${accessMissing || missingSubDependencies ? "w-auto px-2" : ""}`}
													asChild
												>
													<a
														target="_blank"
														href={mcpToPlatformUrl(
															m,
														)}
														className="flex items-center gap-1"
													>
														{(missingSubDependencies ||
															accessMissing) && (
															<TriangleAlert
																className={`size-4 ${accessMissing ? "text-destructive" : "text-amber-500"}`}
															/>
														)}
														<SquareArrowOutUpRightIcon className="size-4" />
													</a>
												</Button>
											)}
										</TooltipTrigger>
										<TooltipContent>
											{accessMissing
												? t("mcp.tooltipNoAccess", {
														type:
															type === "TOOLBOX"
																? "toolbox"
																: "knowledge base",
													})
												: missingSubDependencies
													? t(
															"mcp.tooltipMissingDependencies",
															{
																type:
																	type ===
																	"TOOLBOX"
																		? "toolbox"
																		: "knowledge base",
															},
														)
													: t("mcp.tooltipOpen", {
															type:
																type ===
																"TOOLBOX"
																	? "toolbox"
																	: "knowledge base",
														})}
										</TooltipContent>
									</Tooltip>
								</div>

								{/* Image & Details */}
								<div className="flex items-center gap-3">
									{/* Image Placeholder */}
									{effectivePermission === "FULLY_PRIVATE" ? (
										<div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border border-dashed bg-muted/50">
											<ImageIcon className="size-6 text-muted-foreground" />
										</div>
									) : (
										<img
											src={
												m.engine_type === "PROJECT"
													? `${import.meta.env.MODULE}/api/project-${m.engine_id}/projectImage/download`
													: `${import.meta.env.MODULE}/api/e-${m.engine_id}/image/download`
											}
											alt={m.engine_name}
											className="size-16 shrink-0 rounded-md object-cover object-center"
										/>
									)}

									{/* Type & Permission */}
									<div className="flex flex-1 flex-col gap-2">
										{/* Type */}
										<Badge
											variant="outline"
											className="w-fit"
										>
											{toSentenceCase(m.engine_type)}
										</Badge>

										{effectivePermission ===
										"DISCOVERABLE" ? (
											<Button
												size="sm"
												className="h-fit w-fit px-2 py-1 text-xs"
												onClick={() =>
													handleRequestAccess(m)
												}
											>
												{t("mcp.requestAccessButton")}
											</Button>
										) : (
											<Badge
												variant={
													{
														OWNER: "default",
														EDIT: "secondary",
														READ_ONLY: "outline",
														REQUESTED: "outline",
														FULLY_PRIVATE:
															"destructive",
													}[effectivePermission] as
														| "default"
														| "secondary"
														| "outline"
														| "destructive"
												}
												className="w-fit"
											>
												{label}
											</Badge>
										)}
									</div>
								</div>

								{/* Description */}
								<div className="text-muted-foreground text-xs">
									{m.description || t("mcp.noDescription")}
								</div>
								{m.tags?.length && (
									<div className="flex flex-wrap gap-1">
										{m.tags.split(",").map((tag) => (
											<Badge
												key={tag}
												variant="secondary"
												className="text-xs"
											>
												{tag}
											</Badge>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</ScrollArea>
	);
};
