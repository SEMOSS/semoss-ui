import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { getFileIconComponent } from "@semoss/shared";
import { Muted, Spinner, toast } from "@semoss/ui/next";
import { useEngine } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	type LoadedMCPFile,
	type MCPJsonData,
	MCPJsonEditor,
	readMCPFile,
	toFileText,
} from "../../shared";

/** The config an MCP-editor instance is opened with. */
export interface EngineMcpEditorConfig {
	name: string;
	path: string;
}

export const EngineMcpEditorPanel: WorkbenchComponent<
	EngineMcpEditorConfig
> = ({ config }) => {
	const { engine, permission } = useEngine();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const insight = useInsight();

	const [loaded, setLoaded] = useState<LoadedMCPFile | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const readPixel = `GetEngineAssets(filePath=["${config.path}"], engine=["${engine.engine_id}"]);`;

	const getFile = usePixel<string>(readPixel, {
		onSuccess: (fileContent) => {
			// A parse failure is kept rather than swallowed, so the editor
			// can show the raw text instead of an empty tool list that a
			// save would write straight over the real file.
			setLoaded(readMCPFile(fileContent));
		},
		onError: () => {
			setLoaded(null);
		},
	});

	/**
	 * Re-reads the file so the editor can pick up changes made elsewhere,
	 * e.g. a hand edit of the raw JSON or a regeneration of the tools.
	 */
	const reloadFile = async (): Promise<string | null> => {
		try {
			const { pixelReturn } =
				await insight.actions.run<[string]>(readPixel);
			return toFileText(pixelReturn?.[0]?.output);
		} catch (e) {
			console.error(e);
			return null;
		}
	};

	/**
	 * Save the file
	 */
	const saveFile = async (data: MCPJsonData) => {
		try {
			setIsLoading(true);

			await insight.actions.run(
				`SaveEngineAssets(engine=["${engine.engine_id}"], filePath=["${config.path}"], content=["<encode>${JSON.stringify(
					data,
					null,
					2,
				)}</encode>"]);`,
			);

			toast.success("Successfully saved MCP tools");
		} catch (e) {
			toast.error("Error saving MCP tools");

			console.error(e);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="relative flex h-full w-full flex-col gap-1.5 overflow-hidden bg-background py-1">
			{(getFile.status === "LOADING" || isLoading) && (
				<div className="flex flex-1 items-center justify-center py-4">
					<Spinner />
				</div>
			)}
			{getFile.status === "ERROR" && (
				<div className="flex flex-1 items-center justify-center py-4">
					<Muted className="text-destructive">
						{getFile.error?.message || "Failed to load editor"}
					</Muted>
				</div>
			)}
			{getFile.status === "SUCCESS" && loaded && (
				<div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
					<MCPJsonEditor
						readOnly={readOnly}
						dataMap={{
							initialData: loaded.initialData,
							rawContent: loaded.rawContent,
							loadError: loaded.loadError,
							onRefresh: reloadFile,
							onSave: (data) => saveFile(data),
							path: config.path,
							name: config.name,
						}}
					/>
				</div>
			)}
		</div>
	);
};

/**
 * Blueprint for engine MCP-editor instances. Instances dedupe on their file
 * path; keepAlive preserves in-editor edits across tab switches.
 */
export const ENGINE_MCP_EDITOR_PANEL: WorkbenchPanelConfig<EngineMcpEditorConfig> =
	{
		name: "Toolbox Editor",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		icon: ({ config, className }) => {
			const Icon = getFileIconComponent(config.name);
			return <Icon className={className} />;
		},
		content: EngineMcpEditorPanel,
	};
