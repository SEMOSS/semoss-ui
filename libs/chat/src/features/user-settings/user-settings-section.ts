import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** One page of the user's settings dialog. */
export interface UserSettingsSection {
	/** Stable key, which `callbacks.onOpenSettings(id)` opens the dialog on. */
	id: string;
	/** The page's name, in the dialog's navigation and as the page's heading. */
	label: string;
	/** The page's icon in the navigation. */
	icon: LucideIcon;
	/** The page; mounted only while it is shown. */
	content: ReactNode;
	/** A bar along the bottom of the page, below what scrolls. */
	footer?: ReactNode;
}
