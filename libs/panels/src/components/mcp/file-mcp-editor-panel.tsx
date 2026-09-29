import { useMemo, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Muted, Spinner, toast } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import {
	useWorkbenchPanel,
	WorkbenchPanelError,
	WorkbenchPanelLoading,
} from "@semoss/workbench";
import { useFilePanel } from "../../hooks/use-file-panel";
import {
	type FilePanelMode,
	matchesFilePanel,
} from "../../types/file-panel.types";
import type { MCPJsonData } from "../../types/mcp.types";
import {
	getFileReadPixel,
	getFileSavePixel,
} from "../../utility/file-panel.utility";
import { readMCPFile, toFileText } from "../../utility/mcp-json-utils";
import { FilePanelIcon } from "../file-panel-icon";
import { MCPJsonEditor } from ".";

/** MCP toolboxes are project- or engine-scoped; there is no insight variant. */
export interface FileMcpEditorParams {
	mode: Extract<FilePanelMode, { type: "APP" } | { type: "ENGINE" }>;
	name: string;
	path: string;
}

/** Edit an MCP toolbox JSON file in a project or engine resource. */
const FileMcpEditorPanel = ({ id }: WorkbenchPanelProps) => {
	const { config } = useWorkbenchPanel<FileMcpEditorParams>(id);

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

	// Gated inline rather than by early return, so every branch stays a child
	// of the same column. Each gate is that column's only child in its own
	// state -- every other branch requires `access.status === "ready"` -- so a
	// full-size gate fills the column without a flex override.
	return (
		<div className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden bg-background py-1">
			{access.status === "loading" && (
				<WorkbenchPanelLoading label="Loading resource access" />
			)}
			{access.status === "error" && (
				<WorkbenchPanelError
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
