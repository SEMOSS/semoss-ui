import { TriangleAlertIcon } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Card,
	H3,
	H4,
	Muted,
	P,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import {
	type ConnectorServiceId,
	getConnectorService,
} from "../connectors/connector.catalog";
import { useConnectProvider } from "../connectors/use-connect-provider";
import { useConnections } from "../connectors/use-connections";
import { useUserConnectors } from "../connectors/use-user-connectors";
import { ConnectionProviderSummary } from "./connection-provider-summary";
import { ConnectorServiceRow } from "./connector-service-row";

/** Placeholder cards while the session's logins load. */
const SKELETON_CARDS = ["microsoft", "google"];

/**
 * Everything the assistant can reach on the user's behalf, in one place: the
 * Microsoft and Google accounts connected to this session, and which of their
 * apps the assistant can use, in every chat of the user's, new and existing.
 *
 * Signing in here links the provider to the user's existing SEMOSS session;
 * the connector tools act with that account and only see what it can see.
 */
export const ConnectionsOverview = () => {
	const { t } = useTranslation("teamwork");
	const connections = useConnections();
	const handleConnect = useConnectProvider(connections.connect);
	const userConnectors = useUserConnectors();
	const appsHeadingId = useId();

	const handleServiceChange = async (
		serviceId: ConnectorServiceId,
		isOn: boolean,
	) => {
		try {
			await userConnectors.setService(serviceId, isOn);
		} catch (error) {
			toast.error(
				t("connectors.saveError", {
					message: error instanceof Error ? error.message : "",
				}),
			);
		}
	};

	return (
		<div className="@container h-full w-full overflow-y-auto">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 @md:px-6 px-4 py-8">
				<div className="flex flex-col gap-1">
					<H3>{t("connections.title")}</H3>
					<P className="font-medium text-base text-muted-foreground leading-normal">
						{t("connections.description")}
					</P>
				</div>

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
						<AlertTitle>
							{t("connections.settingsError")}
						</AlertTitle>
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

				<section
					aria-labelledby={appsHeadingId}
					className="flex flex-col gap-4"
				>
					<div className="flex flex-col gap-1">
						<H4 id={appsHeadingId}>{t("connections.appsTitle")}</H4>
						<Muted>{t("connections.appsDescription")}</Muted>
					</div>

					{connections.status === "loading"
						? SKELETON_CARDS.map((card) => (
								<Skeleton
									key={card}
									className="h-64 w-full rounded-xl"
								/>
							))
						: connections.connections.map((connection) => (
								<Card
									key={connection.provider.id}
									className="gap-4 px-6"
								>
									<ConnectionProviderSummary
										connection={connection}
										isConnecting={
											connections.connectingProviderId ===
											connection.provider.id
										}
										onConnect={() =>
											handleConnect(
												connection.provider.id,
											)
										}
									/>
									{connection.provider.id === "GOOGLE" &&
									!connections.hasAccessInfo("GOOGLE") ? (
										<Muted>
											{t("providers.GOOGLE.scopesNote")}
										</Muted>
									) : null}
									<div className="flex flex-col divide-y divide-border">
										{connection.provider.services.map(
											(serviceId) => {
												const service =
													getConnectorService(
														serviceId,
													);
												if (!service) {
													return null;
												}
												const isOn =
													userConnectors.services.includes(
														serviceId,
													);
												return (
													<ConnectorServiceRow
														key={serviceId}
														idPrefix="teamwork-user-connector"
														blockedReason={
															connections.isServiceCovered(
																serviceId,
															)
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
																	!connections.isServiceCovered(
																		serviceId,
																	)))
														}
														onCheckedChange={(
															checked,
														) =>
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
									<Muted>{t("connections.appsHint")}</Muted>
								</Card>
							))}
				</section>
			</div>
		</div>
	);
};
