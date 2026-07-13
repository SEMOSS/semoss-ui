import { AlertTriangleIcon, SaveIcon } from "lucide-react";
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
import { AgentSdkUsage } from "./agent-sdk-usage";
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

type ConfigJsonResult =
	| { status: "absent" }
	| { status: "ok"; value: { subagents?: unknown } }
	| { status: "malformed"; reason: string };

const parseConfigJson = (raw: unknown): ConfigJsonResult => {
	if (raw == null) return { status: "absent" };
	if (typeof raw === "string") {
		if (raw.trim().length === 0) return { status: "absent" };
		try {
			const parsed = JSON.parse(raw);
			if (
				parsed &&
				typeof parsed === "object" &&
				!Array.isArray(parsed)
			) {
				return {
					status: "ok",
					value: parsed as { subagents?: unknown },
				};
			}
			return {
				status: "malformed",
				reason: "config_json parsed but is not a JSON object.",
			};
		} catch (e) {
			return {
				status: "malformed",
				reason: (e as Error).message || "invalid JSON",
			};
		}
	}
	if (typeof raw === "object" && !Array.isArray(raw)) {
		return { status: "ok", value: raw as { subagents?: unknown } };
	}
	return {
		status: "malformed",
		reason: `config_json has unexpected type ${typeof raw}`,
	};
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

type NameLookupResult = {
	names: Map<string, string>;
	lookupFailed: boolean;
};

const fetchWorkspaceNames = async (
	monolithStore: MonolithStore,
	ids: string[],
): Promise<NameLookupResult> => {
	const names = new Map<string, string>();
	if (ids.length === 0) return { names, lookupFailed: false };
	try {
		const { errors, pixelReturn } = await monolithStore.runQuery<
			[WorkspaceNameRow[]]
		>(
			`META | MyProjects(project=${JSON.stringify(ids)}, noMeta=[true], limit=[${ids.length}], offset=[0]);`,
		);
		if (errors.length > 0) {
			console.warn("fetchWorkspaceNames: pixel errors", errors);
			return { names, lookupFailed: true };
		}
		const rows = pixelReturn[0]?.output ?? [];
		for (const row of rows) {
			if (row?.project_id) {
				names.set(
					row.project_id,
					row.project_display_name || row.project_name || "",
				);
			}
		}
		return { names, lookupFailed: false };
	} catch (e) {
		console.warn("fetchWorkspaceNames: threw", e);
		return { names, lookupFailed: true };
	}
};

const ALIAS_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

type SubAgentValidation =
	| { ok: true; sanitized: SubAgentEntry[] }
	| { ok: false; message: string };

const validateSubAgentsForSave = (
	entries: SubAgentEntry[],
): SubAgentValidation => {
	const seenAliases = new Set<string>();
	const out: SubAgentEntry[] = [];
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		const alias = entry.alias.trim();
		const workspaceId = entry.workspaceId.trim();
		if (!alias && !workspaceId && !entry.description?.trim()) {
			continue;
		}
		if (!alias) {
			return {
				ok: false,
				message: `Subagent row ${i + 1}: alias is required.`,
			};
		}
		if (!ALIAS_PATTERN.test(alias)) {
			return {
				ok: false,
				message: `Subagent alias "${alias}" must start with a letter and contain only letters, numbers, or underscores.`,
			};
		}
		if (!workspaceId) {
			return {
				ok: false,
				message: `Subagent "${alias}" is missing a target workspace.`,
			};
		}
		if (seenAliases.has(alias)) {
			return {
				ok: false,
				message: `Duplicate subagent alias "${alias}" — each alias must be unique.`,
			};
		}
		seenAliases.add(alias);
		const description = entry.description?.trim();
		out.push({
			alias,
			workspaceId,
			...(description ? { description } : {}),
		});
	}
	return { ok: true, sanitized: out };
};

