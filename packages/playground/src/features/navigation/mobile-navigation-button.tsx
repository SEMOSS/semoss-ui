import { MenuIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { Button, useSidebar } from "@semoss/ui/next";

/** Opens mobile navigation without reserving a desktop navbar. */
export function MobileNavigationButton() {
	const { t } = useTranslation("sidebar");
	const { isMobile, openMobile, setOpenMobile } = useSidebar();
	const { key: locationKey } = useLocation();
	const previousLocation = useRef(locationKey);
	const wasOpen = useRef(openMobile);
	const triggerRef = useRef<HTMLButtonElement>(null);

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

	if (!isMobile) return null;

	return (
		<Button
			ref={triggerRef}
			type="button"
			variant="ghost"
			size="icon-lg"
			className="absolute start-2 top-1 min-h-11 min-w-11"
			aria-label={t("actions.openNavigation")}
			aria-expanded={openMobile}
			aria-haspopup="dialog"
			onClick={() => setOpenMobile(true)}
		>
			<MenuIcon aria-hidden="true" />
		</Button>
	);
}
