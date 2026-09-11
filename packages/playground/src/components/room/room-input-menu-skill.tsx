import { BlocksIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import type { SkillConfig } from "@semoss/shared";
import { Badge, DropdownMenuItem } from "@semoss/ui/next";

interface RoomInputMenuSkillProps {
	skills: SkillConfig[];
	onSelect: () => void;
}

const RoomInputMenuSkillInner: React.FC<RoomInputMenuSkillProps> = ({
	skills,
	onSelect,
}) => {
	const { t } = useTranslation("room");

	return (
		<DropdownMenuItem onSelect={onSelect}>
			<BlocksIcon />
			<span className="flex-1">{t("room:menuSkill.addSkill")}</span>
			<Badge variant="outline">{skills.length}</Badge>
		</DropdownMenuItem>
	);
};

export const RoomInputMenuSkill = observer(RoomInputMenuSkillInner);
