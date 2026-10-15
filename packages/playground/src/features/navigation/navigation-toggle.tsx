import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useSidebar,
} from "@semoss/ui/next";

/** Keeps a visible desktop navigation toggle in both sidebar states. */
export function NavigationToggle() {
	const { t } = useTranslation("sidebar");
	const { open, isMobile, toggleSidebar } = useSidebar();
	const label = t(open ? "actions.closeSidebar" : "actions.openNavigation");
	const Icon = open ? PanelLeftCloseIcon : PanelLeftOpenIcon;

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
					<Icon aria-hidden="true" className="rtl:-scale-x-100" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
