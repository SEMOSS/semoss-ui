import { BookOpenIcon, HammerIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { isKnowledgeMcp } from "@semoss/shared";
import { Badge, DropdownMenuItem } from "@semoss/ui/next";
import { listRoomTools } from "../../../tools/mcp/mcp-utils";
import { useComposer } from "../composer.context";

/** Props for {@link PickerItem}. */
interface PickerItemProps {
	/** Which picker the item opens, and what it counts. */
	type: "KNOWLEDGE" | "TOOLBOX";
}

/**
 * A plus menu item that opens the knowledge or toolbox picker, with how many
 * the room has selected, its agent's included.
 */
export const PickerItem = ({ type }: PickerItemProps) => {
	const { t } = useTranslation("room");
	const { options, agentTools, isBusy, openPicker } = useComposer();

	const count = listRoomTools(options.mcp, agentTools).filter((mcp) =>
		type === "KNOWLEDGE" ? isKnowledgeMcp(mcp) : !isKnowledgeMcp(mcp),
	).length;
	const Icon = type === "KNOWLEDGE" ? BookOpenIcon : HammerIcon;
	const labelKey =
		type === "KNOWLEDGE"
			? "menuKnowledge.addKnowledge"
			: "menuToolbox.addToolbox";

	return (
		<DropdownMenuItem onSelect={() => openPicker(type)} disabled={isBusy}>
			<Icon aria-hidden="true" />
			<span className="flex-1">{t(labelKey)}</span>
			<Badge variant="outline">{count}</Badge>
		</DropdownMenuItem>
	);
};
