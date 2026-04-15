import { Link, matchPath, useLocation } from "react-router-dom";
import { SidebarMenuButton, SidebarMenuItem } from "@semoss/ui/next";

interface GlobalNavItemProps {
	/** Name of the item */
	name: string;

	/** Icon for the item */
	icon: string;

	/** Path for the item */
	path: string;

	/** Url for the item */
	url: string;

	/** Whether to embed the item */
	embed: boolean;
}
/**
 * Renders a sidebar allowing users to navigate between pages
 *
 * @component
 */
export const GlobalNavItem: React.FC<GlobalNavItemProps> = ({
	name,
	icon,
	path,
	url,
	embed,
}) => {
	const { pathname } = useLocation();

	if (embed) {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					asChild
					isActive={
						!!matchPath(
							{ path: `/embed/${path}`, end: false },
							pathname,
						)
					}
				>
					<Link to={`/embed/${path}`} aria-label={name}>
						{icon ? (
							<img
								className="size-4 select-none"
								src={icon}
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
			<SidebarMenuItem>
				<SidebarMenuButton
					asChild
					isActive={!!matchPath(internalPath, pathname)}
				>
					<Link to={internalPath} aria-label={name}>
						{icon ? (
							<img
								className="size-4 select-none"
								src={icon}
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
		<SidebarMenuItem>
			<SidebarMenuButton asChild>
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="cursor-pointer"
				>
					{icon ? (
						<img
							className="size-4 select-none"
							src={icon}
							alt={name}
						/>
					) : null}
					{name}
				</a>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
};
