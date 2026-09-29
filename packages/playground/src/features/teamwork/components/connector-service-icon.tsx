import {
	CalendarDaysIcon,
	CloudIcon,
	FileTextIcon,
	HardDriveIcon,
	type LucideIcon,
	MailIcon,
	MessagesSquareIcon,
} from "lucide-react";
import type { ConnectorServiceId } from "../connectors/connector.catalog";

const SERVICE_ICONS: Record<ConnectorServiceId, LucideIcon> = {
	outlook: MailIcon,
	"outlook-calendar": CalendarDaysIcon,
	onedrive: CloudIcon,
	teams: MessagesSquareIcon,
	gmail: MailIcon,
	"google-calendar": CalendarDaysIcon,
	"google-drive": HardDriveIcon,
	"google-docs": FileTextIcon,
};

/** Props for {@link ConnectorServiceIcon}. */
export interface ConnectorServiceIconProps {
	/** The service to draw. */
	serviceId: ConnectorServiceId;
	/** Classes for the icon, such as its size. */
	className?: string;
}

/**
 * The icon for a connector service. Decorative: the service's name is always
 * written next to it.
 */
export const ConnectorServiceIcon = ({
	serviceId,
	className,
}: ConnectorServiceIconProps) => {
	const Icon = SERVICE_ICONS[serviceId];
	return <Icon aria-hidden className={className} />;
};
