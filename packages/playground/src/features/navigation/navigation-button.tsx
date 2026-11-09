import { MenuIcon, PanelLeftIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useSidebar,
} from "@semoss/ui/next";

interface NavigationButtonProps {
	/**
	 * Floating over the page's top corner, or inline in a route's own header.
	 * Defaults to floating.
	 */
	placement?: "floating" | "inline";
}

/**
 * The navigation's control in the page. On mobile it opens the sheet. On
 * desktop it shows only while the navigation is hidden, inline in a route's own
 * header or floating, since the open navigation holds its own toggle.
 */
export function NavigationButton({
	placement = "floating",
}: NavigationButtonProps) {
	const { t } = useTranslation("sidebar");
	const { isMobile, open, openMobile, setOpenMobile, setOpen } = useSidebar();
	const { key: locationKey } = useLocation();
	const previousLocation = useRef(locationKey);
	const wasOpen = useRef(openMobile);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const label = t("actions.openNavigation");

	// Route links live inside the sheet; selecting one dismisses it.
	useEffect(() => {
		if (previousLocation.current !== locationKey) {
			previousLocation.current = locationKey;
			setOpenMobile(false);
		}
	}, [locationKey, setOpenMobile]);

	// Sidebar's sheet has no SheetTrigger, so restore focus to this entry point.
	useEffect(() => {
		const shouldRestoreFocus = wasOpen.current && !openMobile && isMobile;
		wasOpen.current = openMobile;
		if (!shouldRestoreFocus) return;
		const frame = requestAnimationFrame(() => triggerRef.current?.focus());
		return () => cancelAnimationFrame(frame);
	}, [openMobile, isMobile]);

	// on desktop it gives way to the open sidebar's own toggle
	if (!isMobile && open) return null;

	const className = cn(
		placement === "inline" ? "shrink-0" : "absolute start-2 top-1 z-30",
	);

	if (isMobile) {
		return (
			<Button
				ref={triggerRef}
				type="button"
				variant="ghost"
				size="icon-lg"
				className={cn("min-h-11 min-w-11", className)}
				aria-label={label}
				aria-expanded={openMobile}
				aria-haspopup="dialog"
				onClick={() => setOpenMobile(true)}
			>
				<MenuIcon aria-hidden="true" />
			</Button>
		);
	}

	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<Button
					ref={triggerRef}
					type="button"
					variant="ghost"
					size="icon-sm"
					className={className}
					aria-label={label}
					aria-expanded={false}
					onClick={() => setOpen(true)}
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
