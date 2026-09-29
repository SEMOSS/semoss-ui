import { MessageSquareText } from "lucide-react";
import { Fragment, type ReactNode, useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	cn,
	FieldDescription,
	FieldLegend,
	FieldSet,
	Muted,
	Separator,
} from "@semoss/ui/next";
import type { Engine, Project } from "../../types";
import { EngineSubtypeIcon } from "../engine-subtype-icon";
import { getMcpTypeIcon } from "../mcp/mcp-utils";
import {
	type AgentLinks,
	type AgentWorkspace,
	getAgentMcpName,
	PIXEL_HOOK_KIND,
} from "./agent.types";
import { AgentBuiltinToolsView } from "./agent-builtin-tools-view";
import { AgentHookHeader } from "./agent-hook-header";
import {
	AGENT_DELEGATION_LIMITS,
	AGENT_LIMIT_TILE_CLASS_NAME,
	AGENT_RUN_BUDGET_LIMITS,
	type AgentLimitConfig,
	getAgentLimitValues,
	useAgentLimitFormat,
} from "./agent-limits";
import { AgentReadOnlyValue } from "./agent-read-only-value";
import { AgentResourceList } from "./agent-resource-list";
import { AgentSection } from "./agent-section";

type AgentResourceSection = "knowledge" | "toolboxes" | "skills" | "prompts";

export interface AgentDefinitionProps extends AgentLinks {
	/** Keeps the host's existing description and instructions controls. */
	aboutContent?: ReactNode;
	/** Existing resource sections, including their headings and actions. */
	sectionOverrides?: Partial<Record<AgentResourceSection, ReactNode>>;
	/** Presentation of sections; plain preserves the platform editor's layout. */
	variant?: "plain" | "cards";
	/** The agent's `GetWorkspace` response. */
	workspace: AgentWorkspace;
	/** Extra classes for the root. */
	className?: string;
}

/**
 * Read-only view of an agent's full definition: about, model, built-in
 * tools, attached resources, subagents, execution limits and hooks. Hosts
 * pass the `GetWorkspace` response and their own link builders.
 */
