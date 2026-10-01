import { PlugIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { Badge, DropdownMenuItem } from "@semoss/ui/next";
import type { TeamworkStore } from "../teamwork.store";

/** Props for {@link TeamworkConnectorsMenuItem}. */
export interface TeamworkConnectorsMenuItemProps {
	/** The room's teamwork state. */
	teamwork: TeamworkStore;
	/** Called after the item is chosen, to close the menu. */
	onSelect?: () => void;
	/** Defers opening until the host menu has released focus. */
	onOpen?: () => void;
	/** Prevents changing tools during a turn. */
	disabled?: boolean;
}

/** The plus menu's connectors item, with how many services are on. */
export const TeamworkConnectorsMenuItem = observer(
	({
		teamwork,
		onSelect = () => null,
		onOpen = teamwork.openConnectorsDialog,
		disabled = false,
	}: TeamworkConnectorsMenuItemProps) => {
		const { t } = useTranslation("teamwork");

		return (
			<DropdownMenuItem
				disabled={disabled}
				onSelect={() => {
					onOpen();
					onSelect();
				}}
			>
				<PlugIcon aria-hidden />
				<span className="flex-1">{t("menu.connectors")}</span>
				<Badge variant="outline">{teamwork.connectors.length}</Badge>
			</DropdownMenuItem>
		);
	},
);
