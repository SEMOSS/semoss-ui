import {
	AlertCircle,
	ImageIcon,
	SquareArrowOutUpRightIcon,
	TriangleAlert,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	buildInitials,
	getAppCatalogAvatarStyle,
	getEngineSubtypeIcon,
} from "@semoss/shared";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import type { MCP } from "@/types";
import { toSentenceCase } from "@/utility";
import { mcpToPlatformUrl } from "./utility";

export interface MCPCardProps {
	m: MCP;
	type?: "TOOLBOX" | "KNOWLEDGE";
	/** Layout variant. "card" (default) shows a vertical card; "row" shows a horizontal list row. */
	variant?: "card" | "row";
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
}

export const MCPCard = ({
	m,
	type,
	variant = "card",
	effectivePermission,
	missingSubDependencies,
	handleRequestAccess,
	onClick,
	selected,
}: MCPCardProps) => {
	const { root } = useRoot();
	const { t } = useTranslation("mcp");

	const accessMissing =
		effectivePermission === "REQUESTED" ||
		effectivePermission === "DISCOVERABLE" ||
		effectivePermission === "FULLY_PRIVATE";

	const permissionLabel = ((): string => {
		switch (effectivePermission) {
			case "OWNER":
			case "EDIT":
			case "READ_ONLY":
				return toSentenceCase(effectivePermission);
			case "REQUESTED":
				return t("permission.accessRequested");
			case "DISCOVERABLE":
				return t("permission.requestAccess");
			case "FULLY_PRIVATE":
				return t("permission.noAccess");
			default:
				return t("permission.noAccess");
		}
	})();

	const avatar =
		effectivePermission === "FULLY_PRIVATE" ? (
			<div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border border-dashed bg-muted/50">
				<ImageIcon className="size-5 text-muted-foreground" />
			</div>
		) : m.type === "PROJECT" ? (
			<div
				className="flex size-8 shrink-0 items-center justify-center rounded-md font-semibold text-xs"
				style={getAppCatalogAvatarStyle(m.name)}
			>
				{buildInitials(m.name)}
			</div>
		) : (
			<div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 p-1.5">
				<img
					src={getEngineSubtypeIcon(m.type, m.subtype)}
					alt={`${m.name} icon`}
					className="size-full object-contain"
				/>
			</div>
		);

	const openAction = (
		<Tooltip>
			<TooltipTrigger asChild>
				{effectivePermission === "FULLY_PRIVATE" ? (
					<AlertCircle className="size-4 shrink-0 cursor-help text-destructive" />
				) : root.theme.featureFlags?.showPlatformLinks ? (
					<Button
						variant="ghost"
						size="icon"
						className={`-m-2 shrink-0 ${accessMissing || missingSubDependencies ? "w-auto px-2" : ""}`}
						asChild
					>
						<a
							target="_blank"
							href={mcpToPlatformUrl(m)}
							className="flex items-center gap-1"
							onClick={(e) => e.stopPropagation()}
						>
							{(missingSubDependencies || accessMissing) && (
								<TriangleAlert
									className={`size-4 ${accessMissing ? "text-destructive" : "text-amber-500"}`}
								/>
							)}
							<SquareArrowOutUpRightIcon className="size-4" />
						</a>
					</Button>
				) : missingSubDependencies || accessMissing ? (
					<TriangleAlert
						className={`size-4 cursor-help ${accessMissing ? "text-destructive" : "text-amber-500"}`}
					/>
				) : (
					<span />
				)}
			</TooltipTrigger>
			<TooltipContent>
				{accessMissing
					? t("permission.tooltipNoAccess", {
							type:
								type === "TOOLBOX"
									? "toolbox"
									: "knowledge base",
						})
					: missingSubDependencies
						? t("permission.tooltipMissingDependencies", {
								type:
									type === "TOOLBOX"
										? "toolbox"
										: "knowledge base",
							})
						: t("permission.tooltipOpen", {
								type:
									type === "TOOLBOX"
										? "toolbox"
										: "knowledge base",
							})}
			</TooltipContent>
		</Tooltip>
	);

	const permissionBadge =
		effectivePermission &&
		(effectivePermission === "DISCOVERABLE" ? (
			<Button
				type="button"
				size="sm"
				className="h-fit w-fit px-2 py-1 text-xs"
				onClick={(e) => {
					e.stopPropagation();
					handleRequestAccess?.();
				}}
			>
				{t("permission.requestAccessButton")}
			</Button>
		) : (
			<Badge
				variant={
					{
						OWNER: "default",
						EDIT: "secondary",
						READ_ONLY: "outline",
						REQUESTED: "outline",
						FULLY_PRIVATE: "destructive",
					}[effectivePermission] as
						| "default"
						| "secondary"
						| "outline"
						| "destructive"
				}
				className="w-fit"
			>
				{permissionLabel}
			</Badge>
		));

	if (variant === "row") {
		return (
			<Card
				className={`w-full max-w-full overflow-hidden p-0 transition-all ${
					accessMissing ? "border-destructive/50 border-dashed" : ""
				} ${selected ? "border-primary ring-2 ring-primary" : ""} ${
					onClick
						? "cursor-pointer hover:border-primary/50 hover:shadow-md"
						: ""
				}`}
				onClick={onClick}
			>
				<CardContent className="flex w-full min-w-0 items-center gap-3 p-3">
					{avatar}
					<div className="flex min-w-0 flex-1 flex-col">
						<span className="truncate font-semibold text-sm leading-tight">
							{m.name}
						</span>
						<span
							title={m.id}
							className="truncate text-[11px] text-muted-foreground"
						>
							id: {m.id}
						</span>
						<span className="line-clamp-1 text-muted-foreground text-xs">
							{m.description || t("permission.noDescription")}
						</span>
					</div>
					{permissionBadge && (
						<div className="shrink-0">{permissionBadge}</div>
					)}
					<div className="shrink-0">{openAction}</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card
			className={`col-span-1 p-0 transition-all ${
				accessMissing ? "border-destructive/50 border-dashed" : ""
			} ${selected ? "border-primary ring-2 ring-primary" : ""} ${
				onClick
					? "cursor-pointer hover:border-primary/50 hover:shadow-md"
					: ""
			}`}
			onClick={onClick}
		>
			<CardContent className="space-y-1.5 p-3">
				{/* Avatar + Title + Open Button */}
				<div className="flex items-start gap-3">
					{avatar}
					<div className="flex min-w-0 flex-1 flex-col">
						<div className="wrap-break-word font-semibold text-sm leading-tight">
							{m.name}
						</div>
						<div
							title={m.id}
							className="truncate text-muted-foreground text-xs"
						>
							id: {m.id}
						</div>
					</div>
					<div className="shrink-0">{openAction}</div>
				</div>

				{/* Permission */}
				{permissionBadge && (
					<div className="flex flex-col gap-2">{permissionBadge}</div>
				)}

				{/* Description */}
				<div className="text-muted-foreground text-xs">
					{m.description || t("permission.noDescription")}
				</div>
				{m.tags?.length > 0 ? (
					<div className="flex flex-wrap gap-1">
						{m.tags?.map((tag) => (
							<Badge
								key={tag}
								variant="secondary"
								className="text-xs"
							>
								{tag}
							</Badge>
						))}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
};
