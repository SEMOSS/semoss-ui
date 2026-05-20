import {
	AlertCircle,
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
	const { t } = useTranslation(["mcp", "common"]);
	const effectiveOnClick = fromWorkspace ? undefined : onClick;

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

	return (
		<Card
			className={`col-span-1 p-0 transition-all ${
				accessMissing ? "border-destructive/50 border-dashed" : ""
			} ${selected ? "border-primary ring-2 ring-primary" : ""} ${
				effectiveOnClick
					? "cursor-pointer hover:border-primary/50 hover:shadow-md"
					: ""
			}`}
			onClick={effectiveOnClick}
		>
			<CardContent className="space-y-2 p-4">
				{/* Title & Open Button */}
				<div className="flex items-start justify-between gap-2">
					<div className="wrap-break-word min-w-0 flex-1 font-semibold text-sm leading-tight">
						{m.name}
					</div>
					{fromWorkspace && (
						<Badge
							variant="outline"
							className="shrink-0 border-primary text-primary text-xs"
						>
							{t("common:badges.fromAgent")}
						</Badge>
					)}
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
									? t(
											"permission.tooltipMissingDependencies",
											{
												type:
													type === "TOOLBOX"
														? "toolbox"
														: "knowledge base",
											},
										)
									: t("permission.tooltipOpen", {
											type:
												type === "TOOLBOX"
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
								m.type === "PROJECT"
									? `${import.meta.env.MODULE}/api/project-${m.id}/projectImage/download`
									: `${import.meta.env.MODULE}/api/e-${m.id}/image/download`
							}
							alt={m.name}
							className="size-16 shrink-0 rounded-md object-cover object-center"
						/>
					)}

					{/* Type & Permission */}
					{effectivePermission && (
						<div className="flex flex-1 flex-col gap-2">
							{/* Type */}
							{type === "TOOLBOX" && (
								<Badge variant="outline" className="w-fit">
									{toSentenceCase(m.type)}
								</Badge>
							)}

							{effectivePermission === "DISCOVERABLE" ? (
								<Button
									size="sm"
									className="h-fit w-fit px-2 py-1 text-xs"
									onClick={handleRequestAccess}
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
							)}
						</div>
					)}
				</div>

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
