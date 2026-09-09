import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { getFileIconComponent } from "@semoss/shared";
import { Muted, Spinner, toast } from "@semoss/ui/next";
import {
	type LoadedMCPFile,
	type MCPJsonData,
	MCPJsonEditor,
	readMCPFile,
	toFileText,
} from "@/components/shared";
import { useWorkbenchAccess } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { WorkbenchAccessError } from "../core/workbench-access-error";
import { WorkbenchAccessLoading } from "../core/workbench-access-loading";
export interface FileMcpEditorParams {
	type: "ENGINE" | "PROJECT";
	id: string;
	name: string;
	path: string;
}

/** Build the scoped pixel used to read an MCP file. */
const getFileMcpReadPixel = ({
	type,
	id,
	path,
}: Pick<FileMcpEditorParams, "type" | "id" | "path">): string =>
	type === "PROJECT"
		? `GetAppAssets(filePath=[${JSON.stringify(path)}], project=[${JSON.stringify(id)}]);`
		: `GetEngineAssets(filePath=[${JSON.stringify(path)}], engine=[${JSON.stringify(id)}]);`;

/** Build the scoped pixel used to save an MCP file. */
const getFileMcpSavePixel = (
	config: Pick<FileMcpEditorParams, "type" | "id" | "path">,
	data: MCPJsonData,
): string => {
	const content = `"<encode>${JSON.stringify(data, null, 2)}</encode>"`;
	return config.type === "PROJECT"
		? `SaveAppAssets(project=[${JSON.stringify(config.id)}], filePath=[${JSON.stringify(config.path)}], content=[${content}]);`
		: `SaveEngineAssets(engine=[${JSON.stringify(config.id)}], filePath=[${JSON.stringify(config.path)}], content=[${content}]);`;
};

const FileMcpEditorPanel = ({
	config,
}: WorkbenchPanelProps<FileMcpEditorParams>) => {
	const insight = useInsight();
	const access = useWorkbenchAccess(config.type, config.id);
	const readOnly = access.status !== "ready" || access.readOnly;
	const [loaded, setLoaded] = useState<LoadedMCPFile | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const readPixel = getFileMcpReadPixel(config);

	const getFile = usePixel<string>(
		access.status === "ready" ? readPixel : "",
		{
			onSuccess: (fileContent) => {
				setLoaded(readMCPFile(fileContent));
			},
			onError: () => {
				setLoaded(null);
			},
		},
	);

	/** Re-read the MCP file so external changes are reflected. */
	const reloadFile = async (): Promise<string | null> => {
		try {
			const { pixelReturn } =
				await insight.actions.run<[string]>(readPixel);
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
			setIsLoading(true);
			await insight.actions.run(getFileMcpSavePixel(config, data));
			toast.success("Successfully saved MCP tools");
		} catch (error) {
			toast.error("Error saving MCP tools");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

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
				(getFile.status === "LOADING" || isLoading) && (
					<div className="flex flex-1 items-center justify-center py-4">
						<Spinner />
					</div>
				)}
			{access.status === "ready" && getFile.status === "ERROR" && (
				<div className="flex flex-1 items-center justify-center py-4">
					<Muted className="text-destructive" role="alert">
						{getFile.error?.message || "Failed to load editor"}
					</Muted>
				</div>
			)}
			{access.status === "ready" &&
				getFile.status === "SUCCESS" &&
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
			{access.status === "ready" && access.refreshing ? (
				<WorkbenchAccessLoading
					className="absolute inset-0 bg-background/80"
					label="Refreshing resource access"
				/>
			) : null}
			{access.status === "ready" && access.refreshError ? (
				<WorkbenchAccessError
					className="absolute inset-0 bg-background/90"
					message={access.refreshError}
					onRetry={() => void access.refresh()}
				/>
			) : null}
		</div>
	);
};

/** Scope-aware MCP file editor blueprint shared by project and engine workbenches. */
export const FILE_MCP_EDITOR_PANEL: WorkbenchPanelConfig<FileMcpEditorParams> =
	{
		name: "Toolbox Editor",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) =>
			a.type === b.type && a.id === b.id && a.path === b.path,
		icon: ({ config, className }) => {
			const Icon = getFileIconComponent(config.name);
			return <Icon className={className} />;
		},
		content: FileMcpEditorPanel,
	};
