import { useTranslation } from "@semoss/i18n";
import { LoginProviderIcon } from "@semoss/shared";
import { Button, Small } from "@semoss/ui/next";
import type { ProviderConnection } from "../use-connections";

/** Props for {@link ConnectionProviderSummary}. */
export interface ConnectionProviderSummaryProps {
	/** The provider and where it stands. */
	connection: ProviderConnection;
	/** Whether its sign in popup is open. */
	isConnecting: boolean;
	/** Start signing in. Called from the click itself. */
	onConnect: () => void;
	/**
	 * Sign out of the provider. Without it, no Disconnect action shows; it
	 * never shows for the login the session itself signed in with.
	 */
	onDisconnect?: () => void;
	/** Whether the provider is being signed out. */
	isDisconnecting?: boolean;
}

/**
 * A provider's logo, name, and connection state, with the actions that fit:
 * sign in when signed out, saying that its apps need it; reconnect when signed
 * in (to renew consent or pick up newly granted scopes), and disconnect when
 * the host allows it. When the deployment does not offer the provider, it says
 * so and its Sign In shows disabled.
 */
export const ConnectionProviderSummary = ({
	connection,
	isConnecting,
	onConnect,
	onDisconnect,
	isDisconnecting = false,
}: ConnectionProviderSummaryProps) => {
	const { t } = useTranslation("chatConnectors");
	const { provider, isAvailable, isConnected, accountName, canDisconnect } =
		connection;
	const isBusy = isConnecting || isDisconnecting;

	const status = isConnected
		? accountName
			? t("providers.connectedAs", { name: accountName })
			: t("providers.connected")
		: isAvailable
			? t("providers.signInPrompt")
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
			{onDisconnect && canDisconnect ? (
				<Button
					size="sm"
					variant="destructive"
					className="shrink-0"
					disabled={isBusy}
					onClick={onDisconnect}
				>
					{isDisconnecting
						? t("providers.disconnecting")
						: t("providers.disconnect")}
				</Button>
			) : null}
			<Button
				size="sm"
				variant={isConnected ? "secondary" : "default"}
				className="shrink-0"
				disabled={!isAvailable || isBusy}
				onClick={onConnect}
			>
				{isConnecting
					? t("providers.connecting")
					: isConnected
						? t("providers.reconnect")
						: t("providers.signIn", {
								brand: t(`providers.${provider.id}.brand`),
							})}
			</Button>
		</div>
	);
};
