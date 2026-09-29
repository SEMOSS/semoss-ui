import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	CONNECTOR_PROVIDERS,
	type ConnectorProvider,
	type ConnectorProviderId,
	type ConnectorServiceId,
	getConnectorProvider,
	getConnectorService,
	isProviderOffered,
} from "./connector.catalog";
import {
	getProviderAccess,
	isServiceCovered as isCoveredByServer,
} from "./connector-access";
import { connectProvider, getSessionLogins } from "./connectors.api";

/** Where one provider stands for the current session. */
export interface ProviderConnection {
	provider: ConnectorProvider;
	/** Whether this deployment offers signing in with the provider. */
	isAvailable: boolean;
	/** Whether the session holds a login for it. */
	isConnected: boolean;
	/** The account the provider reported, when connected. */
	accountName: string;
}

/** What {@link useConnections} returns. */
export interface UseConnectionsResult {
	/** Whether the session's logins have loaded. */
	status: "loading" | "ready" | "error";
	/** Every provider, in display order. */
	connections: ProviderConnection[];
	/** The provider whose sign in popup is open, if any. */
	connectingProviderId: ConnectorProviderId | null;
	/** Whether a service's provider is connected, so its tools can run. */
	isServiceReady: (serviceId: ConnectorServiceId) => boolean;
	/**
	 * Whether this server's sign in lets a service's account use it, as the
	 * server judges from the permissions the sign in asks for. True while the
	 * server does not say.
	 */
	isServiceCovered: (serviceId: ConnectorServiceId) => boolean;
	/** Whether the server says which of a provider's apps its sign in allows. */
	hasAccessInfo: (providerId: ConnectorProviderId) => boolean;
	/** Read the session's logins again. */
	refresh: () => Promise<void>;
	/**
	 * Sign in to a provider in a popup. Call it straight from a click.
	 * Resolves to whether the provider is connected afterwards.
	 */
	connect: (providerId: ConnectorProviderId) => Promise<boolean>;
}

/**
 * The Microsoft and Google accounts the session can use for connectors.
 *
 * Availability comes from the deployment's configured OAuth providers;
 * whether a provider is connected comes from the session's logins, a read the
 * whole page shares, which is taken again after every sign in.
 *
 * @return The providers' state and the actions that change it.
 */
export const useConnections = (): UseConnectionsResult => {
	const { system } = useInsight();
	const [logins, setLogins] = useState<Record<string, string>>({});
	const [status, setStatus] =
		useState<UseConnectionsResult["status"]>("loading");
	const [connectingProviderId, setConnectingProviderId] =
		useState<ConnectorProviderId | null>(null);

	// refresh and connect resolve after user actions, possibly after the
	// component using this hook is gone
	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	useEffect(() => {
		let isCancelled = false;
		void (async () => {
			try {
				const next = await getSessionLogins();
				if (!isCancelled) {
					setLogins(next);
					setStatus("ready");
				}
			} catch {
				if (!isCancelled) {
					setStatus("error");
				}
			}
		})();
		return () => {
			isCancelled = true;
		};
	}, []);

	const refresh = useCallback(async (): Promise<void> => {
		try {
			const next = await getSessionLogins({ maxAgeMs: 0 });
			if (isMountedRef.current) {
				setLogins(next);
				setStatus("ready");
			}
		} catch {
			if (isMountedRef.current) {
				setStatus("error");
			}
		}
	}, []);

	const connect = useCallback(
		async (providerId: ConnectorProviderId): Promise<boolean> => {
			setConnectingProviderId(providerId);
			try {
				// no await before this call: the popup has to open inside the click
				const isConnected = await connectProvider(
					getConnectorProvider(providerId),
				);
				await refresh();
				return isConnected;
			} finally {
				if (isMountedRef.current) {
					setConnectingProviderId(null);
				}
			}
		},
		[refresh],
	);

	const connections = CONNECTOR_PROVIDERS.map((provider) => ({
		provider: provider,
		isAvailable: isProviderOffered(
			system?.config.availableProviders,
			provider,
		),
		isConnected: provider.loginKey in logins,
		accountName: logins[provider.loginKey] ?? "",
	}));

	const isServiceReady = (serviceId: ConnectorServiceId): boolean => {
		const service = getConnectorService(serviceId);
		return (
			!!service &&
			connections.some(
				(connection) =>
					connection.provider.id === service.provider &&
					connection.isConnected,
			)
		);
	};

	const isServiceCovered = (serviceId: ConnectorServiceId): boolean =>
		isCoveredByServer(serviceId, system?.config.connectorAccess);

	return {
		status: status,
		connections: connections,
		connectingProviderId: connectingProviderId,
		isServiceReady: isServiceReady,
		isServiceCovered: isServiceCovered,
		hasAccessInfo: (providerId) =>
			getProviderAccess(system?.config.connectorAccess, providerId) !==
			null,
		refresh: refresh,
		connect: connect,
	};
};
