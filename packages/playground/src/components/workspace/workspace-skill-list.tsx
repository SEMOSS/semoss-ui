import { BlocksIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Muted, ScrollArea } from "@semoss/ui/next";
import type { SkillConfig } from "@/types";

interface WorkspaceSkillListProps {
	/** Skills configured on the workspace (from GetWorkspace) */
	skills: SkillConfig[];
}

/**
 * Read-only list of skills configured for an agent.
 * Skill objects already come back from GetWorkspace, so no extra fetch.
 */
export const WorkspaceSkillList = ({ skills }: WorkspaceSkillListProps) => {
	const { t } = useTranslation("workspace");

	if (skills.length === 0) {
		return (
			<div className="flex min-h-32 w-full items-center justify-center p-6">
				<Muted>
					{t("skills.noSkills", { defaultValue: "No skills added" })}
				</Muted>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full w-full">
			<div className="flex flex-col gap-3 p-4">
				{skills.map((s) => (
					<div
						key={s.id}
						className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
					>
						<BlocksIcon className="size-4 shrink-0 text-muted-foreground" />
						<div className="font-semibold text-foreground text-sm">
							{s.name}
						</div>
					</div>
				))}
			</div>
		</ScrollArea>
	);
};
