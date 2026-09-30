import { TriangleAlertIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Muted,
	Skeleton,
	toast,
} from "@semoss/ui/next";
import { useSettingsDialog } from "@/features/settings/settings-dialog.context";
import {
	type ConnectorServiceId,
	getConnectorService,
	sanitizeConnectorServices,
} from "../connectors/connector.catalog";
import { useConnectProvider } from "../connectors/use-connect-provider";
import { useConnections } from "../connectors/use-connections";
import type { TeamworkStore } from "../teamwork.store";
import { ConnectionProviderSummary } from "./connection-provider-summary";
import { ConnectorServiceRow } from "./connector-service-row";

/** Props for {@link TeamworkConnectorsForm}. */
export interface TeamworkConnectorsFormProps {
	/** The room's teamwork state. */
	teamwork: TeamworkStore;
	/** Close the dialog holding the form. */
	onDone: () => void;
}

/**
 * Switch the user's connector services on or off, signing in to Microsoft or
 * Google on the way if needed. A service can only be switched on once its
 * provider is connected, since its tools act with that account. The services
 * are the user's, the same the Connections page sets, so a change reaches all
 * their chats, new and existing.
 */
export const TeamworkConnectorsForm = observer(
	({ teamwork, onDone }: TeamworkConnectorsFormProps) => {
		const { t } = useTranslation("teamwork");
		const connections = useConnections();
		const handleConnect = useConnectProvider(connections.connect);
		const { openSettings } = useSettingsDialog();
		const [selected, setSelected] = useState<ConnectorServiceId[]>(() => [
			...teamwork.connectors,
		]);
		const [isSaving, setIsSaving] = useState(false);

		const handleToggle = (serviceId: ConnectorServiceId, isOn: boolean) => {
			setSelected((previous) =>
				isOn
					? sanitizeConnectorServices([...previous, serviceId])
					: previous.filter((id) => id !== serviceId),
			);
		};

		const handleSave = async () => {
			setIsSaving(true);
			try {
				await teamwork.setConnectors(selected);
				toast.success(
					t("connectors.saved", { count: selected.length }),
				);
				onDone();
			} catch (error) {
				toast.error(
					t("connectors.saveError", {
						message: error instanceof Error ? error.message : "",
					}),
				);
			} finally {
				setIsSaving(false);
			}
		};

		return (
			<>
				<DialogHeader>
					<DialogTitle>{t("connectors.dialogTitle")}</DialogTitle>
					<DialogDescription>
						{t("connectors.dialogDescription")}
					</DialogDescription>
					<Muted>{t("connectors.allChatsNote")}</Muted>
				</DialogHeader>

				<div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
					{connections.status === "loading" ? (
						<div className="flex flex-col gap-3" aria-busy="true">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
						</div>
					) : (
						<div className="flex flex-col gap-6">
							{connections.status === "error" ? (
								<Alert variant="destructive">
									<TriangleAlertIcon aria-hidden />
									<AlertTitle>
										{t("providers.loadErrorTitle")}
									</AlertTitle>
									<AlertDescription>
										<Button
											variant="outline"
											size="sm"
											className="mt-2"
											onClick={() =>
												void connections.refresh()
											}
										>
											{t("common.retry")}
										</Button>
									</AlertDescription>
								</Alert>
							) : null}
							{connections.connections.map((connection) => (
								<section
									key={connection.provider.id}
									aria-label={t(
										`providers.${connection.provider.id}.name`,
									)}
									className="flex flex-col gap-2"
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
													selected.includes(
														serviceId,
													);
												return (
													<ConnectorServiceRow
														key={serviceId}
														idPrefix="teamwork-room-connector"
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
														// a switched on service can always be turned off
														disabled={
															isSaving ||
															(!isOn &&
																(!connection.isConnected ||
																	!connections.isServiceCovered(
																		serviceId,
																	)))
														}
														onCheckedChange={(
															checked,
														) =>
															handleToggle(
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
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="ghost"
						className="sm:me-auto"
						onClick={() => {
							onDone();
							openSettings("connectors");
						}}
					>
						{t("connectors.manage")}
					</Button>
					<Button
						variant="outline"
						disabled={isSaving}
						onClick={onDone}
					>
						{t("connectors.cancel")}
					</Button>
					<Button disabled={isSaving} onClick={handleSave}>
						{isSaving
							? t("connectors.saving")
							: t("connectors.save")}
					</Button>
				</DialogFooter>
			</>
		);
	},
);
