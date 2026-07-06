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
	H4,
	Input,
	Muted,
	Separator,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useRootStore, useWorkspace } from "@/hooks";
import type { MonolithStore } from "@/stores";
import { mcpToPlatformUrl, promptToPlatformUrl } from "@/utility";
import {
	nextSubAgentKey,
	SubAgentEditor,
	type SubAgentEntry,
} from "./subagent-editor";

type AgentForm = {
	name: string;
	description: string;
	instructions: string;
	knowledge: MCPConfig[];
	toolboxes: MCPConfig[];
	skills: SkillConfig[];
	prompts: string[];
	subagents: SubAgentEntry[];
};

type GetWorkspaceResponse = {
	name: string;
	description: string;
	system_prompt: string;
	mcp: MCPConfig[];
	skills: SkillConfig[];
	prompts: { id: string; name: string; type: string }[];
	config_json?: unknown;
};

const parseConfigJson = (raw: unknown): { subagents?: unknown } | null => {
	if (raw == null) return null;
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw);
			return parsed && typeof parsed === "object"
				? (parsed as { subagents?: unknown })
				: null;
		} catch {
			return null;
		}
	}
	return typeof raw === "object" ? (raw as { subagents?: unknown }) : null;
};

const coerceSubAgentEntries = (raw: unknown): SubAgentEntry[] => {
	if (!Array.isArray(raw)) return [];
	return raw
		.filter(
			(e): e is SubAgentEntry =>
				!!e &&
				typeof (e as SubAgentEntry).alias === "string" &&
				typeof (e as SubAgentEntry).workspaceId === "string",
		)
		.map((e) => ({
			alias: e.alias,
			workspaceId: e.workspaceId,
			description:
				typeof e.description === "string" ? e.description : undefined,
			_key: nextSubAgentKey(),
		}));
};

type WorkspaceNameRow = {
	project_id: string;
	project_name?: string;
	project_display_name?: string;
};

const fetchWorkspaceNames = async (
	monolithStore: MonolithStore,
	ids: string[],
): Promise<Map<string, string>> => {
	const nameById = new Map<string, string>();
	if (ids.length === 0) return nameById;
	try {
		const { errors, pixelReturn } = await monolithStore.runQuery<
			[WorkspaceNameRow[]]
		>(
			`META | MyProjects(project=${JSON.stringify(ids)}, noMeta=[true], limit=[${ids.length}], offset=[0]);`,
		);
		if (errors.length > 0) return nameById;
		const rows = pixelReturn[0]?.output ?? [];
		for (const row of rows) {
			if (row?.project_id) {
				nameById.set(
					row.project_id,
					row.project_display_name || row.project_name || "",
				);
			}
		}
	} catch {
		// ignore — picker still shows the UUID with a warning icon
	}
	return nameById;
};

const sanitizeSubAgentsForSave = (
	entries: SubAgentEntry[],
): SubAgentEntry[] => {
	const seen = new Set<string>();
	const out: SubAgentEntry[] = [];
	for (const entry of entries) {
		const alias = entry.alias.trim();
		const workspaceId = entry.workspaceId.trim();
		if (!alias || !workspaceId || seen.has(alias)) continue;
		seen.add(alias);
		const description = entry.description?.trim();
		out.push({
			alias,
			workspaceId,
			...(description ? { description } : {}),
		});
	}
	return out;
};

export const AgentEditor = () => {
	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();
	const [isLoading, setIsLoading] = useState(false);
	const [isFetching, setIsFetching] = useState(true);

	const descId = useId();
	const instructionsId = useId();

	const { control, handleSubmit, reset } = useForm<AgentForm>({
		defaultValues: {
			name: "",
			description: "",
			instructions: "",
			knowledge: [],
			toolboxes: [],
			skills: [],
			prompts: [],
			subagents: [],
		},
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
				const configJson = parseConfigJson(data.config_json);
				const subagents = coerceSubAgentEntries(configJson?.subagents);
				const nameIds = subagents
					.map((s) => s.workspaceId.trim())
					.filter((id, i, arr) => id && arr.indexOf(id) === i);
				const nameById = await fetchWorkspaceNames(
					monolithStore,
					nameIds,
				);
				for (const entry of subagents) {
					const name = nameById.get(entry.workspaceId.trim());
					if (name) entry.workspaceName = name;
				}
				reset({
					name: data.name ?? "",
					description: data.description ?? "",
					instructions: data.system_prompt ?? "",
					knowledge: allMcps.filter((m) => m.type === "VECTOR"),
					toolboxes: allMcps.filter((m) => m.type !== "VECTOR"),
					skills: data.skills ?? [],
					prompts: (data.prompts ?? []).map((p) => p.id),
					subagents,
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
				`EditWorkspace(workspaceId=["${workspace.appId}"], name=${JSON.stringify(data.name)}, description=${JSON.stringify(data.description)}, systemPrompt=${JSON.stringify(data.instructions)}, mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)});`,
			);
			if (errors.length > 0) throw new Error(errors.join(", "));

			const subagents = sanitizeSubAgentsForSave(data.subagents);
			const { errors: subagentErrors } = await monolithStore.runQuery(
				`SetSubAgents(workspaceId=["${workspace.appId}"], subagents=${JSON.stringify(subagents)});`,
			);
			if (subagentErrors.length > 0) {
				throw new Error(subagentErrors.join(", "));
			}

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

						<div className="flex flex-col gap-3">
							<div>
								<H4 className="font-semibold text-base tracking-tight">
									Subagents
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									Named delegates the agent can call to hand
									off focused work to another workspace. Each
									becomes a tool named by its alias.
								</Muted>
							</div>
							<Controller
								name="subagents"
								control={control}
								render={({ field }) => (
									<SubAgentEditor
										values={field.value}
										onChange={field.onChange}
										currentWorkspaceId={workspace.appId}
									/>
								)}
							/>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};
