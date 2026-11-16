import { PanelLeftIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useSidebar,
} from "@semoss/ui/next";

/**
 * The desktop toggle in the navigation's header, labelled for closing or
 * opening it; nothing on mobile, where the sheet has its own Close.
 */
export function NavigationToggle() {
	const { t } = useTranslation("sidebar");
	const { open, isMobile, toggleSidebar } = useSidebar();
	const label = t(open ? "actions.closeSidebar" : "actions.openNavigation");

	if (isMobile) return null;

	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
					aria-label={label}
					aria-expanded={open}
					onClick={toggleSidebar}
				>
					<PanelLeftIcon
						aria-hidden="true"
						className="rtl:-scale-x-100"
					/>
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
