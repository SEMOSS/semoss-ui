import type { ComponentType } from "react";
import { type ConnectorBrand, ConnectorBrandIcon } from "@semoss/shared";
import { cn } from "@semoss/ui/next";

/** An icon a row, menu, or tab draws: a lucide icon or an app's logo. */
export type AppIcon = ComponentType<{
	className?: string;
	"aria-hidden"?: boolean | "true" | "false";
}>;

/**
 * An app's logo as an icon, so it goes wherever a lucide icon does. A logo is
 * an image, which a menu's svg rules do not size, so it is 16px unless its
 * classes say otherwise. Always decorative, as the logo itself is.
 */
const brandIcon =
	(brand: ConnectorBrand): AppIcon =>
	({ className }) => (
		<ConnectorBrandIcon
			brand={brand}
			className={cn("size-4 shrink-0", className)}
		/>
	);

export const OutlookIcon = brandIcon("outlook");
export const OutlookCalendarIcon = brandIcon("outlook-calendar");
export const OneDriveIcon = brandIcon("onedrive");
export const TeamsIcon = brandIcon("teams");
export const TeamsChatsIcon = brandIcon("teams-chats");
export const TeamsChannelsIcon = brandIcon("teams-channels");
export const TeamsFilesIcon = brandIcon("teams-files");
