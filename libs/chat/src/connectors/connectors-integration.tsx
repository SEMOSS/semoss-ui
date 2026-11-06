import { BlocksIcon } from "lucide-react";
import { getI18n } from "@semoss/i18n";
import { ConnectorBrandIcon } from "@semoss/shared";
import type { ChatSettingsPage } from "../features/settings/settings-dialog.context";
import { toRoomUiStore } from "../features/workbench/room-ui.store";
import type { RoomIntegrationFactory } from "../host/room-integration";
import { ConnectorServiceIcon } from "./components/connector-service-icon";
import { ConnectorToolSignIn } from "./components/connector-tool-sign-in";
import { ConnectorsComposerNotice } from "./components/connectors-composer-notice";
import { ConnectorsSettings } from "./components/connectors-settings";
import { RoomToolsConnectorsSection } from "./components/room-tools-connectors-section";
import { CONNECTOR_SERVICES } from "./connector.catalog";
import { isSignInFailure } from "./connector-sign-in";
import { getConnectorToolService } from "./connector-tools";
import { ConnectorsStore } from "./connectors.store";
import {
	CONNECTORS_INTEGRATION_ID,
	CONNECTORS_SETTINGS_PAGE_ID,
	type ConnectorsIntegration,
} from "./room-connectors";
import { CONNECTOR_SOURCES } from "./sources/connector-sources";
import { signInToProviderWithNotice } from "./sources/use-room-connector-host";

/** The settings dialog's Connectors page, where the user switches them on. */
export const CONNECTORS_SETTINGS_PAGE: ChatSettingsPage = {
	id: CONNECTORS_SETTINGS_PAGE_ID,
	icon: BlocksIcon,
	titleKey: "sidebar:settings.sections.connectors",
	Component: ConnectorsSettings,
};

/**
 * The Microsoft 365 and Google Workspace connectors, as a room integration:
 * the user's connectors copied into each room's toolbox, their viewers on
 * the Workspace's rail, their sign in notices, their part of the room's
 * settings and of follow-up suggestions, and how their calls show.
 *
 * A host adds it to `ChatHostConfig.integrations`, with
 * `CONNECTOR_PANEL_COMPONENTS` in its `panelComponents`,
 * `createConnectorToolProvider()` in its engine's client tools and
 * `CONNECTORS_SETTINGS_PAGE` in its settings dialog.
 *
 * @returns The integration's factory.
 */
export const createConnectorsIntegration =
	(): RoomIntegrationFactory =>
	(room): ConnectorsIntegration => {
		const store = new ConnectorsStore(toRoomUiStore(room));
		return {
			id: CONNECTORS_INTEGRATION_ID,
			store: store,
			adopt: async (draft) => {
				const drafted = (draft as ConnectorsIntegration).store;
				await store.adopt(drafted);
			},
			restore: (options) => store.restore(options),
			prepareDraft: () => store.loadUserConnectors(),
			subscribe: (listener) => store.subscribe(listener),
			getRailPanels: () =>
				store.availableSources.map((source) => ({
					type: source.panelType,
					name: getI18n()?.t(source.nameKey) ?? source.service,
					icon: <ConnectorBrandIcon brand={source.brand} />,
				})),
			ownsPanelType: (type) =>
				CONNECTOR_SOURCES.some((source) => source.panelType === type),
			isBusy: () => store.isSavingConnectors,
			// the reactors of connectors that cannot run, so none is suggested
			getSuggestionContext: () => ({
				unavailableReactors: CONNECTOR_SERVICES.filter(
					(service) =>
						!store.isProviderOffered(service.provider) ||
						!store.isServiceCovered(service.id) ||
						(store.connectedProviders !== null &&
							!store.connectedProviders.includes(
								service.provider,
							)),
				).flatMap((service) =>
					service.tools.map((tool) => tool.reactor),
				),
			}),
			getContextItemIcon: (service) => {
				const brand = CONNECTOR_SOURCES.find(
					(source) => source.service === service,
				)?.brand;
				return brand ? (
					<ConnectorBrandIcon brand={brand} className="size-3" />
				) : undefined;
			},
			ownsToolCall: (call) => Boolean(getConnectorToolService(call)),
			describeToolCall: (call, state) => {
				const service = getConnectorToolService(call);
				if (!service) {
					return undefined;
				}
				const t = getI18n().t;
				return {
					icon: (
						<ConnectorServiceIcon
							serviceId={service.id}
							className="size-4"
						/>
					),
					source: t(`chatConnectors:services.${service.id}.name`),
					approvalNote: t("chatTools:card.connectorApproval"),
					// a call that failed for want of a sign in offers one
					Notice:
						state.status === "ERROR" &&
						typeof state.response === "string" &&
						isSignInFailure(state.response)
							? ConnectorToolSignIn
							: undefined,
				};
			},
			// the connectors' mail and calendar views name their account
			getToolViewSignIn: (params) => () =>
				signInToProviderWithNotice(
					params.provider === "google" ? "GOOGLE" : "MICROSOFT",
				),
			settingsPage: {
				id: CONNECTORS_SETTINGS_PAGE.id,
				titleKey: CONNECTORS_SETTINGS_PAGE.titleKey,
				icon: CONNECTORS_SETTINGS_PAGE.icon,
			},
			ComposerNotice: ConnectorsComposerNotice,
			SettingsSection: RoomToolsConnectorsSection,
		};
	};
