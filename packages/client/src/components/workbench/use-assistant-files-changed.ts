import { useCallback } from "react";
import {
	FILE_PANEL_EVENTS,
	type FilePanelMode,
	getFilePanelScope,
} from "@semoss/panels";
import { useWorkbench } from "@semoss/workbench";
import { toolFamily } from "@/components/assistant/assistant-tools";
import type { BuildRun, BuildTool } from "@/stores/assistant";

/**
 * Every tool a completed run — or any subagent run in its tree — invoked.
 *
 * The run tree is the only account we get of what an agent did: the assistant
 * reports tool calls, not the files they touched, so anything a workbench wants
 * to announce afterwards has to be read back out of here.
 *
 * @name runTreeTools
 * @param run - The completed root run.
 * @param runs - The assistant slice's full run map, for resolving subagents.
 * @return Every tool in the tree, in no particular order.
 */
export const runTreeTools = (
	run: BuildRun,
	runs: Record<string, BuildRun>,
): BuildTool[] => {
	const tools: BuildTool[] = [];
	const stack: BuildRun[] = [run];
	const seen = new Set<string>();
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current || seen.has(current.runId)) continue;
		seen.add(current.runId);
		tools.push(...current.tools);
		for (const childRunId of current.childRunIds) {
			const child = runs[childRunId];
			if (child) stack.push(child);
		}
	}
	return tools;
};

/**
 * Harness tools that run code in the working directory. Their names say
 * nothing about files, but the code can write them: the notebook agent saves
 * notebook JSON from Python, and BashCommand allows cp, mv, touch and python.
 */
const CODE_EXECUTION_TOOLS: ReadonlySet<string> = new Set([
	"BashCommand",
	"ExecuteNodeCode",
	"ExecutePythonCode",
]);

/**
 * Whether a tool call may have changed files: an edit-family tool, or one
 * that runs code.
 *
 * @name mayChangeFiles
 * @param tool - A tool from the run tree.
 * @return True when the panels in scope should re-read.
 */
const mayChangeFiles = (tool: BuildTool): boolean =>
	toolFamily(tool) === "edit" || CODE_EXECUTION_TOOLS.has(tool.name);

/**
 * The `onRunCompleted` a workbench wires so an agent's edits reach its panels.
 *
 * The assistant writes files behind every open panel's back and tells nobody:
 * before this, an agent could rewrite a file an editor was showing and the
 * editor would keep displaying — and saving — the old contents. Nine
 * workbenches mount the assistant; this is the one line each of them needs.
 *
 * It cannot say *which* files: the run reports tool calls, not paths, so the
 * announcement is scope-wide and every panel in that scope re-reads.
 *
 * @param mode - The scope this workbench's panels are showing.
 * @return A handler for `configure({ onRunCompleted })`.
 */
export const useAssistantFilesChanged = (
	mode: FilePanelMode,
): ((run: BuildRun, runs: Record<string, BuildRun>) => void) => {
	const emit = useWorkbench((state) => state.events.actions.emit);
	// a string, so the caller may pass a fresh mode literal every render
	const scope = getFilePanelScope(mode);

	return useCallback(
		(run: BuildRun, runs: Record<string, BuildRun>) => {
			if (runTreeTools(run, runs).some(mayChangeFiles)) {
				emit(FILE_PANEL_EVENTS.FILES_CHANGED, { scope });
			}
		},
		[emit, scope],
	);
};