export const AgentEditor = () => {
	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();
	const [isLoading, setIsLoading] = useState(false);
	const [isFetching, setIsFetching] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [nameLookupFailed, setNameLookupFailed] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey is an intentional retry trigger
	useEffect(() => {
		const load = async () => {
			try {
				setIsFetching(true);
				setLoadError(null);
				setNameLookupFailed(false);
				const { errors, pixelReturn } = await monolithStore.runQuery<
					[GetWorkspaceResponse]
				>(`GetWorkspace(workspaceId=["${workspace.appId}"]);`);
				if (errors.length > 0) throw new Error(errors.join(", "));
				const data = pixelReturn[0].output;
				const allMcps = data.mcp ?? [];
				const configResult = parseConfigJson(data.config_json);
				if (configResult.status === "malformed") {
					throw new Error(
						`Workspace CONFIG_JSON is malformed (${configResult.reason}). ` +
							"Refusing to load — saving from a partial state would wipe subagent settings on the server.",
					);
				}
				const configJson =
					configResult.status === "ok" ? configResult.value : {};
				const subagents = coerceSubAgentEntries(configJson.subagents);
				const nameIds = subagents
					.map((s) => s.workspaceId.trim())
					.filter((id, i, arr) => id && arr.indexOf(id) === i);
				const nameLookup = await fetchWorkspaceNames(
					monolithStore,
					nameIds,
				);
				setNameLookupFailed(nameLookup.lookupFailed);
				for (const entry of subagents) {
					const name = nameLookup.names.get(entry.workspaceId.trim());
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
				const message =
					(e as Error).message || "Failed to load agent data";
				setLoadError(message);
				toast.error(message);
			} finally {
				setIsFetching(false);
			}
		};
		if (workspace.appId) load();
	}, [workspace.appId, monolithStore, reset, reloadKey]);

	const onSave = handleSubmit(async (data) => {
		if (loadError) {
			toast.error(
				"Cannot save — the workspace failed to load. Reload before editing to avoid overwriting the current server state.",
			);
			return;
		}
		const validation = validateSubAgentsForSave(data.subagents);
		if (!validation.ok) {
			toast.error(validation.message);
			return;
		}
		let workspaceSaved = false;
		try {
			setIsLoading(true);
			const mcp = [...data.knowledge, ...data.toolboxes];
			const skills = data.skills.map((s) => s.id);
			const { errors } = await monolithStore.runQuery(
				`EditWorkspace(workspaceId=["${workspace.appId}"], name=${JSON.stringify(data.name)}, description=${JSON.stringify(data.description)}, systemPrompt=${JSON.stringify(data.instructions)}, mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)});`,
			);
			if (errors.length > 0) throw new Error(errors.join(", "));
			workspaceSaved = true;

			const { errors: subagentErrors } = await monolithStore.runQuery(
				`SetSubAgents(workspaceId=["${workspace.appId}"], subagents=${JSON.stringify(validation.sanitized)});`,
			);
			if (subagentErrors.length > 0) {
				throw new Error(subagentErrors.join(", "));
			}

			toast.success("Agent saved");
		} catch (e) {
			console.error(e);
			const err = (e as Error).message || "Failed to save agent";
			if (workspaceSaved) {
				toast.error(
					`Workspace fields saved, but subagents failed: ${err}. Reload before retrying to avoid overwriting other state.`,
				);
				setLoadError("Subagents save failed — reload before retrying.");
			} else {
				toast.error(err);
			}
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
					disabled={isLoading || isFetching || !!loadError}
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

			{loadError ? (
				<div className="flex shrink-0 items-start gap-3 border-destructive/40 border-b bg-destructive/10 px-6 py-3">
					<AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
					<div className="flex flex-1 flex-col gap-1">
						<span className="font-medium text-destructive text-sm">
							Could not load this agent
						</span>
						<Muted className="text-muted-foreground text-xs leading-5">
							{loadError} Saving is disabled to prevent
							overwriting the current server state.
						</Muted>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setReloadKey((k) => k + 1)}
					>
						Reload
					</Button>
				</div>
			) : null}

			{nameLookupFailed ? (
				<div className="flex shrink-0 items-start gap-3 border-amber-500/40 border-b bg-amber-500/10 px-6 py-2">
					<AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
					<Muted className="flex-1 text-muted-foreground text-xs leading-5">
						Some subagent workspace names could not be resolved.
						They may be inaccessible to you rather than missing —
						avoid deleting rows marked "Unknown workspace" without
						checking with the workspace owner first.
					</Muted>
				</div>
			) : null}

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

						<Separator />

						<AgentSdkUsage workspaceId={workspace.appId} />
					</form>
				)}
			</div>
		</div>
	);
};
