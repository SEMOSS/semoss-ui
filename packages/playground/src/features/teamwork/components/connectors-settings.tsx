import { TriangleAlertIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	cn,
	Muted,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import {
	type ConnectorProviderId,
	type ConnectorServiceId,
	getConnectorProvider,
	getConnectorService,
} from "../connectors/connector.catalog";
import { SessionLoginDisconnectError } from "../connectors/connectors.api";
import { useConnectProvider } from "../connectors/use-connect-provider";
import { useConnections } from "../connectors/use-connections";
import { useUserConnectors } from "../connectors/use-user-connectors";
import { ConnectionProviderSummary } from "./connection-provider-summary";
import { ConnectorServiceRow } from "./connector-service-row";

/** Placeholder sections while the session's logins load. */
const SKELETON_SECTIONS = ["microsoft", "google"];

/**
 * The Connectors page of the settings dialog: the Microsoft and Google
 * accounts connected to this session, each with its apps, and which of those
 * apps the assistant can use in every chat of the user's, new and existing.
 *
 * Signing in links the provider to the user's existing session; the
 * connector tools act with that account and only see what it can see. The
 * first sign in to a provider switches on every app its sign in covers;
 * reconnecting leaves the user's choices as they are. Disconnecting signs the
 * session out of the provider and switches its apps off; the login the session
 * itself signed in with cannot be disconnected. A provider this server does
 * not offer shows grayed out, its Connect disabled.
 */
export const ConnectorsSettings = () => {
	const { t } = useTranslation("teamwork");
	const connections = useConnections();
	const userConnectors = useUserConnectors();
	const { enableServices } = userConnectors;
	const { isServiceCovered } = connections;

	// whether each provider was connected when its sign in started, read once
	// the popup closes
	const wasConnectedRef = useRef<
		Partial<Record<ConnectorProviderId, boolean>>
	>({});

	const handleConnected = useCallback(
		(providerId: ConnectorProviderId) => {
			if (wasConnectedRef.current[providerId]) {
				return;
			}
			const services = getConnectorProvider(providerId).services.filter(
				(serviceId) => isServiceCovered(serviceId),
			);
			enableServices(services).catch((error: unknown) => {
				toast.error(
					t("connectors.saveError", {
						message: getErrorMessage(error, ""),
					}),
				);
			});
		},
		[enableServices, isServiceCovered, t],
	);

	const handleConnect = useConnectProvider(
		connections.connect,
		handleConnected,
	);

	const handleDisconnect = async (providerId: ConnectorProviderId) => {
		const name = t(`providers.${providerId}.name`);
		try {
			await connections.disconnect(providerId);
		} catch (error) {
			toast.error(
				t("providers.disconnectError", {
					name: name,
					message:
						error instanceof SessionLoginDisconnectError
							? t("providers.sessionLoginNote")
							: getErrorMessage(error, ""),
				}),
			);
			return;
		}
		toast.success(t("providers.disconnectSuccess", { name: name }));
		try {
			await userConnectors.disableServices(
				getConnectorProvider(providerId).services,
			);
		} catch (error) {
			toast.error(
				t("connectors.saveError", {
					message: getErrorMessage(error, ""),
				}),
			);
		}
	};

	const handleServiceChange = async (
		serviceId: ConnectorServiceId,
		isOn: boolean,
	) => {
		try {
			await userConnectors.setService(serviceId, isOn);
		} catch (error) {
			toast.error(
				t("connectors.saveError", {
					message: getErrorMessage(error, ""),
				}),
			);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<Muted>{t("connections.appsDescription")}</Muted>

			{connections.status === "error" ? (
				<Alert variant="destructive">
					<TriangleAlertIcon aria-hidden />
					<AlertTitle>{t("providers.loadErrorTitle")}</AlertTitle>
					<AlertDescription>
						<Button
							variant="outline"
							size="sm"
							className="mt-2"
							onClick={() => void connections.refresh()}
						>
							{t("common.retry")}
						</Button>
					</AlertDescription>
				</Alert>
			) : null}

			{userConnectors.status === "error" ? (
				<Alert variant="destructive">
					<TriangleAlertIcon aria-hidden />
					<AlertTitle>{t("connections.settingsError")}</AlertTitle>
					<AlertDescription>
						<Button
							variant="outline"
							size="sm"
							className="mt-2"
							onClick={userConnectors.reload}
						>
							{t("common.retry")}
						</Button>
					</AlertDescription>
				</Alert>
			) : null}

			{connections.status === "loading"
				? SKELETON_SECTIONS.map((section) => (
						<Skeleton
							key={section}
							className="h-56 w-full rounded-lg"
						/>
					))
				: connections.connections.map((connection) => (
						<section
							key={connection.provider.id}
							aria-label={t(
								`providers.${connection.provider.id}.name`,
							)}
							aria-disabled={!connection.isAvailable || undefined}
							className={cn(
								"flex flex-col gap-3",
								!connection.isAvailable && "opacity-60",
							)}
						>
							<ConnectionProviderSummary
								connection={connection}
								isConnecting={
									connections.connectingProviderId ===
									connection.provider.id
								}
								onConnect={() => {
									wasConnectedRef.current[
										connection.provider.id
									] = connection.isConnected;
									handleConnect(connection.provider.id);
								}}
								isDisconnecting={
									connections.disconnectingProviderId ===
									connection.provider.id
								}
								onDisconnect={() =>
									void handleDisconnect(
										connection.provider.id,
									)
								}
							/>
							{connection.isConnected &&
							connection.isSessionLogin ? (
								<Muted>{t("providers.sessionLoginNote")}</Muted>
							) : null}
							{connection.provider.id === "GOOGLE" &&
							!connections.hasAccessInfo("GOOGLE") ? (
								<Muted>
									{t("providers.GOOGLE.scopesNote")}
								</Muted>
							) : null}
							<div className="flex flex-col divide-y divide-border rounded-lg border border-border px-4">
								{connection.provider.services.map(
									(serviceId) => {
										const service =
											getConnectorService(serviceId);
										if (!service) {
											return null;
										}
										const isOn =
											userConnectors.services.includes(
												serviceId,
											);
										const isCovered =
											isServiceCovered(serviceId);
										return (
											<ConnectorServiceRow
												key={serviceId}
												idPrefix="settings-connector"
												blockedReason={
													isCovered
														? undefined
														: t(
																"scopes.serviceBlocked",
															)
												}
												service={service}
												checked={isOn}
												disabled={
													userConnectors.status !==
														"ready" ||
													userConnectors.isSaving ||
													(!isOn &&
														(!connection.isConnected ||
															!isCovered))
												}
												onCheckedChange={(checked) =>
													void handleServiceChange(
														serviceId,
														checked,
													)
												}
											/>
										);
									},
								)}
							</div>
						</section>
					))}

			<Muted>{t("connections.appsHint")}</Muted>
		</div>
	);
};
