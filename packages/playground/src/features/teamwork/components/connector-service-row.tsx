import { useTranslation } from "@semoss/i18n";
import { Label, Muted, Small, Switch } from "@semoss/ui/next";
import type { ConnectorService } from "../connectors/connector.catalog";
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
	blockedReason,
	onCheckedChange,
	idPrefix,
}: ConnectorServiceRowProps) => {
	const { t } = useTranslation("teamwork");
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
			<Switch
				id={switchId}
				className="mt-1 shrink-0"
				checked={checked}
				disabled={disabled}
				onCheckedChange={onCheckedChange}
			/>
		</div>
	);
};
