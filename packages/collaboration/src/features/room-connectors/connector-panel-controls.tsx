import {
	CalendarDays,
	ExternalLink,
	MessageSquarePlus,
	RefreshCw,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	useWorkbenchPanel,
	WORKBENCH_STYLES,
	WorkbenchChromeButton,
	type WorkbenchPanelProps,
} from "@semoss/workbench";
import type {
	ConnectorPanelConfig,
	ConnectorPanelValue,
} from "./room-connectors.types";

/** Subscribe to this tab's publication rather than capturing a viewer render. */
export function ConnectorPanelControls({ id }: WorkbenchPanelProps) {
	const { value } = useWorkbenchPanel<
		ConnectorPanelConfig,
		ConnectorPanelValue
	>(id);
	const { t } = useTranslation("connectors");
	const controls = value?.controls;
	return (
		<>
			{controls?.onOpenCalendar && (
				<WorkbenchChromeButton
					icon={CalendarDays}
					label={t("calendar.openCalendar")}
					onClick={controls.onOpenCalendar}
				/>
			)}
			{controls?.refresh && (
				<WorkbenchChromeButton
					icon={RefreshCw}
					label={t("common.refresh")}
					onClick={controls.refresh.onRefresh}
					disabled={controls.refresh.isRefreshing}
				/>
			)}
			{controls?.addToContext && (
				<WorkbenchChromeButton
					icon={MessageSquarePlus}
					label={t("actions.addToContext")}
					onClick={controls.addToContext.onAddToContext}
					disabled={controls.addToContext.isBusy}
					aria-busy={controls.addToContext.isBusy}
				/>
			)}
			{controls?.openIn && (
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							asChild
							variant="ghost"
							size="icon-sm"
							className={cn(
								"flex-none text-muted-foreground",
								WORKBENCH_STYLES.chromeButton,
							)}
						>
							<a
								href={controls.openIn.href}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={controls.openIn.label}
							>
								<ExternalLink
									aria-hidden="true"
									className={WORKBENCH_STYLES.chromeIcon}
								/>
							</a>
						</Button>
					</TooltipTrigger>
					<TooltipContent>{controls.openIn.label}</TooltipContent>
				</Tooltip>
			)}
		</>
	);
}
