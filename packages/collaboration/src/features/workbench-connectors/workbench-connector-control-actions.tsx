import { ExternalLink, RefreshCw } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	useWorkbench,
	WORKBENCH_STYLES,
	WorkbenchChromeButton,
} from "@semoss/workbench";

interface WorkbenchConnectorControlActionsProps {
	/** Refresh the selected account using its current filters or date range. */
	refresh?: () => void;
	/** Prevent another refresh while this account is loading. */
	isRefreshing?: boolean;
	/** The selected item's provider URL, or the calendar homepage. */
	href?: string;
	/** Localized application name for the external link. */
	appName: string;
}

/** Shared email/calendar actions for desktop chrome and compact toolbars. */
export function WorkbenchConnectorControlActions({
	refresh,
	isRefreshing = false,
	href,
	appName,
}: WorkbenchConnectorControlActionsProps) {
	const isCompact = useWorkbench((state) => state.layout.isMobileLayout);
	const { t } = useTranslation("connectors");
	const openLabel = t("actions.openIn", { service: appName });
	const targetSize = isCompact ? "size-9 pointer-coarse:size-11" : undefined;

	return (
		<>
			{refresh ? (
				<WorkbenchChromeButton
					icon={RefreshCw}
					label={t("common.refresh")}
					aria-busy={isRefreshing}
					aria-disabled={isRefreshing || undefined}
					className={cn(
						targetSize,
						"aria-disabled:opacity-50",
						isRefreshing && "motion-safe:[&_svg]:animate-spin",
					)}
					onClick={() => {
						if (!isRefreshing) refresh();
					}}
				/>
			) : null}
			{href ? (
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							asChild
							variant="ghost"
							size="icon-sm"
							className={cn(
								"flex-none text-muted-foreground",
								WORKBENCH_STYLES.chromeButton,
								targetSize,
							)}
						>
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={openLabel}
							>
								<ExternalLink
									aria-hidden
									className={WORKBENCH_STYLES.chromeIcon}
								/>
							</a>
						</Button>
					</TooltipTrigger>
					<TooltipContent>{openLabel}</TooltipContent>
				</Tooltip>
			) : null}
		</>
	);
}