export const AgentDefinition = ({
	workspace,
	aboutContent,
	sectionOverrides,
	variant = "plain",
	getMcpUrl,
	getSkillUrl,
	getPromptUrl,
	getAgentUrl,
	className,
}: AgentDefinitionProps) => {
	const { t } = useTranslation("agent");
	const { formatValue } = useAgentLimitFormat();
	const config = workspace.config_json ?? {};
	const modelId = config.model_id ?? "";
	const subagentIds = (config.subagents ?? [])
		.map((s) => s.workspaceId)
		.filter(Boolean);

	// Names for the ids GetWorkspace only returns as ids. Skipped when there
	// is nothing to resolve.
	const models = usePixel<Engine[]>(
		modelId ? `META | MyEngines(metaKeys=[], engineTypes=["MODEL"]);` : "",
	);
	const agents = usePixel<Project[]>(
		subagentIds.length
			? `META | MyProjects(metaKeys=["description"], projectType=["WORKSPACE"]);`
			: "",
	);
	const agentsById = useMemo(
		() => new Map((agents.data ?? []).map((p) => [p.project_id, p])),
		[agents.data],
	);
	const model = (models.data ?? []).find((m) => m.engine_id === modelId);

	const mcps = workspace.mcp ?? [];
	const knowledge = mcps.filter((m) => m.type === "VECTOR");
	const toolboxes = mcps.filter((m) => m.type !== "VECTOR");
	const limitValues = getAgentLimitValues(workspace);
	const hooks = config.hooks ?? [];

	const renderLimit = (limit: AgentLimitConfig) => (
		<div key={limit.name} className={AGENT_LIMIT_TILE_CLASS_NAME}>
			<AgentReadOnlyValue
				label={t(`limits.${limit.name}.label`)}
				description={t(`limits.${limit.name}.description`)}
			>
				<span className="font-semibold text-base">
					{formatValue(limitValues[limit.name], limit)}
				</span>
			</AgentReadOnlyValue>
		</div>
	);

	const sections = [
		<AgentSection
			key="about"
			title={t("sections.about.title")}
			description={t("sections.about.description")}
		>
			{aboutContent ?? (
				<>
					<AgentReadOnlyValue
						label={t("about.description")}
						emptyLabel={t("about.noDescription")}
					>
						{workspace.description}
					</AgentReadOnlyValue>
					<AgentReadOnlyValue
						label={t("about.instructions")}
						emptyLabel={t("about.noInstructions")}
						multiline
					>
						{workspace.system_prompt}
					</AgentReadOnlyValue>
				</>
			)}
			<AgentReadOnlyValue
				label={t("about.greeting")}
				emptyLabel={t("about.greetingOff")}
				multiline
				description={
					config.greeting_enabled && config.greeting
						? t("about.greetingHelp")
						: undefined
				}
			>
				{config.greeting_enabled ? config.greeting : null}
			</AgentReadOnlyValue>
			<AgentReadOnlyValue label={t("about.defaultModel")}>
				{modelId ? (
					<div className="flex min-w-0 items-center gap-2">
						{model && (
							<EngineSubtypeIcon
								engineType={model.engine_type}
								engineSubtype={model.engine_subtype}
								alt=""
								className="size-5 shrink-0 object-contain"
							/>
						)}
						<span className="truncate">
							{model
								? model.engine_display_name || model.engine_name
								: models.status === "LOADING"
									? t("about.loading")
									: modelId}
						</span>
						<Muted
							className="truncate font-normal text-xs"
							title={modelId}
						>
							{modelId}
						</Muted>
					</div>
				) : (
					t("about.roomModel")
				)}
			</AgentReadOnlyValue>
		</AgentSection>,
		<AgentSection
			key="builtInTools"
			title={t("sections.builtInTools.title")}
			description={t("sections.builtInTools.description")}
		>
			<AgentBuiltinToolsView
				tools={workspace.default_tools ?? []}
				enabled={config.use_default_agent_tools ?? true}
				disabledToolNames={
					config.tool_policy?.default_tools?.disabled ?? []
				}
			/>
		</AgentSection>,
		<AgentSection
			key="knowledge"
			title={t("sections.knowledge.title")}
			description={t("sections.knowledge.description")}
		>
			<AgentResourceList
				emptyLabel={t("empty.knowledge")}
				items={knowledge.map((m) => ({
					id: m.id,
					title: getAgentMcpName(m),
					description: m.description,
					icon: getMcpTypeIcon(m.type),
					href: getMcpUrl?.(m),
				}))}
			/>
		</AgentSection>,
		<AgentSection
			key="toolboxes"
			title={t("sections.toolboxes.title")}
			description={t("sections.toolboxes.description")}
		>
			<AgentResourceList
				emptyLabel={t("empty.toolboxes")}
				items={toolboxes.map((m) => ({
					id: m.id,
					title: getAgentMcpName(m),
					description: m.description || t(`mcpType.${m.type}`),
					icon:
						m.type === "PROJECT"
							? undefined
							: getMcpTypeIcon(m.type),
					href: getMcpUrl?.(m),
				}))}
			/>
		</AgentSection>,
		<AgentSection
			key="skills"
			title={t("sections.skills.title")}
			description={t("sections.skills.description")}
		>
			<AgentResourceList
				emptyLabel={t("empty.skills")}
				items={(workspace.skills ?? []).map((s) => ({
					id: s.id,
					title: s.name,
					description: s.description,
					href: getSkillUrl?.(s.id),
				}))}
			/>
		</AgentSection>,
		<AgentSection
			key="prompts"
			title={t("sections.prompts.title")}
			description={t("sections.prompts.description")}
		>
			<AgentResourceList
				emptyLabel={t("empty.prompts")}
				items={(workspace.prompts ?? []).map((p) => ({
					id: p.id,
					title: p.name || p.id,
					icon: MessageSquareText,
					href: getPromptUrl?.(p.id),
				}))}
			/>
		</AgentSection>,
		<AgentSection
			key="subagents"
			title={t("sections.subagents.title")}
			description={t("sections.subagents.description")}
		>
			<AgentResourceList
				emptyLabel={t("empty.subagents")}
				items={subagentIds.map((id) => {
					const agent = agentsById.get(id);
					return {
						id,
						title: agent
							? agent.project_display_name || agent.project_name
							: agents.status === "LOADING"
								? t("about.loading")
								: t("resource.unavailableAgent"),
						description: agent ? agent.description : id,
						href: agent ? getAgentUrl?.(id) : undefined,
					};
				})}
			/>
		</AgentSection>,
		<AgentSection
			key="executionLimits"
			title={t("sections.executionLimits.title")}
			description={t("sections.executionLimits.description")}
		>
			<div className="flex flex-col gap-6">
				<FieldSet className="gap-4">
					<div>
						<FieldLegend variant="label" className="mb-1">
							{t("limits.runBudget.title")}
						</FieldLegend>
						<FieldDescription>
							{t("limits.runBudget.description")}
						</FieldDescription>
					</div>
					<div className="grid gap-4 md:grid-cols-3">
						{AGENT_RUN_BUDGET_LIMITS.map(renderLimit)}
					</div>
				</FieldSet>
				<FieldSet className="gap-4">
					<div>
						<FieldLegend variant="label" className="mb-1">
							{t("limits.delegation.title")}
						</FieldLegend>
						<FieldDescription>
							{t("limits.delegation.description")}
						</FieldDescription>
					</div>
					<div className="grid gap-4 md:grid-cols-3">
						{AGENT_DELEGATION_LIMITS.map(renderLimit)}
					</div>
				</FieldSet>
			</div>
		</AgentSection>,
		<AgentSection
			key="hooks"
			title={t("sections.hooks.title")}
			description={t("sections.hooks.description")}
		>
			{hooks.length === 0 ? (
				<Muted className="font-normal">{t("empty.hooks")}</Muted>
			) : (
				<ul className="flex flex-col gap-2">
					{hooks.map((hook, index) => (
						<li
							// Hooks have no id; order is stable for a read-only view
							// biome-ignore lint/suspicious/noArrayIndexKey: see above
							key={index}
							className="flex flex-col gap-3 rounded-md border border-border bg-card p-4"
						>
							<AgentHookHeader kind={hook.kind} />
							{hook.kind === PIXEL_HOOK_KIND && (
								<>
									<pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
										{hook.pixel || t("hooks.noPixel")}
									</pre>
									<div className="flex flex-wrap items-center gap-1.5">
										<Muted className="font-normal text-xs">
											{t("hooks.runsOn")}
										</Muted>
										{hook.events?.length ? (
											hook.events.map((event) => (
												<Badge
													key={event}
													variant="outline"
													className="font-mono"
												>
													{event}
												</Badge>
											))
										) : (
											<Badge variant="outline">
												{t("hooks.everyEvent")}
											</Badge>
										)}
									</div>
								</>
							)}
						</li>
					))}
				</ul>
			)}
		</AgentSection>,
	];

	return (
		<div className={cn("flex w-full min-w-0 flex-col gap-6", className)}>
			{sections.map((section, index) => {
				const key = section.key;
				const override =
					key === "knowledge" ||
					key === "toolboxes" ||
					key === "skills" ||
					key === "prompts"
						? sectionOverrides?.[key]
						: undefined;
				return (
					<Fragment key={section.key}>
						{variant === "plain" && index > 0 && <Separator />}
						{override ??
							(variant === "cards" ? (
								<div className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
									{section}
								</div>
							) : (
								section
							))}
					</Fragment>
				);
			})}
		</div>
	);
};
