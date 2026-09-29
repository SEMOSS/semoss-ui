import { BotIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	AgentForm,
	type AgentFormValues,
	type AgentWorkspace,
	buildEditWorkspacePixel,
	getWorkspaceSaveWarning,
	toAgentFormValues,
	toAgentPromptTitles,
} from "@semoss/shared";
import { Spinner, toast } from "@semoss/ui/next";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@semoss/workbench";
import { useWorkbenchControl, useWorkbenchPanel } from "@semoss/workbench";
import { AgentDefinitionView } from "@/components/agent-workspace/agent-viewer";
import { useProject } from "@/hooks";
import { CLIENT_AGENT_LINKS } from "@/utility";
import { AgentEditorSaveControl } from "./agent-editor-save-control";

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
	const { data: response, status } = usePixel<AgentWorkspace>(
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
			setFormValues(toAgentFormValues(response));
		}
	}, [status, response]);

	const onSave = useCallback(async () => {
		if (readOnly || !formValues) return;
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
	}, [readOnly, formValues, insight, project.project_id]);

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
			) : readOnly ? (
				// Users who cannot edit get the read-only definition instead of
				// a disabled form
				<AgentDefinitionView
					workspace={response}
					className="px-6 py-6"
				/>
			) : (
				<AgentForm
					data={formValues}
					onChange={setFormValues}
					disabled={isLoading}
					promptTitles={toAgentPromptTitles(response)}
					knownHookKinds={response.known_hook_kinds ?? []}
					defaultTools={response.default_tools ?? []}
					workspaceId={project.project_id}
					links={CLIENT_AGENT_LINKS}
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
