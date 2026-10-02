/// <reference path="../svg-url.d.ts" />
import { cn } from "@semoss/ui/next";
import gmailLogo from "../assets/img/connectors/gmail.svg?url";
import googleCalendarLogo from "../assets/img/connectors/google-calendar.svg?url";
import googleDocsLogo from "../assets/img/connectors/google-docs.svg?url";
import googleDriveLogo from "../assets/img/connectors/google-drive.svg?url";
import onedriveLogo from "../assets/img/connectors/onedrive.svg?url";
import outlookLogo from "../assets/img/connectors/outlook.svg?url";
import outlookCalendarLogo from "../assets/img/connectors/outlook-calendar.svg?url";
import teamsLogo from "../assets/img/MS_TEAMS.svg?url";

/** A Microsoft 365 or Google Workspace app with a logo of its own. */
export type ConnectorBrand =
	| "gmail"
	| "google-calendar"
	| "google-docs"
	| "google-drive"
	| "onedrive"
	| "outlook"
	| "outlook-calendar"
	| "teams";

/**
 * The apps' logos, one SVG file each in `assets/img/connectors`, where any
 * package can also reach them as `@semoss/shared/assets/img/connectors/*`.
 * Teams uses the `MS_TEAMS.svg` the engine icons already have. The colors are
 * the brands' own, not theme tokens.
 */
const BRAND_LOGOS: Record<ConnectorBrand, string> = {
	gmail: gmailLogo,
	"google-calendar": googleCalendarLogo,
	"google-docs": googleDocsLogo,
	"google-drive": googleDriveLogo,
	onedrive: onedriveLogo,
	outlook: outlookLogo,
	"outlook-calendar": outlookCalendarLogo,
	teams: teamsLogo,
};

/** Props for {@link ConnectorBrandIcon}. */
export interface ConnectorBrandIconProps {
	/** The app whose logo to draw. */
	brand: ConnectorBrand;
	/** Classes for the icon, such as its size. */
	className?: string;
}

/**
 * The logo of a Microsoft 365 or Google Workspace app, in its own colors,
 * fitted within the box its classes give it, since not every logo is square.
 * Decorative: the app's name is always written next to it.
 */
export const ConnectorBrandIcon = ({
	brand,
	className,
}: ConnectorBrandIconProps) => (
	<img
		src={BRAND_LOGOS[brand]}
		alt=""
		aria-hidden="true"
		draggable={false}
		className={cn("object-contain", className)}
	/>
);
