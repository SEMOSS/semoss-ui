import {
	AlertCircle,
	CheckIcon,
	ImageIcon,
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
import type { MCP } from "../../types";
import { AppCatalogAvatar } from "../app-catalog-avatar";
import { EngineSubtypeIcon } from "../engine-subtype-icon";
import { getMcpTypeIcon } from "./mcp-utils";

/**
 * Converts a snake_case or space-separated string to Sentence case
 */
const toSentenceCase = (str: string | undefined): string | undefined => {
	if (!str) return undefined;
	const normalized = str.replace(/[_\s]+/g, " ").toLowerCase();
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

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
	/**
	 * Optional callback to generate an external platform URL for the MCP.
	 * When provided, an external link icon is shown in the card header.
	 */
	getPlatformUrl?: (mcp: MCP) => string;
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
	getPlatformUrl,
}: MCPCardProps) => {
	const { t } = useTranslation(["mcp", "common", "workspace"]);
	const effectiveOnClick = fromWorkspace ? undefined : onClick;
	const TypeIcon = getMcpTypeIcon(m.type);

	const accessMissing =
		effectivePermission === "REQUESTED" ||
		effectivePermission === "DISCOVERABLE" ||
		effectivePermission === "FULLY_PRIVATE";

	const tooltipType =
		type === "TOOLBOX"
			? t("permission.typeToolbox")
			: t("permission.typeKnowledge");
	const platformUrl = getPlatformUrl?.(m);

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
				selected && "border-primary",
			)}
			onClick={effectiveOnClick}
		>
			<CardContent className="flex flex-col gap-2 p-3">
				{/* Row 1: external link + warning icons + permission name on
				    the left; the selection / lock indicator on the right. */}
				<div className="flex items-center gap-2">
					<div className="flex min-w-0 flex-1 items-center gap-1.5">
						{platformUrl ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<a
										target="_blank"
										rel="noopener noreferrer"
										href={platformUrl}
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
							// Nudge text up 1px to optically align with the
							// icons. flex items-center centers boxes, but
							// text glyphs sit below their box's geometric
							// center (baseline metrics), so a small offset
							// is needed to match visual centerlines.
							<span className="-translate-y-px text-[10px] text-muted-foreground capitalize">
								{permissionLabel}
							</span>
						) : null}
					</div>
					<div className="flex shrink-0 items-center gap-1.5">
						{/* Right-most slot: a combined "lock + From agent" badge
						    when the MCP is inherited, a checkbox when the
						    caller passes a `selected` value (picker context),
						    or nothing at all when the card is just being
						    shown for reference (e.g. on a workspace details
						    page where there's no concept of selection). */}
						{fromWorkspace ? (
							<Badge
								variant="outline"
								className="h-5 border-primary px-1.5 text-[10px] text-primary"
							>
								{t("common:badges.fromAgent")}
							</Badge>
						) : selected !== undefined ? (
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
						) : null}
					</div>
				</div>

				{/* Row 2: image + (name on top, type below) + request access.
				    The title sits next to the brand image where the visual
				    association is strongest; type tucks under as metadata. */}
				<div className="flex items-start gap-2">
					{effectivePermission === "FULLY_PRIVATE" ? (
						<div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border border-dashed bg-muted/50">
							<ImageIcon className="size-4 text-muted-foreground" />
						</div>
					) : m.type === "PROJECT" ? (
						<AppCatalogAvatar
							name={m.name}
							className="size-10 shrink-0 rounded-md text-sm"
						/>
					) : (
						<div className="flex size-10 shrink-0 items-center justify-center">
							<EngineSubtypeIcon
								engineType={m.type}
								engineSubtype={m.subtype}
								alt={`${m.name} icon`}
								className="size-8 object-contain"
							/>
						</div>
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

				{/* Row 3: description, full card width. When absent, a small
				    spacer keeps the card from looking cramped at the bottom. */}
				{m.description ? (
					<div className="wrap-break-words line-clamp-4 text-muted-foreground text-xs">
						{m.description}
					</div>
				) : (
					<div className="h-1" aria-hidden />
				)}
			</CardContent>
		</Card>
	);
};
