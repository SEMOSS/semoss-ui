import { BlocksIcon, type LucideIcon, SettingsIcon, XIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@semoss/ui/next";
import { ConnectorsSettings } from "@/features/connectors/components/connectors-settings";
import { GeneralSettings } from "./general-settings";
import type { SettingsSectionId } from "./settings-dialog.context";
import { SettingsVersionFooter } from "./settings-version-footer";

/** The dialog's pages, in navigation order. */
const SETTINGS_SECTIONS: readonly {
	id: SettingsSectionId;
	icon: LucideIcon;
}[] = [
	{ id: "general", icon: SettingsIcon },
	{ id: "connectors", icon: BlocksIcon },
];

/** Props for {@link SettingsDialog}. */
export interface SettingsDialogProps {
	/** Whether the dialog is open. */
	open: boolean;
	/** Open or close the dialog. */
	onOpenChange: (open: boolean) => void;
	/** The page shown. */
	section: SettingsSectionId;
	/** Show another page. */
	onSectionChange: (section: SettingsSectionId) => void;
}

/**
 * The user's settings: a list of pages on the start side and the chosen page
 * on the end side, stacked on narrow screens. Both sides share one header bar:
 * "Settings" over the list, the page's title and the close button over the
 * page. General also has a footer bar with the instance's version. Only the
 * page scrolls; the header and footer stay put. Pages mount only while shown,
 * so Connectors reads the session's logins each time it opens.
 *
 * On open, focus goes to the dialog itself rather than its first page button,
 * so no focus ring shows until the user moves through it with the keyboard.
 */
export const SettingsDialog = ({
	open,
	onOpenChange,
	section,
	onSectionChange,
}: SettingsDialogProps) => {
	const { t } = useTranslation("sidebar");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="gap-0 overflow-hidden p-0 focus:outline-none sm:h-144 sm:max-w-4xl sm:flex-row"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					if (event.currentTarget instanceof HTMLElement) {
						event.currentTarget.focus();
					}
				}}
			>
				<DialogTitle className="sr-only">
					{t("settings.title")}
				</DialogTitle>
				<DialogDescription className="sr-only">
					{t("settings.description")}
				</DialogDescription>
				<nav
					aria-label={t("settings.title")}
					className="flex shrink-0 flex-col border-border border-b sm:w-56 sm:border-e sm:border-b-0"
				>
					{/* the nav's label already names it for assistive tech */}
					<p
						aria-hidden
						className="hidden h-14 shrink-0 items-center border-border border-b px-5 font-semibold text-foreground text-sm sm:flex"
					>
						{t("settings.title")}
					</p>
					<div className="flex gap-1 overflow-x-auto p-3 sm:flex-col sm:p-2">
						{SETTINGS_SECTIONS.map(({ id, icon: Icon }) => (
							<Button
								key={id}
								variant="ghost"
								size="sm"
								aria-current={
									section === id ? "page" : undefined
								}
								className={cn(
									"justify-start font-normal text-muted-foreground hover:text-foreground",
									section === id &&
										"bg-accent font-medium text-accent-foreground hover:bg-accent hover:text-accent-foreground",
								)}
								onClick={() => onSectionChange(id)}
							>
								<Icon aria-hidden />
								{t(`settings.sections.${id}`)}
							</Button>
						))}
					</div>
				</nav>
				<div className="flex min-h-0 min-w-0 flex-1 flex-col">
					<div className="flex h-14 shrink-0 items-center justify-between gap-4 border-border border-b ps-6 pe-3">
						<h2 className="truncate font-semibold text-lg">
							{t(`settings.sections.${section}`)}
						</h2>
						<DialogClose asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								className="shrink-0 text-muted-foreground"
								aria-label={t("actions.close")}
							>
								<XIcon aria-hidden />
							</Button>
						</DialogClose>
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto p-6">
						{section === "general" ? (
							<GeneralSettings />
						) : (
							<ConnectorsSettings />
						)}
					</div>
					{section === "general" ? <SettingsVersionFooter /> : null}
				</div>
			</DialogContent>
		</Dialog>
	);
};
