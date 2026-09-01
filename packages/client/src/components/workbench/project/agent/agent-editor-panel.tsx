import { BotIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import type { MCPConfig, SkillConfig } from "@semoss/shared";
import { Spinner, toast } from "@semoss/ui/next";
import {
	type AgentDefaultTool,
	AgentForm,
	type AgentFormValues,
	buildEditWorkspacePixel,
	getWorkspaceSaveWarning,
} from "@/components/agent-workspace/agent-form";
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { AgentEditorSaveControl } from "./agent-editor-save-control";

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
}

/**
 * The agent configuration form for a WORKSPACE project. Loads/saves
 * `GetWorkspace`/`EditWorkspace` itself; `AgentForm` just renders the fields.
 * Save rides the panel's chrome control instead of an in-body toolbar.
 */
const AgentEditorPanel: WorkbenchComponent = ({ id, setValue }) => {
	const { project } = useProject();
	const insight = useInsight();
	// The insight's id resolves asynchronously after mount - fetching before
	// it's ready would run GetWorkspace a wasted first time against no insight.
	const { data: response, status } = usePixel<GetWorkspaceResponse>(
		insight.isReady
			? `GetWorkspace(workspaceId=["${project.project_id}"]);`
			: "",
	);
	const isFetching = status !== "SUCCESS";

	const [isLoading, setIsLoading] = useState(false);
	const [formValues, setFormValues] = useState<AgentFormValues | null>(null);

	// Seeds the editable copy once the fetch resolves; AgentForm owns edits
	// after that, so this doesn't re-run on every keystroke.
	useEffect(() => {
		if (status === "SUCCESS") {
			setFormValues(toFormValues(response));
		}
	}, [status, response]);

	const onSave = useCallback(async () => {
		if (!formValues) return;
		try {
			setIsLoading(true);
			const { pixelReturn } = await insight.actions.run<[unknown]>(
				buildEditWorkspacePixel(project.project_id, formValues),
			);
			const warning = getWorkspaceSaveWarning(pixelReturn[0]?.output);
			if (warning) {
				toast.warning(warning);
			} else {
				toast.success("Agent saved");
			}
		} catch (e) {
			console.error(e);
			toast.error((e as Error).message || "Failed to save agent");
		} finally {
			setIsLoading(false);
		}
	}, [formValues, insight, project.project_id]);

	useWorkbenchControl(id, AgentEditorSaveControl);

	// setValue is not identity-stable (it's rebuilt whenever this panel's own
	// value changes) - depending on it here would loop forever.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		setValue({ onSave, isLoading, isFetching });
	}, [onSave, isLoading, isFetching]);

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
					readOnly={isLoading}
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
