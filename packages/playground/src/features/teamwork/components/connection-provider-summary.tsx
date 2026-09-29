import { useTranslation } from "@semoss/i18n";
import { LoginProviderIcon } from "@semoss/shared";
import { Badge, Button, Small } from "@semoss/ui/next";
import type { ProviderConnection } from "../connectors/use-connections";

/** Props for {@link ConnectionProviderSummary}. */
export interface ConnectionProviderSummaryProps {
	/** The provider and where it stands. */
	connection: ProviderConnection;
	/** Whether its sign in popup is open. */
	isConnecting: boolean;
	/** Start signing in. Called from the click itself. */
	onConnect: () => void;
}

/**
 * A provider's logo, name, and connection state, with the action that fits:
 * connect when signed out, reconnect when signed in (to renew consent or pick
 * up newly granted scopes), nothing when the deployment does not offer it.
 */
export const ConnectionProviderSummary = ({
	connection,
	isConnecting,
	onConnect,
}: ConnectionProviderSummaryProps) => {
	const { t } = useTranslation("teamwork");
	const { provider, isAvailable, isConnected, accountName } = connection;

	const status = isConnected
		? accountName
			? t("providers.connectedAs", { name: accountName })
			: t("providers.connected")
		: isAvailable
			? t("providers.notConnected")
			: t("providers.unavailable");

	return (
		<div className="flex min-w-0 items-center gap-3">
			<LoginProviderIcon
				provider={provider.logo}
				className="size-6 shrink-0"
			/>
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="font-medium text-sm">
					{t(`providers.${provider.id}.name`)}
				</span>
				<Small
					className="truncate text-muted-foreground"
					title={status}
				>
					{status}
				</Small>
			</div>
			{isConnected ? (
				<Badge
					variant="outline"
					className="hidden shrink-0 sm:inline-flex"
				>
					{t("providers.connectedBadge")}
				</Badge>
			) : null}
			{isAvailable ? (
				<Button
					size="sm"
					variant={isConnected ? "outline" : "default"}
					className="shrink-0"
					disabled={isConnecting}
					onClick={onConnect}
				>
					{isConnecting
						? t("providers.connecting")
						: isConnected
							? t("providers.reconnect")
							: t("providers.connect")}
				</Button>
			) : null}
		</div>
	);
};
