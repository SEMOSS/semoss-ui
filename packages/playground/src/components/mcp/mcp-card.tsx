import {
	AlertCircle,
	CheckIcon,
	ImageIcon,
	LockIcon,
	SquareArrowOutUpRightIcon,
	TriangleAlert,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Button,
	Card,
	CardContent,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import type { MCP } from "@/types";
import { toSentenceCase } from "@/utility";
import { getMcpTypeIcon, mcpToPlatformUrl } from "./utility";

export interface MCPCardProps {
	m: MCP;
	type?: "TOOLBOX" | "KNOWLEDGE";
	effectivePermission?:
		| "READ_ONLY"
		| "EDIT"
		| "OWNER"
		| "REQUESTED"
		| "DISCOVERABLE"
		| "FULLY_PRIVATE";
	missingSubDependencies?: boolean;
	handleRequestAccess?: () => void;
	onClick?: () => void;
	selected?: boolean;
	/**
	 * If true, the MCP was inherited from the room's agent and can't be
	 * removed here — the card renders with a "From agent" badge and no
	 * click affordance.
	 */
	fromWorkspace?: boolean;
}

export const MCPCard = ({
	m,
	type,
	effectivePermission,
	missingSubDependencies,
	handleRequestAccess,
	onClick,
	selected,
	fromWorkspace,
}: MCPCardProps) => {
	const { root } = useRoot();
	const { t } = useTranslation(["mcp", "common", "workspace"]);
	const effectiveOnClick = fromWorkspace ? undefined : onClick;
	const TypeIcon = getMcpTypeIcon(m.type);

	const accessMissing =
		effectivePermission === "REQUESTED" ||
		effectivePermission === "DISCOVERABLE" ||
		effectivePermission === "FULLY_PRIVATE";

	const tooltipType = type === "TOOLBOX" ? "toolbox" : "knowledge base";
	const showPlatformLink = !!root.theme.featureFlags?.showPlatformLinks;

	const permissionLabel = ((): string => {
		switch (effectivePermission) {
			case "OWNER":
				return t("workspace:members.owner");
			case "EDIT":
				return t("workspace:members.editor");
			case "READ_ONLY":
				return t("workspace:members.readOnly");
			case "REQUESTED":
				return t("permission.accessRequested");
			case "DISCOVERABLE":
				return t("permission.requestAccess");
			case "FULLY_PRIVATE":
				return t("permission.noAccess");
			default:
				return "";
		}
	})();

	return (
		<Card
			className={cn(
				"p-0 transition-colors",
				accessMissing && "border-destructive/50 border-dashed",
				effectiveOnClick && "cursor-pointer hover:bg-muted/30",
				fromWorkspace && "cursor-not-allowed",
			)}
			onClick={effectiveOnClick}
		>
			<CardContent className="flex flex-col gap-2 p-3">
				{/* Row 1: external link + warning icons + permission name on
				    the left; the selection / lock indicator on the right. */}
				<div className="flex items-center gap-2">
					<div className="flex min-w-0 flex-1 items-center gap-1.5">
						{showPlatformLink ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<a
										target="_blank"
										rel="noopener noreferrer"
										href={mcpToPlatformUrl(m)}
										onClick={(event) =>
											event.stopPropagation()
										}
										className="text-muted-foreground hover:text-foreground"
									>
										<SquareArrowOutUpRightIcon className="size-4" />
									</a>
								</TooltipTrigger>
								<TooltipContent>
									{t("permission.tooltipOpen", {
										type: tooltipType,
									})}
								</TooltipContent>
							</Tooltip>
						) : null}

						{effectivePermission === "FULLY_PRIVATE" ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<AlertCircle className="size-4 cursor-help text-destructive" />
								</TooltipTrigger>
								<TooltipContent>
									{t("permission.tooltipNoAccess", {
										type: tooltipType,
									})}
								</TooltipContent>
							</Tooltip>
						) : null}

						{(missingSubDependencies || accessMissing) &&
						effectivePermission !== "FULLY_PRIVATE" ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<TriangleAlert
										className={cn(
											"size-4 cursor-help",
											accessMissing
												? "text-destructive"
												: "text-amber-500",
										)}
									/>
								</TooltipTrigger>
								<TooltipContent>
									{accessMissing
										? t("permission.tooltipNoAccess", {
												type: tooltipType,
											})
										: t(
												"permission.tooltipMissingDependencies",
												{
													type: tooltipType,
												},
											)}
								</TooltipContent>
							</Tooltip>
						) : null}

						{permissionLabel ? (
							<span className="text-[10px] text-muted-foreground capitalize">
								{permissionLabel}
							</span>
						) : null}
					</div>
					<div className="flex shrink-0 items-center gap-1.5">
						{/* Right-most slot: a combined "lock + From agent" badge
						    when the MCP is inherited (one visual ties the
						    locked state to the source agent), otherwise a
						    checkbox — empty when unselected, filled primary
						    with a check when selected. */}
						{fromWorkspace ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<Badge
										variant="outline"
										className="h-5 cursor-help gap-1 border-primary px-1.5 text-[10px] text-primary"
									>
										<LockIcon className="size-3" />
										{t("common:badges.fromAgent")}
									</Badge>
								</TooltipTrigger>
								<TooltipContent>
									{t(
										"common:tooltips.cannotDeleteWorkspaceMCPs",
									)}
								</TooltipContent>
							</Tooltip>
						) : (
							<div
								className={cn(
									"flex size-4 items-center justify-center rounded border transition-colors",
									selected
										? "border-primary bg-primary text-primary-foreground"
										: "border-muted-foreground/40",
								)}
							>
								{selected ? (
									<CheckIcon
										className="size-3"
										strokeWidth={3}
									/>
								) : null}
							</div>
						)}
					</div>
				</div>

				{/* Row 2: image + (name on top, type below) + request access.
				    The title sits next to the brand image where the visual
				    association is strongest; type tucks under as metadata. */}
				<div className="flex items-center gap-2">
					{effectivePermission === "FULLY_PRIVATE" ? (
						<div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border border-dashed bg-muted/50">
							<ImageIcon className="size-4 text-muted-foreground" />
						</div>
					) : (
						<img
							src={
								m.type === "PROJECT"
									? `${import.meta.env.MODULE}/api/project-${m.id}/projectImage/download`
									: `${import.meta.env.MODULE}/api/e-${m.id}/image/download`
							}
							alt={m.name}
							className="size-10 shrink-0 rounded-md object-cover object-center"
						/>
					)}

					<div className="flex min-w-0 flex-1 flex-col gap-0.5">
						<div className="wrap-break-word line-clamp-2 font-medium text-sm leading-tight">
							{m.name}
						</div>
						<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
							<TypeIcon className="size-3.5 shrink-0" />
							<span>{toSentenceCase(m.type)}</span>
						</div>
					</div>

					{effectivePermission === "DISCOVERABLE" ? (
						<Button
							size="sm"
							className="h-7 shrink-0 px-2 text-xs"
							onClick={(event) => {
								event.stopPropagation();
								handleRequestAccess?.();
							}}
						>
							{t("permission.requestAccessButton")}
						</Button>
					) : null}
				</div>

				{/* Row 3: description, full card width. */}
				<div className="wrap-break-words line-clamp-4 text-muted-foreground text-xs">
					{m.description || t("permission.noDescription")}
				</div>
			</CardContent>
		</Card>
	);
};
