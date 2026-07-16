import { SaveIcon } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { usePixel } from "@semoss/sdk/react";
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
	H4,
	Input,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useRootStore, useWorkspace } from "@/hooks";
import { mcpToPlatformUrl, promptToPlatformUrl } from "@/utility";

type AgentForm = {
	name: string;
	description: string;
	instructions: string;
	modelId: string;
	maxTurns: string;
	maxReflections: string;
	maxSubagentDepth: string;
	maxSubagentsPerRun: string;
	maxSpawnsPerTurn: string;
	knowledge: MCPConfig[];
	toolboxes: MCPConfig[];
	skills: SkillConfig[];
	prompts: string[];
};

type GetWorkspaceResponse = {
	name: string;
	description: string;
	system_prompt: string;
	mcp: MCPConfig[];
	skills: SkillConfig[];
	prompts: { id: string; name: string; type: string }[];
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
	};
};

type ModelEngine = { engine_id: string; engine_name: string; tag: string };

export const AgentEditor = () => {
	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();
	const [isLoading, setIsLoading] = useState(false);
	const [isFetching, setIsFetching] = useState(true);

	const descId = useId();
	const instructionsId = useId();
	const modelFieldId = useId();
	const maxTurnsId = useId();
	const maxReflectionsId = useId();
	const maxSubagentDepthId = useId();
	const maxSubagentsPerRunId = useId();
	const maxSpawnsPerTurnId = useId();

	const { control, handleSubmit, reset } = useForm<AgentForm>({
		defaultValues: {
			name: "",
			description: "",
			instructions: "",
			modelId: "",
			maxTurns: "",
			maxReflections: "",
			maxSubagentDepth: "",
			maxSubagentsPerRun: "",
			maxSpawnsPerTurn: "",
			knowledge: [],
			toolboxes: [],
			skills: [],
			prompts: [],
		},
	});

	const models = usePixel<ModelEngine[]>(`MyEngines(engineTypes=['MODEL']);`);
	const modelOptions = useMemo(
		() => (models.data ?? []).filter((m) => m.tag !== "embeddings"),
		[models.data],
	);

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
			const mcp = [...data.knowledge, ...data.toolboxes];
			const skills = data.skills.map((s) => s.id);
			const { errors } = await monolithStore.runQuery(
				`EditWorkspace(workspaceId=["${workspace.appId}"], name=${JSON.stringify(data.name)}, description=${JSON.stringify(data.description)}, systemPrompt=${JSON.stringify(data.instructions)}, mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)}, modelId=${JSON.stringify(data.modelId)}, maxTurns=${JSON.stringify(data.maxTurns)}, maxReflections=${JSON.stringify(data.maxReflections)}, maxSubagentDepth=${JSON.stringify(data.maxSubagentDepth)}, maxSubagentsPerRun=${JSON.stringify(data.maxSubagentsPerRun)}, maxSpawnsPerTurn=${JSON.stringify(data.maxSpawnsPerTurn)});`,
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
						{/* About */}
						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									About
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Basic information about your agent
								</Muted>
							</div>
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
							<Controller
								name="modelId"
								control={control}
								render={({ field }) => (
									<Field>
										<FieldLabel htmlFor={modelFieldId}>
											Default model
										</FieldLabel>
										<Select
											value={field.value}
											onValueChange={field.onChange}
											disabled={
												models.status === "LOADING"
											}
										>
											<SelectTrigger id={modelFieldId}>
												<SelectValue
													placeholder={
														models.status ===
														"LOADING"
															? "Loading..."
															: "Use room model"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{modelOptions.map((m) => (
													<SelectItem
														key={m.engine_id}
														value={m.engine_id}
													>
														{m.engine_name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
							/>
						</div>

						<Separator />

						{/* Knowledge */}
						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									Knowledge
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Add knowledge sources for your agent
								</Muted>
							</div>
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
						</div>

						<Separator />

						{/* Toolboxes */}
						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									Toolboxes
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Add tools and capabilities to your agent
								</Muted>
							</div>
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
						</div>

						<Separator />

						{/* Skills */}
						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									Skills
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Add reusable skills to your agent
								</Muted>
							</div>
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
						</div>

						<Separator />

						{/* Prompts */}
						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									Prompts
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Pre-configured prompts for your agent
								</Muted>
							</div>
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
						</div>

						<Separator />

						{/* Execution Limits */}
						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									Execution limits
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Runtime caps for the agent's tool loop and
									subagent delegation. Leave a field blank to
									fall back to its default.
								</Muted>
							</div>
							<Controller
								name="maxTurns"
								control={control}
								render={({ field }) => (
									<Field>
										<FieldLabel htmlFor={maxTurnsId}>
											Max turns
										</FieldLabel>
										<Input
											id={maxTurnsId}
											type="number"
											min={1}
											placeholder="30 (default)"
											{...field}
										/>
									</Field>
								)}
							/>
							<Controller
								name="maxReflections"
								control={control}
								render={({ field }) => (
									<Field>
										<FieldLabel htmlFor={maxReflectionsId}>
											Max reflections
										</FieldLabel>
										<Input
											id={maxReflectionsId}
											type="number"
											min={0}
											placeholder="0 (default, off)"
											{...field}
										/>
									</Field>
								)}
							/>
							<Controller
								name="maxSubagentDepth"
								control={control}
								render={({ field }) => (
									<Field>
										<FieldLabel
											htmlFor={maxSubagentDepthId}
										>
											Max subagent depth
										</FieldLabel>
										<Input
											id={maxSubagentDepthId}
											type="number"
											min={0}
											placeholder="1 (default; 0 disables subagents)"
											{...field}
										/>
									</Field>
								)}
							/>
							<Controller
								name="maxSubagentsPerRun"
								control={control}
								render={({ field }) => (
									<Field>
										<FieldLabel
											htmlFor={maxSubagentsPerRunId}
										>
											Max subagents per run
										</FieldLabel>
										<Input
											id={maxSubagentsPerRunId}
											type="number"
											min={0}
											placeholder="10 (default)"
											{...field}
										/>
									</Field>
								)}
							/>
							<Controller
								name="maxSpawnsPerTurn"
								control={control}
								render={({ field }) => (
									<Field>
										<FieldLabel
											htmlFor={maxSpawnsPerTurnId}
										>
											Max spawns per turn
										</FieldLabel>
										<Input
											id={maxSpawnsPerTurnId}
											type="number"
											min={0}
											placeholder="5 (default)"
											{...field}
										/>
									</Field>
								)}
							/>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};
