import { BookOpenIcon, HammerIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { Badge, DropdownMenuItem } from "@semoss/ui/next";
import type { RoomStore } from "@/stores";

interface RoomInputMenuMCPProps {
	type: "KNOWLEDGE" | "TOOLBOX";
	options: RoomStore["options"];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const RoomInputMenuMCPInner: React.FC<RoomInputMenuMCPProps> = ({
	type,
	options,
	onOpenChange,
}) => {
	const { t } = useTranslation("room");

	const items =
		type === "KNOWLEDGE"
			? options.mcp.filter((mcp) => mcp.type === "VECTOR")
			: options.mcp.filter((mcp) => mcp.type !== "VECTOR");

	const Icon = type === "KNOWLEDGE" ? BookOpenIcon : HammerIcon;
	const labelKey =
		type === "KNOWLEDGE"
			? "menuKnowledge.addKnowledge"
			: "menuToolbox.addToolbox";

	return (
		<DropdownMenuItem onSelect={() => onOpenChange(true)}>
			<Icon />
			<span className="flex-1">{t(labelKey)}</span>
			<Badge variant="outline">{items.length}</Badge>
		</DropdownMenuItem>
	);
};

export const RoomInputMenuMCP = observer(RoomInputMenuMCPInner);
