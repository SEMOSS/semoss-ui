import { useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Muted, Spinner, toast } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import {
	WorkbenchAccessError,
	WorkbenchAccessLoading,
} from "@semoss/workbench";
import {
	type MCPJsonData,
	MCPJsonEditor,
	readMCPFile,
	toFileText,
} from "../mcp";
import { type FilePanelMode, matchesFilePanel } from "./file-panel.mode";
import { getFileReadPixel, getFileSavePixel } from "./file-panel.utility";
import { FilePanelIcon } from "./file-panel-icon";
import { useFilePanel } from "./use-file-panel";

/** MCP toolboxes are project- or engine-scoped; there is no insight variant. */
export interface FileMcpEditorParams {
	mode: Extract<FilePanelMode, { type: "APP" } | { type: "ENGINE" }>;
	name: string;
	path: string;
}

/** Edit an MCP toolbox JSON file in a project or engine resource. */
const FileMcpEditorPanel = ({
	config,
}: WorkbenchPanelProps<FileMcpEditorParams>) => {
	const insight = useInsight();
	const panel = useFilePanel(config);
	const { access, readOnly, read } = panel;
	const [isSaving, setIsSaving] = useState(false);

	const loaded = useMemo(
		() => (read.status === "SUCCESS" ? readMCPFile(read.data) : null),
		[read.status, read.data],
	);

	/** Re-read the MCP file so external changes are reflected. */
	const reloadFile = async (): Promise<string | null> => {
		try {
			const { pixelReturn } = await insight.actions.run<[string]>(
				getFileReadPixel(config.mode, config.path),
			);
			return toFileText(pixelReturn?.[0]?.output);
		} catch (error) {
			console.error(error);
			return null;
		}
	};

	/** Persist an edited MCP document to its configured resource. */
	const saveFile = async (data: MCPJsonData) => {
		if (readOnly) return;

		try {
			setIsSaving(true);
			await insight.actions.run(
				getFileSavePixel(
					config.mode,
					config.path,
					JSON.stringify(data, null, 2),
				),
			);
			toast.success("Successfully saved MCP tools");
		} catch (error) {
			toast.error("Error saving MCP tools");
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	// gated inline rather than by early return: every branch is a flex child
	// of the same column, and `useFilePanel`'s full-panel gates are not
	return (
		<div className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden bg-background py-1">
			{access.status === "loading" && (
				<WorkbenchAccessLoading
					className="flex-1"
					label="Loading resource access"
				/>
			)}
			{access.status === "error" && (
				<WorkbenchAccessError
					className="flex-1"
					message={access.error}
					onRetry={() => void access.refresh()}
				/>
			)}
			{access.status === "ready" &&
				(read.status === "LOADING" || isSaving) && (
					<div className="flex flex-1 items-center justify-center py-4">
						<Spinner />
					</div>
				)}
			{access.status === "ready" && read.status === "ERROR" && (
				<div className="flex flex-1 items-center justify-center py-4">
					<Muted className="text-destructive" role="alert">
						{read.error?.message || "Failed to load editor"}
					</Muted>
				</div>
			)}
			{access.status === "ready" &&
				read.status === "SUCCESS" &&
				loaded && (
					<div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
						<MCPJsonEditor
							readOnly={readOnly}
							dataMap={{
								initialData: loaded.initialData,
								rawContent: loaded.rawContent,
								loadError: loaded.loadError,
								onRefresh: reloadFile,
								onSave: saveFile,
								path: config.path,
								name: config.name,
							}}
						/>
					</div>
				)}
			{panel.overlay}
		</div>
	);
};

/** Scope-aware MCP file editor blueprint shared by project and engine workbenches. */
export const FILE_MCP_EDITOR_PANEL: WorkbenchPanelConfig<FileMcpEditorParams> =
	{
		name: "Toolbox Editor",
		canRename: false,
		mount: "keepAlive",
		matches: matchesFilePanel,
		icon: FilePanelIcon,
		content: FileMcpEditorPanel,
	};
