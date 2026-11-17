import { BookOpenIcon, HammerIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Badge, DropdownMenuItem } from "@semoss/ui/next";
import type { RoomStore } from "../../room/store/room.store";
import { isKnowledgeMcp } from "../../tools/mcp/mcp-utils";

/** Props for {@link RoomInputMenuMCP}. */
interface RoomInputMenuMCPProps {
	/** Which picker the item opens, and what it counts. */
	type: "KNOWLEDGE" | "TOOLBOX";
	/** The room's options, whose selections the badge counts. */
	options: RoomStore["options"];
	/** Opens the picker. */
	onSelect: () => void;
	/** Locks the item, as while a turn is running. */
	disabled?: boolean;
}

/** A plus menu item that opens the knowledge or toolbox picker, with how many are selected. */
export const RoomInputMenuMCP = ({
	type,
	options,
	onSelect,
	disabled = false,
}: RoomInputMenuMCPProps) => {
	const { t } = useTranslation("room");

	const items = options.mcp.filter((mcp) =>
		type === "KNOWLEDGE" ? isKnowledgeMcp(mcp) : !isKnowledgeMcp(mcp),
	);

	const Icon = type === "KNOWLEDGE" ? BookOpenIcon : HammerIcon;
	const labelKey =
		type === "KNOWLEDGE"
			? "menuKnowledge.addKnowledge"
			: "menuToolbox.addToolbox";

	return (
		<DropdownMenuItem onSelect={onSelect} disabled={disabled}>
			<Icon aria-hidden="true" />
			<span className="flex-1">{t(labelKey)}</span>
			<Badge variant="outline">{items.length}</Badge>
		</DropdownMenuItem>
	);
};
