import { useTranslation } from "@semoss/i18n";
import {
	SidebarRail,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useSidebar,
} from "@semoss/ui/next";

/** The desktop navigation divider doubles as its keyboard-accessible toggle. */
export function NavigationRail() {
	const { t } = useTranslation("sidebar");
	const { open, isMobile, toggleSidebar } = useSidebar();
	const label = t(open ? "actions.closeSidebar" : "actions.openNavigation");

	if (isMobile) return null;

	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<SidebarRail
					type="button"
					tabIndex={0}
					aria-label={label}
					aria-expanded={open}
					onClick={toggleSidebar}
					title={undefined}
				/>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
