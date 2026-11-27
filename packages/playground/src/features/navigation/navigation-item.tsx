import { Link, matchPath, useLocation } from "react-router";
import { useTranslation } from "@semoss/i18n";
import {
	cn,
	SidebarMenuButton,
	SidebarMenuItem,
	useTheme,
} from "@semoss/ui/next";

/** Props for {@link NavigationItem}; each comes from a theme sidebar item. */
interface NavigationItemProps {
	/** The item's label, and its accessible name. */
	name: string;

	/** The item's icon in light mode. */
	icon: string;

	/** The item's icon in dark mode; without it the light icon is inverted. */
	iconDark?: string;

	/** The item's id: its `/embed/<path>` route and its tour target (`nav-<path>`). */
	path: string;

	/** Where the item goes: a hash route (`#/knowledge`) stays in the app, anything else opens a new tab. */
	url: string;

	/** Show `url` inside the app at `/embed/<path>` rather than linking to it. */
	embed: boolean;

	/** Tooltip text from the theme; wins over the translated one. */
	tooltip?: string;
}

/**
 * Tooltip translation keys (`sidebar:nav.<item>.tooltip`) for the English item
 * names the default themes ship. Other names use `name` as their tooltip.
 */
const KNOWN_TOOLTIP_KEYS: Record<string, string> = {
	"Agents/Workspaces": "nav.agentsWorkspaces.tooltip",
	"Knowledge Library": "nav.knowledgeLibrary.tooltip",
	Toolbox: "nav.toolbox.tooltip",
	"Prompt Library": "nav.promptLibrary.tooltip",
};

/**
 * One of the theme's navigation items: an embedded page, an in-app route, or
 * an external link in a new tab.
 */
export const NavigationItem: React.FC<NavigationItemProps> = ({
	name,
	icon,
	iconDark,
	path,
	url,
	embed,
	tooltip,
}) => {
	const { pathname } = useLocation();
	const { t } = useTranslation("sidebar");
	const { resolvedTheme } = useTheme();
	const isDarkMode = resolvedTheme === "dark";

	// Use the dark asset when there is one; otherwise invert the light asset.
	// Both read the same isDarkMode, so the icon and its filter stay in sync.
	const activeIcon = isDarkMode && iconDark ? iconDark : icon;
	const iconClassName = cn(
		"size-4 select-none",
		isDarkMode && !iconDark && "brightness-0 invert",
	);

	// Priority: 1) tooltip prop from theme, 2) i18n translation, 3) fallback to name
	const tooltipKey = KNOWN_TOOLTIP_KEYS[name];
	const tooltipText = tooltip || (tooltipKey ? t(tooltipKey) : name);

	if (embed) {
		return (
			<SidebarMenuItem data-tour={`nav-${path}`}>
				<SidebarMenuButton
					asChild
					isActive={
						!!matchPath(
							{ path: `/embed/${path}`, end: false },
							pathname,
						)
					}
					tooltip={{ children: tooltipText, hidden: false }}
				>
					<Link to={`/embed/${path}`} aria-label={name}>
						{activeIcon ? (
							<img
								className={iconClassName}
								src={activeIcon}
								alt={name}
							/>
						) : null}
						{name}
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	// Hash routes (e.g. "#/knowledge") navigate within the app via React Router
	if (url?.startsWith("#/")) {
		const internalPath = url.slice(1); // "#/knowledge" → "/knowledge"
		return (
			<SidebarMenuItem data-tour={`nav-${path}`}>
				<SidebarMenuButton
					asChild
					isActive={!!matchPath(internalPath, pathname)}
					tooltip={{ children: tooltipText, hidden: false }}
				>
					<Link to={internalPath} aria-label={name}>
						{activeIcon ? (
							<img
								className={iconClassName}
								src={activeIcon}
								alt={name}
							/>
						) : null}
						{name}
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem data-tour={`nav-${path}`}>
			<SidebarMenuButton
				asChild
				tooltip={{ children: tooltipText, hidden: false }}
			>
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="cursor-pointer"
				>
					{activeIcon ? (
						<img
							className={iconClassName}
							src={activeIcon}
							alt={name}
						/>
					) : null}
					{name}
				</a>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
};
