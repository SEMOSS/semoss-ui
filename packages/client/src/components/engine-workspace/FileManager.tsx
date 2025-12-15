import { CircleX } from "lucide-react";
import { useState } from "react";
import { Badge } from "@semoss/ui/next";
import { FileEditorPanel } from "./FileEditorPanel";
import FileExplorerPanel from "./FileExplorerPanel";

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

export const FileManager = (props: FileManagerProps) => {
	const { engineId, insightId, setLoading, openOverlay, closeOverlay } =
		props;
	const [openFiles, setOpenFiles] = useState<string[]>([]);
	const [activeFilePath, setActiveFilePath] = useState<string>("");
	const [unSavedFiles, setUnSavedFiles] = useState<Record<string, boolean>>(
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

			return next;
		});
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
				/>
			</div>

			<div className="flex h-full flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
				{openFiles.length > 0 && activeFilePath ? (
					<div className="flex h-full w-full flex-col">
						<div className="flex w-full min-w-0 flex-row flex-nowrap gap-2 overflow-x-auto overflow-y-hidden border-border border-b p-3 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5 [&>*]:shrink-0">
							{openFiles.map((path) => (
								<Badge
									key={path}
									variant={
										path === activeFilePath
											? "default"
											: "outline"
									}
									className={`h-7 max-w-[200px] cursor-pointer gap-2 px-3 py-1.5 transition-colors ${
										path === activeFilePath
											? "bg-[#EBF4FE] hover:bg-[#EBF4FE]"
											: "bg-[#F5F5F5]"
									}`}
									title={path}
									onClick={() => setActiveFilePath(path)}
								>
									<span
										className={`max-w-[160px] truncate font-normal text-[13px] ${
											path === activeFilePath
												? "text-primary"
												: "text-foreground"
										}`}
									>
										{getFileNameFromPath(path)}
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
									>
										<CircleX
											className="h-3.5 w-3.5"
											color={`${path === activeFilePath ? "#0570F0" : "#0A0A0A"}`}
										/>
									</button>
								</Badge>
							))}
						</div>

						<div className="flex min-h-0 flex-1 flex-col">
							<FileEditorPanel
								key={activeFilePath}
								path={activeFilePath}
								engineId={engineId}
								insightId={insightId}
								onUnsave={() =>
									handleFileUnsaved(activeFilePath)
								}
								onSave={() => handleFileSaved(activeFilePath)}
							/>
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
