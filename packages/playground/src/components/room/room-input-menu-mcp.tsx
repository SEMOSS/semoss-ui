import { BookOpenIcon, HammerIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { Badge, DropdownMenuItem } from "@semoss/ui/next";
import type { RoomStore } from "@/stores/room/room.store";
import { isKnowledgeMcp } from "@/utility/mcp-utils";

interface RoomInputMenuMCPProps {
	type: "KNOWLEDGE" | "TOOLBOX";
	options: RoomStore["options"];
	onSelect: () => void;
	disabled?: boolean;
}

const RoomInputMenuMCPInner: React.FC<RoomInputMenuMCPProps> = ({
	type,
	options,
	onSelect,
	disabled = false,
}) => {
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

export const RoomInputMenuMCP = observer(RoomInputMenuMCPInner);
