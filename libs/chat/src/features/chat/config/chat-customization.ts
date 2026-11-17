import type { ReactNode } from "react";
import type { RoomComposerMenuProps } from "../../conversation/composer/room-composer-menu";
import type { SlashCommand } from "../../conversation/composer/slash-command/slash-command";
import type { RoomActionItem } from "../../room/actions/use-room-action-items";
import type { RoomStore } from "../../room/store/room.store";
import type { UserSettingsSection } from "../../user-settings/user-settings-section";
import type { WorkbenchPanelOption } from "../../workbench/rail/use-workbench-panels";

/**
 * How a host changes the lists chat UI builds. Each function is handed the
 * chat's own list for a room and returns the list to show: the same one, one
 * with entries added, or one with entries removed. Each runs during render,
 * so it must be pure and cheap; it may return its input.
 */
export interface ChatCustomization {
	/**
	 * The Workspace's panels: the rail's icons and the slash menu's Workspace
	 * group. A panel a host adds opens with `room.openWorkbenchPanel` on a
	 * panel type it registered in `ChatConfig.workbenchPanelComponents`.
	 */
	readonly workbenchPanels?: (
		defaults: WorkbenchPanelOption[],
		room: RoomStore,
	) => WorkbenchPanelOption[];
	/**
	 * A room's own actions: the rail's cog menu and the slash menu's Room
	 * group. Not asked for a new chat, which has none.
	 */
	readonly roomActions?: (
		defaults: RoomActionItem[],
		room: RoomStore,
	) => RoomActionItem[];
	/**
	 * Every command of the composer's "/" menu, after the panels and room
	 * actions above are in it.
	 */
	readonly slashCommands?: (
		defaults: SlashCommand[],
		room: RoomStore,
	) => SlashCommand[];
	/**
	 * The items of the composer's plus menu. `defaults` is the chat's own
	 * items, already rendered; return them with the host's
	 * `DropdownMenuItem`s around them, or build other items from `props`.
	 */
	/**
	 * The pages of the user's settings dialog (`UserSettingsDialog`): the
	 * chat's own are General and Connectors.
	 */
	readonly settingsSections?: (
		defaults: UserSettingsSection[],
	) => UserSettingsSection[];
	readonly composerMenu?: (
		defaults: ReactNode,
		props: RoomComposerMenuProps,
	) => ReactNode;
}
