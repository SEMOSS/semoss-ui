import { CircleX } from "lucide-react";
import { useState } from "react";
import { runPixel } from "@semoss/sdk";
import { useNotification } from "@semoss/ui";
import { Badge } from "@semoss/ui/next";
import { FileEditorPanel } from "./FileEditorPanel";
import FileExplorerPanel from "./FileExplorerPanel";
import { MCPJsonEditor } from "./MCPjsonEditor";
import { isMCPJsonData, type MCPJsonData } from "./types";

interface FileManagerProps {
	engineId: string;
	insightId: string;
	openOverlay: (component: () => JSX.Element) => void;
	closeOverlay: () => void;
	setLoading: (loading: boolean) => void;
}

const getFileNameFromPath = (path: string): string => {
	if (!path) return "";
	const parts = path.split(/[/\\]/);
	return parts[parts.length - 1] ?? "";
};

const parseMCPJson = (payload: unknown): MCPJsonData | null => {
	try {
		if (typeof payload === "string") {
			const parsed = JSON.parse(payload);
			return isMCPJsonData(parsed) ? parsed : null;
		} else if (isMCPJsonData(payload)) {
			return payload;
		} else {
			return null;
		}
	} catch {
		return null;
	}
};

export const FileManager = (props: FileManagerProps) => {
	const { engineId, insightId, setLoading, openOverlay, closeOverlay } =
		props;
	const notification = useNotification();

	const [openFiles, setOpenFiles] = useState<string[]>([]);
	const [activeFilePath, setActiveFilePath] = useState<string>("");
	const [unSavedFiles, setUnSavedFiles] = useState<Record<string, boolean>>(
		{},
	);

	const [mcpDataMap, setMcpDataMap] = useState<Record<string, MCPJsonData>>(
		{},
	);

	const [mcpEditorMap, setMcpEditorMap] = useState<Record<string, boolean>>(
		{},
	);

	const handleFileUnsaved = (path: string) => {
		setUnSavedFiles((prev) => ({ ...prev, [path]: true }));
	};

	const handleFileSaved = (path: string) => {
		setUnSavedFiles((prev) => ({ ...prev, [path]: false }));
	};

	const handleFileSelect = (path: string) => {
		if (!path || path.endsWith("/")) {
			setActiveFilePath("");
			return;
		}

		setOpenFiles((prev) => {
			if (prev.includes(path)) {
				return prev;
			}
			return [...prev, path];
		});

		setActiveFilePath(path);
	};

	const handleCloseFile = (path: string) => {
		setOpenFiles((prev) => {
			const remaining = prev.filter((p) => p !== path);

			if (remaining.length === 0) {
				setActiveFilePath("");
			} else if (path === activeFilePath) {
				setActiveFilePath(remaining[remaining.length - 1]);
			}

			return remaining;
		});

		setMcpDataMap((prevMap) => {
			if (!(path in prevMap)) return prevMap;
			const next = { ...prevMap };
			delete next[path];
			return next;
		});
		setMcpEditorMap((prev) => {
			if (!(path in prev)) return prev;
			const next = { ...prev };
			delete next[path];
			return next;
		});
	};
	const normalizePath = (path: string): string =>
		path
			.replace(/\\/g, "/")
			.replace(/\/+/g, "/")
			.replace(/^\/+/, "")
			.replace(/\/$/, "");

	const handleDeleteFromExplorer = (deletedPath: string) => {
		const deleted = normalizePath(deletedPath);
		const isFolder = deletedPath.endsWith("/");

		setOpenFiles((prev) => {
			const next = prev.filter((p) => {
				const current = normalizePath(p);

				const exactMatch = current === deleted;
				const childMatch = current.startsWith(deleted + "/");
				if (isFolder) {
					return !exactMatch && !childMatch;
				}

				return !exactMatch;
			});

			if (next.length === 0) {
				setActiveFilePath("");
			} else {
				const activeNorm = normalizePath(activeFilePath);
				const stillExists = next.some(
					(p) => normalizePath(p) === activeNorm,
				);

				if (!stillExists) {
					setActiveFilePath(next[next.length - 1]);
				}
			}

			setMcpDataMap((prevMap) => {
				const nextMap = { ...prevMap };
				Object.keys(nextMap).forEach((p) => {
					if (!next.includes(p)) delete nextMap[p];
				});
				return nextMap;
			});

			setMcpEditorMap((prev) => {
				const nextMap = { ...prev };
				Object.keys(nextMap).forEach((p) => {
					if (!next.includes(p)) delete nextMap[p];
				});
				return nextMap;
			});

			return next;
		});
	};

	const addMCPEditorTab = (json: unknown, path: string) => {
		if (!path) return;

		const mcpTabPath = `${path}#mcp`;

		if (mcpEditorMap[mcpTabPath]) {
			setActiveFilePath(mcpTabPath);
			return;
		}

		const parsed = parseMCPJson(json);
		if (!parsed) {
			notification.add({
				message: "Failed to parse MCP JSON from response.",
				color: "error",
			});
			return;
		}

		setOpenFiles((prev) => {
			if (!prev.includes(mcpTabPath)) return [...prev, mcpTabPath];
			return prev;
		});

		setMcpDataMap((prev) => ({
			...prev,
			[mcpTabPath]: parsed,
		}));

		setMcpEditorMap((prev) => ({
			...prev,
			[mcpTabPath]: true,
		}));

		setActiveFilePath(mcpTabPath);
	};

	const handleSaveMCP = async (
		finalTools: Record<string, unknown>,
		filePath: string,
	) => {
		try {
			setLoading(true);

			const actualPath = filePath.replace(/#mcp$/, "");
			const file = actualPath.split("assets/").pop();
			const pixel = `SaveEngineAssets(fileName=["${file}"], content=["<encode>${JSON.stringify(
				finalTools,
				null,
				2,
			)}</encode>"], space=["${engineId}"]);CommitAsset(filePath=["${file}"], comment=["Save from editor"], engine=["${engineId}"])`;

			const { errors } = await runPixel(pixel, insightId);

			if (errors?.length) {
				throw new Error(errors.join(", "));
			}

			notification.add({
				message: "Successfully saved MCP tools",
				color: "success",
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: (e as Error)?.message ?? String(e),
			});
			throw e;
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="box-border flex h-full w-full flex-row items-start gap-4 overflow-hidden p-4">
			<div className="flex h-full w-[300px] min-w-[250px] max-w-[400px] flex-col overflow-hidden rounded-lg border border-border bg-background">
				<FileExplorerPanel
					title="Files"
					engineId={engineId}
					insightId={insightId}
					setLoading={setLoading}
					openOverlay={openOverlay}
					closeOverlay={closeOverlay}
					onFileSelect={handleFileSelect}
					onFileDelete={handleDeleteFromExplorer}
					onAddMCPEditorTab={addMCPEditorTab}
				/>
			</div>

			<div className="flex h-full flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
				{openFiles.length > 0 && activeFilePath ? (
					<div className="flex h-full w-full flex-col">
						<div className="flex w-full min-w-0 flex-row flex-nowrap gap-2 overflow-x-auto overflow-y-hidden border-border border-b p-3 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5 [&>*]:shrink-0">
							{openFiles.map((path) => {
								const displayPath = path.replace(/#mcp$/, "");
								const isMCPEditor = mcpEditorMap[path];
								return (
									<Badge
										key={path}
										variant={
											path === activeFilePath
												? "default"
												: "outline"
										}
										className="h-7 max-w-[200px] cursor-pointer gap-2 px-3 py-1.5 transition-colors"
										style={{
											backgroundColor:
												path === activeFilePath
													? "color-mix(in srgb, var(--primary) 10%, transparent)"
													: "var(--secondary)",
										}}
										title={displayPath}
										onClick={() => setActiveFilePath(path)}
									>
										<span
											className="max-w-[160px] truncate font-normal text-[13px]"
											style={{
												color:
													path === activeFilePath
														? "var(--primary)"
														: "var(--foreground)",
											}}
										>
											{isMCPEditor
												? `${getFileNameFromPath(displayPath)} (UI Editor)`
												: getFileNameFromPath(
														displayPath,
													)}
											{unSavedFiles[path] ? "*" : ""}
										</span>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												handleCloseFile(path);
											}}
											className="ml-auto shrink-0 rounded-sm"
											aria-label="Close"
											style={{
												color:
													path === activeFilePath
														? "var(--primary)"
														: "var(--foreground)",
											}}
										>
											<CircleX
												className="h-3.5 w-3.5"
												style={{
													color: "currentColor",
												}}
											/>
										</button>
									</Badge>
								);
							})}
						</div>

						<div className="flex min-h-0 flex-1 flex-col">
							{(() => {
								const shouldRenderMCPEditor = Boolean(
									mcpEditorMap[activeFilePath],
								);

								if (shouldRenderMCPEditor) {
									const initialData = mcpDataMap[
										activeFilePath
									] ?? { _meta: {}, tools: [] };
									return (
										<MCPJsonEditor
											key={activeFilePath}
											dataMap={{
												initialData,
												onSave: handleSaveMCP,
												path: activeFilePath,
											}}
										/>
									);
								}

								const actualFilePath = activeFilePath.replace(
									/#mcp$/,
									"",
								);
								return (
									<FileEditorPanel
										key={activeFilePath}
										path={actualFilePath}
										engineId={engineId}
										insightId={insightId}
										onUnsave={() =>
											handleFileUnsaved(activeFilePath)
										}
										onSave={() =>
											handleFileSaved(activeFilePath)
										}
									/>
								);
							})()}
						</div>
					</div>
				) : (
					<div className="flex h-full w-full flex-col items-center justify-center gap-4 font-['Inter'] text-muted-foreground text-sm">
						<div className="font-medium text-base text-muted-foreground">
							No File Selected
						</div>
						<div className="text-muted-foreground/60 text-sm">
							Select a file from the explorer to start editing
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default FileManager;
