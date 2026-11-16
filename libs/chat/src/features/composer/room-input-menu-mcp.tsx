import { BookOpenIcon, HammerIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Badge, DropdownMenuItem } from "@semoss/ui/next";
import { isKnowledgeMcp } from "../mcp/mcp-utils";
import type { RoomStore } from "../room/room.store";

interface RoomInputMenuMCPProps {
	type: "KNOWLEDGE" | "TOOLBOX";
	options: RoomStore["options"];
	onSelect: () => void;
	disabled?: boolean;
}

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
