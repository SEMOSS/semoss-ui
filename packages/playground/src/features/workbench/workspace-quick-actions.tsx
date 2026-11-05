import {
	EllipsisIcon,
	PanelRightCloseIcon,
	PanelsTopLeftIcon,
	PlugIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useIsMobile,
} from "@semoss/ui/next";
import { useSettingsDialog } from "@/features/settings/settings-dialog.context";
import type { RoomStore } from "@/stores/room/room.store";
import type { DraftWorkspacePlaces } from "./use-workspace-places";
import { WorkspaceMenuItems } from "./workspace-menu-items";
import {
	HEADER_TOOLTIP_DELAY,
	WorkspaceToggleButton,
} from "./workspace-toggle-button";

/** A section heading in the Other menu. */
const SECTION_LABEL_CLASS_NAME = "text-muted-foreground text-xs";

export interface WorkspaceQuickActionsProps {
	/** The room whose Workspace the places open in. */
	room: RoomStore;
	/** A new chat's own actions, until its first message. */
	draft?: DraftWorkspacePlaces;
	/** More items for the Other menu, after the places, such as the room's own. */
	menuItems?: ReactNode;
	/** The Other menu's `onCloseAutoFocus`, for `menuItems` that need it. */
	onMenuCloseAutoFocus?: (event: Event) => void;
}

/**
 * The end of the room header: the Other menu, then the Workspace toggle. The
 * menu runs in sections: Workspace (Open a Panel, a submenu of every place —
 * Files, Settings, the activity log, and the connector viewers — and Close
 * Workspace while it is open), any `menuItems` such as the room's own
 * actions, and last Settings (Connectors, the settings page that switches
 * them on).
 */
export const WorkspaceQuickActions = observer(
	({
		room,
		draft,
		menuItems,
		onMenuCloseAutoFocus,
	}: WorkspaceQuickActionsProps) => {
		const { t } = useTranslation(["room", "sidebar"]);
		const isMobile = useIsMobile();
		const { openSettings } = useSettingsDialog();
		return (
			<nav
				aria-label={t("studio.workArea")}
				className="flex shrink-0 items-center gap-0.5"
			>
				<DropdownMenu>
					<Tooltip delayDuration={HEADER_TOOLTIP_DELAY}>
						<TooltipTrigger asChild>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size={isMobile ? "icon-lg" : "icon-sm"}
									aria-label={t("studio.moreActions")}
									className={cn(
										"shrink-0 text-muted-foreground",
										isMobile && "min-h-11 min-w-11",
									)}
								>
									<EllipsisIcon
										aria-hidden="true"
										className="size-4"
									/>
								</Button>
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent
							side="bottom"
							sideOffset={6}
							collisionPadding={8}
							arrow={false}
						>
							{t("studio.moreActions")}
						</TooltipContent>
					</Tooltip>
					<DropdownMenuContent
						align="end"
						className="w-60"
						onCloseAutoFocus={onMenuCloseAutoFocus}
					>
						<DropdownMenuLabel className={SECTION_LABEL_CLASS_NAME}>
							{t("studio.workArea")}
						</DropdownMenuLabel>
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="gap-2.5 max-md:min-h-11">
								<PanelsTopLeftIcon aria-hidden="true" />
								{t("workspacePlaces.openPanel")}
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent className="w-56">
									<WorkspaceMenuItems
										room={room}
										draft={draft}
									/>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
						{room.sidebar.isOpen && (
							<DropdownMenuItem
								className="gap-2.5 max-md:min-h-11"
								onSelect={() => void room.closeSidebar()}
							>
								<PanelRightCloseIcon
									aria-hidden="true"
									className="rtl:-scale-x-100"
								/>
								{t("studio.closeWorkspace")}
							</DropdownMenuItem>
						)}
						{menuItems && <DropdownMenuSeparator />}
						{menuItems}
						<DropdownMenuSeparator />
						<DropdownMenuLabel className={SECTION_LABEL_CLASS_NAME}>
							{t("sidebar:settings.title")}
						</DropdownMenuLabel>
						<DropdownMenuItem
							className="gap-2.5 max-md:min-h-11"
							onSelect={() => openSettings("connectors")}
						>
							<PlugIcon aria-hidden="true" />
							{t("sidebar:settings.sections.connectors")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<WorkspaceToggleButton room={room} draft={draft} />
			</nav>
		);
	},
);
