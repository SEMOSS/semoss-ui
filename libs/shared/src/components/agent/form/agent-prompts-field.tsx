import { MessageSquareText } from "lucide-react";
import { useState } from "react";
import { type Control, Controller } from "react-hook-form";
import { useTranslation } from "@semoss/i18n";
import { PromptSelector } from "../../prompts/prompt-selector";
import type { AgentLinks } from "../agent.types";
import { AgentResourceList } from "../agent-resource-list";
import {
	AgentResourcePickerDialog,
	EMBEDDED_SELECTOR_CLASS_NAME,
} from "./agent-resource-picker-dialog";
import type { AgentFormValues } from "./types";

export interface AgentPromptsFieldProps {
	/** React Hook Form control for the shared agent form. */
	control: Control<AgentFormValues>;
	/** Titles for the prompts attached on load, keyed by prompt id. */
	initialTitles?: Record<string, string>;
	/** Link for each attached prompt. */
	getPromptUrl?: AgentLinks["getPromptUrl"];
}

/**
 * Lists an agent's prompts, with a catalog picker dialog. The form stores
 * prompt ids only, so titles are tracked here from the initial load and
 * from whatever the picker reports.
 */
export const AgentPromptsField = ({
	control,
	initialTitles,
	getPromptUrl,
}: AgentPromptsFieldProps) => {
	const { t } = useTranslation("agent");
	const [titles, setTitles] = useState<Record<string, string>>(
		initialTitles ?? {},
	);
	const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});

	return (
		<Controller
			name="prompts"
			control={control}
			render={({ field }) => {
				const values: string[] = field.value ?? [];
				return (
					<div className="flex flex-col gap-3">
						<AgentResourceList
							emptyLabel={t("empty.prompts")}
							items={values.map((id) => ({
								id,
								title: titles[id] ?? id,
								icon: MessageSquareText,
								href: getPromptUrl?.(id),
							}))}
							onRemove={(id) =>
								field.onChange(values.filter((v) => v !== id))
							}
						/>
						<AgentResourcePickerDialog
							triggerLabel={t("form.prompts.add")}
							title={t("sections.prompts.title")}
							description={t("form.prompts.description")}
							value={values}
							onApply={(next) => {
								setTitles((prev) => ({
									...prev,
									...draftTitles,
								}));
								field.onChange(next);
							}}
						>
							{(draft, setDraft) => (
								<PromptSelector
									values={draft}
									onChange={(next, nextTitles) => {
										setDraft(next);
										setDraftTitles((prev) => ({
											...prev,
											...nextTitles,
										}));
									}}
									className={EMBEDDED_SELECTOR_CLASS_NAME}
									getPlatformUrl={
										getPromptUrl
											? (prompt) =>
													getPromptUrl(prompt.id) ??
													""
											: undefined
									}
								/>
							)}
						</AgentResourcePickerDialog>
					</div>
				);
			}}
		/>
	);
};
