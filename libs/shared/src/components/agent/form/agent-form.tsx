import { useEffect, useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@semoss/i18n";
import {
	cn,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Separator,
	Switch,
	Textarea,
} from "@semoss/ui/next";
import type {
	AgentDefaultTool,
	AgentHookCapabilities,
	AgentLinks,
} from "../agent.types";
import { AgentSection } from "../agent-section";
import { AgentDefaultToolsField } from "./agent-default-tools-field";
import { AgentExecutionLimitsFields } from "./agent-execution-limits-fields";
import { AgentHooksField } from "./agent-hooks-field";
import { AgentMcpField } from "./agent-mcp-field";
import { AgentModelField } from "./agent-model-field";
import { AgentPromptsField } from "./agent-prompts-field";
import { AgentSkillsField } from "./agent-skills-field";
import { AgentSubagentsField } from "./agent-subagents-field";
import { AGENT_MAX_GREETING_LENGTH, type AgentFormValues } from "./types";

export interface AgentFormProps {
	/** Initial values - read once on mount; this component owns edits after that. */
	data: AgentFormValues;
	/** Called with the full form values on every field change. */
	onChange: (data: AgentFormValues) => void;
	/** Reports whether hosts may persist the current externally-managed values. */
	onValidityChange?: (isValid: boolean) => void;
	/** Disables every field while keeping the editing layout (e.g. mid-save). */
	disabled?: boolean;
	/** Titles for the prompts attached on load, keyed by prompt id. */
	promptTitles?: Record<string, string>;
	/** Backend-authoritative hook kinds (`GetWorkspace`'s `known_hook_kinds`). */
	knownHookKinds: string[];
	/** Runtime-owned event and binding metadata keyed by hook kind. */
	hookCapabilities: AgentHookCapabilities;
	/** Backend-authoritative built-in tool catalog. */
	defaultTools: AgentDefaultTool[];
	/**
	 * The agent's own workspace id: excluded from the subagent picker, and
	 * lets the MCP pickers surface attached MCPs the user cannot access.
	 */
	workspaceId?: string;
	/** Host link builders for attached resources. */
	links?: AgentLinks;
	/** Shows an editable Name field (hosts that rename agents here). */
	showName?: boolean;
	/** Applies the MCP tag filter to knowledge sources. Defaults to true. */
	enableKnowledgeMCP?: boolean;
	/** Lists SYSTEM-tagged toolboxes in the picker. Defaults to true. */
	showSystemTools?: boolean;
	/** Lists SYSTEM-tagged skills in the picker. Defaults to true. */
	showSystemSkills?: boolean;
	/** Extra classes for the root. */
	className?: string;
}

/**
 * The agent configuration form's editable fields. Uncontrolled after mount:
 * `data` seeds its own react-hook-form instance and every change streams
 * back out through `onChange`, so hosts don't need to know react-hook-form
 * is involved. Read-only users should get `AgentDefinition` instead.
 */
export const AgentForm = ({
	data,
	onChange,
	onValidityChange,
	disabled,
	promptTitles,
	knownHookKinds,
	hookCapabilities,
	defaultTools,
	workspaceId,
	links,
	showName,
	enableKnowledgeMCP = true,
	showSystemTools = true,
	showSystemSkills = true,
	className,
}: AgentFormProps) => {
	const { t } = useTranslation("agent");
	const nameId = useId();
	const descId = useId();
	const instructionsId = useId();
	const greetingId = useId();

	const {
		control,
		watch,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<AgentFormValues>({
		defaultValues: data,
	});

	const greetingEnabled = watch("greetingEnabled");

	useEffect(() => {
		const subscription = watch((value) =>
			onChange(value as AgentFormValues),
		);
		return () => subscription.unsubscribe();
	}, [watch, onChange]);

	useEffect(() => {
		onValidityChange?.(Object.keys(errors).length === 0);
	}, [errors, onValidityChange]);

	return (
		<div
			className={cn(
				"flex w-full min-w-0 flex-1 flex-col gap-6 px-6 py-6",
				className,
			)}
		>
			{/* A disabled fieldset natively cascades to every nested
			    input/textarea/select/button, rather than threading a prop
			    through every field. `contents` keeps it out of the layout. */}
			<fieldset disabled={disabled} className="contents">
				<AgentSection
					title={t("sections.about.title")}
					description={t("sections.about.description")}
				>
					{showName && (
						<Controller
							name="name"
							control={control}
							render={({ field }) => (
								<Field>
									<FieldLabel htmlFor={nameId}>
										{t("form.name")}
									</FieldLabel>
									<Input
										id={nameId}
										placeholder={t("form.namePlaceholder")}
										{...field}
									/>
								</Field>
							)}
						/>
					)}
					<Controller
						name="description"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel htmlFor={descId}>
									{t("about.description")}
								</FieldLabel>
								<Input
									id={descId}
									placeholder={t(
										"form.descriptionPlaceholder",
									)}
									{...field}
								/>
							</Field>
						)}
					/>
					<Controller
						name="instructions"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel htmlFor={instructionsId}>
									{t("about.instructions")}
								</FieldLabel>
								<Textarea
									id={instructionsId}
									placeholder={t(
										"form.instructionsPlaceholder",
									)}
									rows={6}
									className="max-h-96"
									{...field}
								/>
							</Field>
						)}
					/>
					<Field>
						<div className="flex items-center justify-between gap-2">
							<FieldLabel htmlFor={greetingId}>
								{t("about.greeting")}
							</FieldLabel>
							<Controller
								name="greetingEnabled"
								control={control}
								render={({ field }) => (
									<Switch
										aria-label={t("form.greetingToggle")}
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>
						<Controller
							name="greeting"
							control={control}
							render={({ field }) => (
								<Textarea
									id={greetingId}
									placeholder={t("form.greetingPlaceholder")}
									rows={3}
									maxLength={AGENT_MAX_GREETING_LENGTH}
									{...field}
								/>
							)}
						/>
						<FieldDescription>
							{!greetingEnabled &&
								`${t("form.greetingOffNote")} `}
							{t("form.greetingHelp")}
						</FieldDescription>
					</Field>
					<AgentModelField control={control} disabled={disabled} />
				</AgentSection>

				<Separator />

				<AgentSection
					title={t("sections.builtInTools.title")}
					description={t("sections.builtInTools.description")}
				>
					<AgentDefaultToolsField
						control={control}
						tools={defaultTools}
						disabled={disabled}
					/>
				</AgentSection>

				<Separator />

				<AgentSection
					title={t("sections.knowledge.title")}
					description={t("sections.knowledge.description")}
				>
					<AgentMcpField
						control={control}
						type="KNOWLEDGE"
						workspaceId={workspaceId}
						getMcpUrl={links?.getMcpUrl}
						enableKnowledgeMCP={enableKnowledgeMCP}
					/>
				</AgentSection>

				<Separator />

				<AgentSection
					title={t("sections.toolboxes.title")}
					description={t("sections.toolboxes.description")}
				>
					<AgentMcpField
						control={control}
						type="TOOLBOX"
						workspaceId={workspaceId}
						getMcpUrl={links?.getMcpUrl}
						enableKnowledgeMCP={enableKnowledgeMCP}
						showSystemTools={showSystemTools}
					/>
				</AgentSection>

				<Separator />

				<AgentSection
					title={t("sections.skills.title")}
					description={t("sections.skills.description")}
				>
					<AgentSkillsField
						control={control}
						getSkillUrl={links?.getSkillUrl}
						showSystemSkills={showSystemSkills}
					/>
				</AgentSection>

				<Separator />

				<AgentSection
					title={t("sections.prompts.title")}
					description={t("sections.prompts.description")}
				>
					<AgentPromptsField
						control={control}
						initialTitles={promptTitles}
						getPromptUrl={links?.getPromptUrl}
					/>
				</AgentSection>

				<Separator />

				<AgentSection
					title={t("sections.subagents.title")}
					description={t("sections.subagents.description")}
				>
					<AgentSubagentsField
						control={control}
						excludeWorkspaceId={workspaceId}
						getAgentUrl={links?.getAgentUrl}
						disabled={disabled}
					/>
				</AgentSection>

				<Separator />

				<AgentSection
					title={t("sections.executionLimits.title")}
					description={t("sections.executionLimits.description")}
				>
					<AgentExecutionLimitsFields
						control={control}
						showDefaultToolsToggle={false}
					/>
				</AgentSection>

				<Separator />

				<AgentSection
					title={t("sections.hooks.title")}
					description={t("sections.hooks.description")}
				>
					<AgentHooksField
						control={control}
						setError={setError}
						clearErrors={clearErrors}
						knownKinds={knownHookKinds}
						capabilities={hookCapabilities}
						disabled={disabled}
					/>
				</AgentSection>
			</fieldset>
		</div>
	);
};
