import { TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { cn, Label, Muted, Small, Switch } from "@semoss/ui/next";
import type { ConnectorService } from "../connector.catalog";
import { ConnectorServiceIcon } from "./connector-service-icon";

/** Props for {@link ConnectorServiceRow}. */
export interface ConnectorServiceRowProps {
	/** The service. */
	service: ConnectorService;
	/** Whether the service is switched on. */
	checked: boolean;
	/** Whether the switch can be used. */
	disabled: boolean;
	/**
	 * Why the service, switched on, is not in effect yet, such as its account
	 * not being connected. The switch reads as on in gray, with the warning
	 * mark the chat's tools use beside it, and can still be turned off.
	 */
	warning?: string;
	/**
	 * Why the service cannot run on this server, such as a permission its
	 * account's sign in does not ask for.
	 */
	blockedReason?: string;
	/** Switch the service on or off. */
	onCheckedChange: (checked: boolean) => void;
	/** Prefix that keeps the switch's id unique on the page. */
	idPrefix: string;
}

/**
 * One connector service with its switch: what it lets the assistant do, and
 * how many of its tools run on their own versus ask first.
 */
export const ConnectorServiceRow = ({
	service,
	checked,
	disabled,
	warning,
	blockedReason,
	onCheckedChange,
	idPrefix,
}: ConnectorServiceRowProps) => {
	const { t } = useTranslation("chatConnectors");
	const switchId = `${idPrefix}-${service.id}`;
	const askCount = service.tools.filter(
		(tool) => tool.execution === "ask",
	).length;

	return (
		<div className="flex min-w-0 items-start gap-3 py-3">
			<div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
				<ConnectorServiceIcon
					serviceId={service.id}
					className="size-5"
				/>
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<Label htmlFor={switchId} className="font-medium text-sm">
					{t(`services.${service.id}.name`)}
				</Label>
				<Muted>{t(`services.${service.id}.description`)}</Muted>
				<Small className="text-muted-foreground">
					{t("services.toolCounts", {
						count: service.tools.length,
						ask: askCount,
					})}
				</Small>
				{blockedReason ? (
					<Small className="text-warning">{blockedReason}</Small>
				) : null}
			</div>
			<div className="mt-1 flex shrink-0 items-center gap-2">
				{warning ? (
					<>
						<TriangleAlertIcon
							aria-hidden
							className="size-4 shrink-0 text-warning"
						/>
						<span className="sr-only">{warning}</span>
					</>
				) : null}
				<Switch
					id={switchId}
					className={cn(
						"shrink-0",
						warning &&
							"data-[state=checked]:bg-muted-foreground/50",
					)}
					checked={checked}
					disabled={disabled}
					onCheckedChange={onCheckedChange}
				/>
			</div>
		</div>
	);
};
