import { useEffect, useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { MCPSelector, PromptSelector, SkillSelector } from "@semoss/shared";
import {
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Separator,
	Switch,
	Textarea,
} from "@semoss/ui/next";
import { useProject } from "@/hooks";
import { mcpToPlatformUrl, promptToPlatformUrl } from "@/utility";
import { AgentDefaultToolsField } from "./agent-default-tools-field";
import { AgentExecutionLimitsFields } from "./agent-execution-limits-fields";
import { AgentFormSection } from "./agent-form-section";
import { AgentHooksField } from "./agent-hooks-field";
import { AgentModelField } from "./agent-model-field";
import { AgentSubagentsField } from "./agent-subagents-field";
import type { AgentFormValues } from "./types";
import { MAX_GREETING_LENGTH } from "./types";

/** One entry of a deployment's built-in agent tool catalog (`GetWorkspace`'s `default_tools`). */
export type AgentDefaultTool = {
	name: string;
	title?: string;
	description?: string;
};

export interface AgentFormProps {
	/** Initial values - read once on mount; this component owns edits after that. */
	data: AgentFormValues;
	/** Called with the full form values on every field change. */
	onChange: (data: AgentFormValues) => void;
	/** Disables every field - view-only mode. */
	readOnly?: boolean;
	/** Backend-authoritative hook kinds (`GetWorkspace`'s `known_hook_kinds`). */
	knownHookKinds: string[];
	/** Backend-authoritative built-in tool catalog. */
	defaultTools: AgentDefaultTool[];
}

/**
 * The agent configuration form's fields, shared by the read-only viewer and
 * the workbench editor panel. Uncontrolled after mount: `data` seeds its own
 * react-hook-form instance and every change streams back out through
 * `onChange`, so callers don't need to know react-hook-form is involved.
 */
export const AgentForm = ({
	data,
	onChange,
	readOnly,
	knownHookKinds,
	defaultTools,
}: AgentFormProps) => {
	const { project } = useProject();
	const descId = useId();
	const instructionsId = useId();
	const greetingId = useId();

	const { control, watch } = useForm<AgentFormValues>({
		defaultValues: data,
	});

	const greetingEnabled = watch("greetingEnabled");

	useEffect(() => {
		const subscription = watch((value) =>
			onChange(value as AgentFormValues),
		);
		return () => subscription.unsubscribe();
	}, [watch, onChange]);

	return (
		// Disabling here, rather than threading a prop through every field,
		// natively cascades to every nested input/textarea/select/button.
		<fieldset
			disabled={readOnly}
			className="m-0 min-w-0 flex-1 border-0 p-0"
		>
			<div className="flex w-full flex-col gap-6 px-6 py-6">
				<AgentFormSection
					title="About"
					description="Basic information about your agent"
				>
					<Controller
						name="description"
						control={control}
						render={({ field }) => (
							<Field>
								<FieldLabel htmlFor={descId}>
									Description
								</FieldLabel>
								<Input
									id={descId}
									placeholder="Enter description"
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
									Instructions
								</FieldLabel>
								<Textarea
									id={instructionsId}
									placeholder="Define the agent's behavior, role, and instructions"
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
								Greeting
							</FieldLabel>
							<Controller
								name="greetingEnabled"
								control={control}
								render={({ field }) => (
									<Switch
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
									placeholder="Hi, I'm your IT support assistant. I can help you reset a password, check the status of an open ticket, or troubleshoot a common issue. What do you need help with?"
									rows={3}
									maxLength={MAX_GREETING_LENGTH}
									disabled={!greetingEnabled}
									{...field}
								/>
							)}
						/>
						<FieldDescription>
							Shown as the agent's opening message when a room
							starts. Costs no tokens and is never visible to the
							model.
						</FieldDescription>
					</Field>
					<AgentModelField control={control} />
				</AgentFormSection>

				<Separator />

				<AgentFormSection
					title="Built-in tools"
					description="Control the deployment default tools available to this agent."
				>
					<AgentDefaultToolsField
						control={control}
						tools={defaultTools}
					/>
				</AgentFormSection>

				<Separator />

				<AgentFormSection
					title="Knowledge"
					description="Add knowledge sources for your agent"
				>
					<Controller
						name="knowledge"
						control={control}
						render={({ field }) => (
							<MCPSelector
								type="KNOWLEDGE"
								values={field.value}
								onChange={field.onChange}
								className="h-112"
								enableKnowledgeMCP={true}
								getPlatformUrl={mcpToPlatformUrl}
								workspaceId={project.project_id}
								disabled={readOnly}
							/>
						)}
					/>
				</AgentFormSection>

				<Separator />

				<AgentFormSection
					title="Toolboxes"
					description="Add tools and capabilities to your agent"
				>
					<Controller
						name="toolboxes"
						control={control}
						render={({ field }) => (
							<MCPSelector
								type="TOOLBOX"
								values={field.value}
								onChange={field.onChange}
								className="h-112"
								enableKnowledgeMCP={true}
								getPlatformUrl={mcpToPlatformUrl}
								workspaceId={project.project_id}
								disabled={readOnly}
							/>
						)}
					/>
				</AgentFormSection>

				<Separator />

				<AgentFormSection
					title="Skills"
					description="Add reusable skills to your agent"
				>
					<Controller
						name="skills"
						control={control}
						render={({ field }) => (
							<SkillSelector
								values={field.value}
								onChange={field.onChange}
								className="h-112"
								disabled={readOnly}
							/>
						)}
					/>
				</AgentFormSection>

				<Separator />

				<AgentFormSection
					title="Prompts"
					description="Pre-configured prompts for your agent"
				>
					<Controller
						name="prompts"
						control={control}
						render={({ field }) => (
							<PromptSelector
								values={field.value}
								onChange={field.onChange}
								className="h-112"
								getPlatformUrl={promptToPlatformUrl}
								disabled={readOnly}
							/>
						)}
					/>
				</AgentFormSection>

				<Separator />

				<AgentFormSection
					title="Subagents"
					description="Select other agents this agent can delegate work to. Tool names and descriptions are generated automatically."
				>
					<AgentSubagentsField
						control={control}
						excludeWorkspaceId={project.project_id}
					/>
				</AgentFormSection>

				<Separator />

				<AgentFormSection
					title="Execution limits"
					description="Runtime caps for the agent's tool loop and subagent delegation. Leave a field blank to fall back to its default."
				>
					<AgentExecutionLimitsFields
						control={control}
						showDefaultToolsToggle={false}
					/>
				</AgentFormSection>

				<Separator />

				<AgentFormSection
					title="Hooks"
					description="Run custom behavior at agent lifecycle points."
				>
					<AgentHooksField
						control={control}
						knownKinds={knownHookKinds}
					/>
				</AgentFormSection>
			</div>
		</fieldset>
	);
};
