import { useTranslation } from "@semoss/i18n";
import {
	AGENT_MAX_GREETING_LENGTH,
	AgentDefaultToolsField,
	AgentExecutionLimitsFields,
	type AgentFormValues,
	AgentHooksField,
	AgentModelField,
	AgentSubagentsField,
	type AgentWorkspace,
} from "@semoss/shared";
import { type Control, FormSwitch, FormTextarea } from "@semoss/ui/next";
import { getPlaygroundAgentLinks } from "@/utility/mcp-utils";

interface WorkspaceAgentFieldsProps {
	/** The existing editor's form control; all settings save together. */
	control: Control<AgentFormValues>;
	/** Backend catalogs for tools and supported hooks. */
	workspace: AgentWorkspace;
	/** Excludes the current agent from its own delegation picker. */
	workspaceId: string;
	/** Locks editing while the form is saving. */
	disabled: boolean;
}

/** Full agent settings composed within Playground's existing card layout. */
export function WorkspaceAgentFields({
	control,
	workspace,
	workspaceId,
	disabled,
}: WorkspaceAgentFieldsProps) {
	const { t } = useTranslation("agent");
	const sections = [
		{
			key: "about",
			title: t("about.greeting"),
			content: (
				<>
					<FormSwitch
						name="greetingEnabled"
						label={t("form.greetingToggle")}
						disabled={disabled}
					/>
					<FormTextarea
						name="greeting"
						label={t("about.greeting")}
						description={t("form.greetingHelp")}
						rows={3}
						maxLength={AGENT_MAX_GREETING_LENGTH}
						disabled={disabled}
					/>
					<AgentModelField control={control} disabled={disabled} />
				</>
			),
		},
		{
			key: "builtInTools",
			title: t("sections.builtInTools.title"),
			content: (
				<AgentDefaultToolsField
					control={control}
					tools={workspace.default_tools ?? []}
					disabled={disabled}
				/>
			),
		},
		{
			key: "subagents",
			title: t("sections.subagents.title"),
			content: (
				<AgentSubagentsField
					control={control}
					excludeWorkspaceId={workspaceId}
					getAgentUrl={getPlaygroundAgentLinks().getAgentUrl}
					disabled={disabled}
				/>
			),
		},
		{
			key: "executionLimits",
			title: t("sections.executionLimits.title"),
			content: (
				<AgentExecutionLimitsFields
					control={control}
					showDefaultToolsToggle={false}
				/>
			),
		},
		{
			key: "hooks",
			title: t("sections.hooks.title"),
			content: (
				<AgentHooksField
					control={control}
					knownKinds={workspace.known_hook_kinds ?? []}
					disabled={disabled}
				/>
			),
		},
	];
	return (
		<fieldset disabled={disabled} className="contents">
			{sections.map(({ key, title, content }) => (
				<section
					key={key}
					className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6"
				>
					<h2 className="font-semibold text-foreground text-lg">
						{title}
					</h2>
					{content}
				</section>
			))}
		</fieldset>
	);
}
