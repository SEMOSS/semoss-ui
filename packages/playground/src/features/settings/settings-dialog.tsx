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
	Small,
} from "@semoss/ui/next";
import { ConnectorsSettings } from "@/features/connectors/components/connectors-settings";
import { GeneralSettings } from "./general-settings";
import type { SettingsSectionId } from "./settings-dialog.context";

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
 * on the end side, under a header bar with its title and the close button,
 * stacked on narrow screens. Only the page scrolls; the header stays put. Pages mount only while shown, so
 * Connectors reads the session's logins each time it opens.
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
				className="gap-0 overflow-hidden p-0 sm:h-144 sm:max-w-4xl sm:flex-row"
			>
				<DialogTitle className="sr-only">
					{t("settings.title")}
				</DialogTitle>
				<DialogDescription className="sr-only">
					{t("settings.description")}
				</DialogDescription>
				<nav
					aria-label={t("settings.title")}
					className="flex shrink-0 gap-1 overflow-x-auto border-border border-b p-3 sm:w-56 sm:flex-col sm:border-e sm:border-b-0"
				>
					<Small className="hidden px-2 pt-1 pb-2 text-muted-foreground sm:block">
						{t("settings.title")}
					</Small>
					{SETTINGS_SECTIONS.map(({ id, icon: Icon }) => (
						<Button
							key={id}
							variant="ghost"
							size="sm"
							aria-current={section === id ? "page" : undefined}
							className={cn(
								"justify-start",
								section === id &&
									"bg-accent text-accent-foreground",
							)}
							onClick={() => onSectionChange(id)}
						>
							<Icon aria-hidden />
							{t(`settings.sections.${id}`)}
						</Button>
					))}
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
				</div>
			</DialogContent>
		</Dialog>
	);
};
