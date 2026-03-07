import {
	AlertCircle,
	ImageIcon,
	SquareArrowOutUpRightIcon,
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
import { AppToolSection } from "./app-tool-section";
import {
	type EffectivePermission,
	PERMISSION_VARIANT,
	type ProjectDependency,
} from "./workspace-permissions";

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

/**
 * Renders the list of MCP apps and their individual tools for a workspace.
 * Knowledge tab uses a card grid; Toolbox tab uses a tool drill-down list.
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

	const filteredDeps = useMemo(() => {
		const byType =
			getDependencies.data?.filter((m) =>
				type === "TOOLBOX"
					? m.engine_type !== "VECTOR"
					: m.engine_type === "VECTOR",
			) || [];
		// Knowledge tab filters search inline; Toolbox delegates to AppToolSection
		if (type === "KNOWLEDGE" && search) {
			return byType.filter(
				(m) =>
					m.engine_id.toLowerCase().includes(search.toLowerCase()) ||
					m.engine_name.toLowerCase().includes(search.toLowerCase()),
			);
		}
		return byType;
	}, [getDependencies.data, type, search]);

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

	if (type === "KNOWLEDGE") {
		return (
			<ScrollArea className="h-full w-full">
				<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredDeps.map((m) => {
						const { effectivePermission, label } =
							getEffectivePermission(m);
						const accessMissing =
							effectivePermission === "REQUESTED" ||
							effectivePermission === "DISCOVERABLE" ||
							effectivePermission === "FULLY_PRIVATE";
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
														className={`-m-2 shrink-0 ${
															accessMissing
																? "text-destructive"
																: ""
														}`}
														asChild
													>
														<a
															target="_blank"
															href={mcpToPlatformUrl(
																m,
															)}
														>
															<SquareArrowOutUpRightIcon className="size-4" />
														</a>
													</Button>
												)}
											</TooltipTrigger>
											<TooltipContent>
												{accessMissing
													? t("mcp.tooltipNoAccess", {
															type: "knowledge base",
														})
													: t("mcp.tooltipOpen", {
															type: "knowledge base",
														})}
											</TooltipContent>
										</Tooltip>
									</div>

									{/* Image & Details */}
									<div className="flex items-center gap-3">
										{effectivePermission ===
										"FULLY_PRIVATE" ? (
											<div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-border border-dashed bg-muted/50">
												<ImageIcon className="size-6 text-muted-foreground" />
											</div>
										) : (
											<img
												src={`${import.meta.env.MODULE}/api/e-${m.engine_id}/image/download`}
												alt={m.engine_name}
												className="size-16 shrink-0 rounded-md object-cover object-center"
											/>
										)}

										<div className="flex flex-1 flex-col gap-2">
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
													{t(
														"mcp.requestAccessButton",
													)}
												</Button>
											) : (
												<Badge
													variant={
														PERMISSION_VARIANT[
															effectivePermission
														]
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
										{m.description ||
											t("mcp.noDescription")}
									</div>

									{m.tags?.length > 0 && (
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
