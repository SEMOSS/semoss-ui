import { ConnectorBrandIcon } from "@semoss/shared";
import type { ConnectorServiceId } from "../connectors/connector.catalog";

/** Props for {@link ConnectorServiceIcon}. */
export interface ConnectorServiceIconProps {
	/** The service to draw. */
	serviceId: ConnectorServiceId;
	/** Classes for the icon, such as its size. */
	className?: string;
}

/**
 * The logo of a connector service, in the app's own colors. Decorative: the
 * service's name is always written next to it.
 */
export const ConnectorServiceIcon = ({
	serviceId,
	className,
}: ConnectorServiceIconProps) => (
	<ConnectorBrandIcon brand={serviceId} className={className} />
);
