import { BotIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import type { MCPConfig, Project, SkillConfig } from "@semoss/shared";
import { Spinner, toast } from "@semoss/ui/next";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@semoss/workbench";
import { useWorkbenchControl, useWorkbenchPanel } from "@semoss/workbench";
import {
	type AgentDefaultTool,
	AgentForm,
	type AgentFormValues,
	buildEditWorkspacePixel,
	getWorkspaceSaveWarning,
} from "@/components/agent-workspace/agent-form";
import { useProject } from "@/hooks";
import { APP_BUILDER_AGENT } from "@/stores/assistant/assistant-agents";
import { AgentEditorSaveControl } from "./agent-editor-save-control";

/**
 * Tag Reporting Insights marks its MCP host project with — used to default
 * it onto the app-builder agent's toolboxes below.
 */
const REPORTING_INSIGHTS_MCP_HOST_TAG = "reporting-insights--mcp-host";

type GetWorkspaceResponse = {
	name: string;
	description: string;
	system_prompt: string;
	mcp: MCPConfig[];
	skills: SkillConfig[];
	prompts: { id: string; name: string; type: string }[];
	known_hook_kinds?: string[];
	default_tools?: AgentDefaultTool[];
	config_json?: {
		model_id?: string;
		use_default_agent_tools?: boolean;
		greeting?: string;
		greeting_enabled?: boolean;
		tool_policy?: {
			default_tools?: {
				disabled?: string[];
			};
		};
		budgets?: {
			max_turns?: number;
			max_reflections?: number;
			max_seconds?: number;
		};
		spawn_policy?: {
			max_subagent_depth?: number;
			max_subagents_per_run?: number;
			max_spawns_per_turn?: number;
		};
		subagents?: {
			workspaceId: string;
		}[];
		hooks?: {
			kind: string;
			pixel?: string;
			events?: string[];
		}[];
	};
};

/** Maps `GetWorkspace`'s response shape to `AgentForm`'s flat field values. */
function toFormValues(response: GetWorkspaceResponse): AgentFormValues {
	const allMcps = response.mcp ?? [];
	return {
		name: response.name ?? "",
		description: response.description ?? "",
		instructions: response.system_prompt ?? "",
		modelId: response.config_json?.model_id ?? "",
		useDefaultAgentTools:
			response.config_json?.use_default_agent_tools ?? true,
		greeting: response.config_json?.greeting ?? "",
		greetingEnabled: response.config_json?.greeting_enabled ?? false,
		disabledDefaultTools:
			response.config_json?.tool_policy?.default_tools?.disabled ?? [],
		maxTurns: response.config_json?.budgets?.max_turns?.toString() ?? "",
		maxReflections:
			response.config_json?.budgets?.max_reflections?.toString() ?? "",
		maxSeconds:
			response.config_json?.budgets?.max_seconds?.toString() ?? "",
		maxSubagentDepth:
			response.config_json?.spawn_policy?.max_subagent_depth?.toString() ??
			"",
		maxSubagentsPerRun:
			response.config_json?.spawn_policy?.max_subagents_per_run?.toString() ??
			"",
		maxSpawnsPerTurn:
			response.config_json?.spawn_policy?.max_spawns_per_turn?.toString() ??
			"",
		knowledge: allMcps.filter((m) => m.type === "VECTOR"),
		toolboxes: allMcps.filter((m) => m.type !== "VECTOR"),
		skills: response.skills ?? [],
		prompts: (response.prompts ?? []).map((p) => p.id),
		subagents: (response.config_json?.subagents ?? []).map((s) => ({
			workspaceId: s.workspaceId,
		})),
		hooks: response.config_json?.hooks ?? [],
	};
}

/** Save state the panel publishes to its chrome control (see `AgentEditorSaveControl`). */
export interface AgentEditorSaveValue {
	onSave: () => void;
	isLoading: boolean;
	isFetching: boolean;
	readOnly: boolean;
}

/**
 * The agent configuration form for a WORKSPACE project. Loads/saves
 * `GetWorkspace`/`EditWorkspace` itself; `AgentForm` just renders the fields.
 * Save rides the panel's chrome control instead of an in-body toolbar.
 */
const AgentEditorPanel: WorkbenchComponent = ({ id }) => {
	const { setValue } = useWorkbenchPanel(id);

	const { project, permission } = useProject();
	const insight = useInsight();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	// The insight's id resolves asynchronously after mount - fetching before
	// it's ready would run GetWorkspace a wasted first time against no insight.
	const { data: response, status } = usePixel<GetWorkspaceResponse>(
		insight.isReady
			? `GetWorkspace(workspaceId=["${project.project_id}"]);`
			: "",
	);
	const isFetching = status !== "SUCCESS";

	// The app-builder agent should always have Reporting Insights' dashboard
	// tools available — best-effort lookup, only needed for that one agent.
	const isAppBuilderAgent =
		project.project_id === APP_BUILDER_AGENT.workspace_id;
	const { data: reportingInsightsHosts } = usePixel<Project[]>(
		isAppBuilderAgent
			? `MyProjects(metaKeys=["tag"], metaFilters=[${JSON.stringify({
					tag: [REPORTING_INSIGHTS_MCP_HOST_TAG],
				})}], limit=[1], offset=[0]);`
			: "",
		{ data: [] },
	);
	const reportingInsightsHost = reportingInsightsHosts[0];

	const [isLoading, setIsLoading] = useState(false);
	const [formValues, setFormValues] = useState<AgentFormValues | null>(null);

	const saveWorkspace = useCallback(
		async (values: AgentFormValues, savedMessage = "Agent saved") => {
			if (readOnly) return;
			try {
				setIsLoading(true);
				const { pixelReturn } = await insight.actions.run<[unknown]>(
					buildEditWorkspacePixel(project.project_id, values),
				);
				const warning = getWorkspaceSaveWarning(pixelReturn[0]?.output);
				if (warning) {
					toast.warning(warning);
				} else {
					toast.success(savedMessage);
				}
			} catch (e) {
				console.error(e);
				toast.error((e as Error).message || "Failed to save agent");
			} finally {
				setIsLoading(false);
			}
		},
		[readOnly, insight, project.project_id],
	);

	// Seeds the editable copy once the fetch resolves; AgentForm owns edits
	// after that, so this doesn't re-run on every keystroke. For the
	// app-builder agent, self-heal Reporting Insights back into the toolboxes
	// list if it's ever missing (e.g. a fresh/reseeded agent record) - and
	// persist that immediately, since RunAgent reads the saved record, not
	// this form's local state.
	useEffect(() => {
		if (status !== "SUCCESS") return;
		const values = toFormValues(response);
		const needsReportingInsights =
			isAppBuilderAgent &&
			reportingInsightsHost &&
			!values.toolboxes.some(
				(t) => t.id === reportingInsightsHost.project_id,
			);
		if (needsReportingInsights) {
			values.toolboxes = [
				...values.toolboxes,
				{
					type: "PROJECT",
					id: reportingInsightsHost.project_id,
					name:
						reportingInsightsHost.project_display_name ||
						reportingInsightsHost.project_name,
				},
			];
		}
		setFormValues(values);
		if (needsReportingInsights) {
			void saveWorkspace(
				values,
				"Added Reporting Insights to this agent's toolboxes",
			);
		}
	}, [
		status,
		response,
		isAppBuilderAgent,
		reportingInsightsHost,
		saveWorkspace,
	]);

	const onSave = useCallback(() => {
		if (!formValues) return;
		void saveWorkspace(formValues);
	}, [formValues, saveWorkspace]);

	useWorkbenchControl(id, AgentEditorSaveControl);

	// setValue is not identity-stable (it's rebuilt whenever this panel's own
	// value changes) - depending on it here would loop forever.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		setValue({ onSave, isLoading, isFetching, readOnly });
	}, [onSave, isLoading, isFetching, readOnly]);

	return (
		<div className="h-full w-full overflow-auto">
			{isFetching || !formValues ? (
				<div className="flex h-full items-center justify-center">
					<Spinner />
				</div>
			) : (
				<AgentForm
					data={formValues}
					onChange={setFormValues}
					readOnly={readOnly || isLoading}
					knownHookKinds={response.known_hook_kinds ?? []}
					defaultTools={response.default_tools ?? []}
				/>
			)}
		</div>
	);
};

/**
 * Blueprint for the agent editor. keepAlive: unsaved form edits survive tab
 * switches.
 */
export const AGENT_EDITOR_PANEL: WorkbenchPanelConfig = {
	name: "Agent",
	helpText: "Agent Editor",
	icon: ({ className }) => <BotIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: AgentEditorPanel,
};
