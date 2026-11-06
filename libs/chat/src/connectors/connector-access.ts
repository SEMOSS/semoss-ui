import {
	type ConnectorProviderId,
	type ConnectorServiceId,
	getConnectorService,
} from "./connector.catalog";

/**
 * Which of a provider's apps its sign in lets the connectors use, from
 * `connectorAccess` in `/api/config`. The server judges it from the scopes the
 * sign in asks for and sends only the verdict, and only to a signed in user,
 * so the scopes themselves never reach the page.
 *
 * @param connectorAccess - The config's `connectorAccess`.
 * @param providerId - The provider.
 * @return Whether each app can work, by the app's access key, or null when
 * the config does not say.
 */
export const getProviderAccess = (
	connectorAccess: unknown,
	providerId: ConnectorProviderId,
): Record<string, boolean> | null => {
	if (typeof connectorAccess !== "object" || connectorAccess === null) {
		return null;
	}
	const apps = (connectorAccess as Record<string, unknown>)[providerId];
	if (typeof apps !== "object" || apps === null) {
		return null;
	}
	const access: Record<string, boolean> = {};
	for (const [key, canWork] of Object.entries(apps)) {
		if (typeof canWork === "boolean") {
			access[key] = canWork;
		}
	}
	return access;
};

/**
 * Whether a service's account lets it work on this server. When the server
 * does not say, it counts as able to, so an older backend never hides
 * anything.
 *
 * @param serviceId - The service.
 * @param connectorAccess - The config's `connectorAccess`.
 * @return False only when the server says the sign in cannot cover it.
 */
export const isServiceCovered = (
	serviceId: ConnectorServiceId,
	connectorAccess: unknown,
): boolean => {
	const service = getConnectorService(serviceId);
	if (!service) {
		return true;
	}
	return (
		getProviderAccess(connectorAccess, service.provider)?.[
			service.accessKey
		] !== false
	);
};
