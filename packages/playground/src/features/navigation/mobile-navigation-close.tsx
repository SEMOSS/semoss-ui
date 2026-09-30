import { XIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Button, useSidebar } from "@semoss/ui/next";

/** A visible dismissal action inside the mobile navigation sheet. */
export function MobileNavigationClose() {
	const { t } = useTranslation("sidebar");
	const { isMobile, setOpenMobile } = useSidebar();
	if (!isMobile) return null;

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-lg"
			className="min-h-11 min-w-11 shrink-0"
			aria-label={t("actions.closeSidebar")}
			onClick={() => setOpenMobile(false)}
		>
			<XIcon aria-hidden="true" />
		</Button>
	);
}
