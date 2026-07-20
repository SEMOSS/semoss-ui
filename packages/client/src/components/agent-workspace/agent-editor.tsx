import { SaveIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	type MCPConfig,
	MCPSelector,
	PromptSelector,
	type SkillConfig,
	SkillSelector,
} from "@semoss/shared";
import {
	Button,
	Field,
	FieldLabel,
	Input,
	Separator,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import {
	AGENT_FORM_DEFAULT_VALUES,
	AgentExecutionLimitsFields,
	AgentFormSection,
	type AgentFormValues,
	AgentHooksField,
	AgentModelField,
	AgentSubagentsField,
	buildEditWorkspacePixel,
} from "@/components/agent-workspace/agent-form";
import { useRootStore, useWorkspace } from "@/hooks";
import { mcpToPlatformUrl, promptToPlatformUrl } from "@/utility";

type GetWorkspaceResponse = {
	name: string;
	description: string;
	system_prompt: string;
	mcp: MCPConfig[];
	skills: SkillConfig[];
	prompts: { id: string; name: string; type: string }[];
	known_hook_kinds?: string[];
	config_json?: {
		model_id?: string;
		budgets?: {
			max_turns?: number;
			max_reflections?: number;
		};
		spawn_policy?: {
			max_subagent_depth?: number;
			max_subagents_per_run?: number;
			max_spawns_per_turn?: number;
		};
		subagents?: {
			alias: string;
			workspaceId: string;
			description?: string;
		}[];
		hooks?: {
			kind: string;
			pixel?: string;
			events?: string[];
		}[];
	};
};

export const AgentEditor = () => {
	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();
	const [isLoading, setIsLoading] = useState(false);
	const [isFetching, setIsFetching] = useState(true);
	const [knownHookKinds, setKnownHookKinds] = useState<string[]>([]);

	const descId = useId();
	const instructionsId = useId();

	const { control, handleSubmit, reset } = useForm<AgentFormValues>({
		defaultValues: AGENT_FORM_DEFAULT_VALUES,
	});

	useEffect(() => {
		const load = async () => {
			try {
				setIsFetching(true);
				const { errors, pixelReturn } = await monolithStore.runQuery<
					[GetWorkspaceResponse]
				>(`GetWorkspace(workspaceId=["${workspace.appId}"]);`);
				if (errors.length > 0) throw new Error(errors.join(", "));
				const data = pixelReturn[0].output;
				const allMcps = data.mcp ?? [];
				setKnownHookKinds(data.known_hook_kinds ?? []);
				reset({
					name: data.name ?? "",
					description: data.description ?? "",
					instructions: data.system_prompt ?? "",
					modelId: data.config_json?.model_id ?? "",
					maxTurns:
						data.config_json?.budgets?.max_turns?.toString() ?? "",
					maxReflections:
						data.config_json?.budgets?.max_reflections?.toString() ??
						"",
					maxSubagentDepth:
						data.config_json?.spawn_policy?.max_subagent_depth?.toString() ??
						"",
					maxSubagentsPerRun:
						data.config_json?.spawn_policy?.max_subagents_per_run?.toString() ??
						"",
					maxSpawnsPerTurn:
						data.config_json?.spawn_policy?.max_spawns_per_turn?.toString() ??
						"",
					knowledge: allMcps.filter((m) => m.type === "VECTOR"),
					toolboxes: allMcps.filter((m) => m.type !== "VECTOR"),
					skills: data.skills ?? [],
					prompts: (data.prompts ?? []).map((p) => p.id),
					subagents: (data.config_json?.subagents ?? []).map((s) => ({
						alias: s.alias,
						workspaceId: s.workspaceId,
						description: s.description ?? "",
					})),
					hooks: data.config_json?.hooks ?? [],
				});
			} catch (e) {
				console.error(e);
				toast.error("Failed to load agent data");
			} finally {
				setIsFetching(false);
			}
		};
		if (workspace.appId) load();
	}, [workspace.appId, monolithStore, reset]);

	const onSave = handleSubmit(async (data) => {
		try {
			setIsLoading(true);
			const { errors } = await monolithStore.runQuery(
				buildEditWorkspacePixel(workspace.appId, data),
			);
			if (errors.length > 0) throw new Error(errors.join(", "));
			toast.success("Agent saved");
		} catch (e) {
			console.error(e);
			toast.error((e as Error).message || "Failed to save agent");
		} finally {
			setIsLoading(false);
		}
	});

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
			{/* Toolbar */}
			<div className="flex w-full shrink-0 items-center justify-end gap-2 border-border border-b px-3 pt-[4px] pb-[7px]">
				<Button
					variant="outline"
					size="sm"
					disabled={isLoading || isFetching}
					onClick={onSave}
				>
					{isLoading ? (
						<Spinner className="size-4" />
					) : (
						<SaveIcon className="size-4" />
					)}
					Save
				</Button>
			</div>

			{/* Form */}
			<div className="flex-1 overflow-y-auto">
				{isFetching ? (
					<div className="flex h-full items-center justify-center">
						<Spinner />
					</div>
				) : (
					<form
						className="flex w-full flex-col gap-6 px-6 py-6"
						onSubmit={onSave}
						autoComplete="off"
					>
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
							<AgentModelField control={control} />
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
										workspaceId={workspace.appId}
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
										workspaceId={workspace.appId}
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
									/>
								)}
							/>
						</AgentFormSection>

						<Separator />

						<AgentFormSection
							title="Subagents"
							description="Delegate to other agents as callable tools. Each alias becomes a tool name the agent can invoke."
						>
							<AgentSubagentsField
								control={control}
								excludeWorkspaceId={workspace.appId}
							/>
						</AgentFormSection>

						<Separator />

						<AgentFormSection
							title="Execution limits"
							description="Runtime caps for the agent's tool loop and subagent delegation. Leave a field blank to fall back to its default."
						>
							<AgentExecutionLimitsFields control={control} />
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
					</form>
				)}
			</div>
		</div>
	);
};
