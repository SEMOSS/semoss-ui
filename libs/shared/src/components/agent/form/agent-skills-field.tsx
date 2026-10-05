import { type Control, Controller } from "react-hook-form";
import { useTranslation } from "@semoss/i18n";
import type { SkillConfig } from "../../../types";
import { SkillSelector } from "../../skills/skill-selector";
import type { AgentLinks } from "../agent.types";
import { AgentResourceList } from "../agent-resource-list";
import {
	AgentResourcePickerDialog,
	EMBEDDED_SELECTOR_CLASS_NAME,
} from "./agent-resource-picker-dialog";
import type { AgentFormValues } from "./types";

/** `GetWorkspace` returns each attached skill's frontmatter description. */
type AttachedSkill = SkillConfig & { description?: string };

export interface AgentSkillsFieldProps {
	/** React Hook Form control for the shared agent form. */
	control: Control<AgentFormValues>;
	/** Link for each attached skill. */
	getSkillUrl?: AgentLinks["getSkillUrl"];
	/** Lists SYSTEM-tagged skills in the picker. */
	showSystemSkills?: boolean;
}

/** Lists an agent's skills, with a catalog picker dialog. */
export const AgentSkillsField = ({
	control,
	getSkillUrl,
	showSystemSkills = true,
}: AgentSkillsFieldProps) => {
	const { t } = useTranslation("agent");

	return (
		<Controller
			name="skills"
			control={control}
			render={({ field }) => {
				const values: AttachedSkill[] = field.value ?? [];
				return (
					<div className="flex flex-col gap-3">
						<AgentResourceList
							emptyLabel={t("empty.skills")}
							items={values.map((s) => ({
								id: s.id,
								projectId: s.id,
								title: s.name,
								description: s.description,
								href: getSkillUrl?.(s.id),
							}))}
							onRemove={(id) =>
								field.onChange(
									values.filter((s) => s.id !== id),
								)
							}
						/>
						<AgentResourcePickerDialog
							triggerLabel={t("form.skills.add")}
							title={t("sections.skills.title")}
							description={t("form.skills.description")}
							value={values}
							onApply={field.onChange}
						>
							{(draft, setDraft) => (
								<SkillSelector
									values={draft}
									onChange={setDraft}
									className={EMBEDDED_SELECTOR_CLASS_NAME}
									showSystemSkills={showSystemSkills}
								/>
							)}
						</AgentResourcePickerDialog>
					</div>
				);
			}}
		/>
	);
};
