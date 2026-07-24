import { Link, matchPath, useLocation } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { SidebarMenuButton, SidebarMenuItem } from "@semoss/ui/next";
import { useIsDark } from "@/hooks";

interface GlobalNavItemProps {
	/** Name of the item */
	name: string;

	/** Icon for the item (light mode) */
	icon: string;

	/** Icon for the item in dark mode; falls back to CSS inversion when absent */
	iconDark?: string;

	/** Path for the item */
	path: string;

	/** Url for the item */
	url: string;

	/** Whether to embed the item */
	embed: boolean;

	/** Tooltip text from theme configuration */
	tooltip?: string;
}

// Maps the well-known English item names that ship in default themes to
// translation keys under sidebar:nav.<item>.tooltip. Items with names outside
// this map fall back to displaying the raw `name` as both label and tooltip.
const KNOWN_TOOLTIP_KEYS: Record<string, string> = {
	"Agents/Workspaces": "nav.agentsWorkspaces.tooltip",
	"Knowledge Library": "nav.knowledgeLibrary.tooltip",
	Toolbox: "nav.toolbox.tooltip",
	"Prompt Library": "nav.promptLibrary.tooltip",
};

/**
 * Renders a sidebar allowing users to navigate between pages
 *
 * @component
 */
export const GlobalNavItem: React.FC<GlobalNavItemProps> = ({
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
	const isDark = useIsDark();

	// Use the dark asset when available; otherwise keep the light asset and
	// let the JS-driven filter invert it. Both src and filter use the same
	// isDark value so they can never be out of sync.
	const activeIcon = isDark && iconDark ? iconDark : icon;
	const imgClass = `size-4 select-none${isDark && !iconDark ? " brightness-0 invert" : ""}`;

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
								className={imgClass}
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
								className={imgClass}
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
						<img className={imgClass} src={activeIcon} alt={name} />
					) : null}
					{name}
				</a>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
};
