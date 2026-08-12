import {
	DownloadIcon,
	PlayIcon,
	RefreshCwIcon,
	SaveIcon,
	SquareIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { download, runPixel, useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Muted,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { Notebook, type NotebookHandle, type NotebookState } from "../notebook";
import type { FileMode } from "./file.types";
import { getFileOperationErrorMessage } from "./file-explorer.utils";

interface FileNotebookProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;

	/** When true, the editor is rendered in a read-only, view-only mode:
	 * content cannot be edited and the Save action is hidden. Defaults to false. */
	readOnly?: boolean;
}

/**
 * File-backed wrapper around the pure {@link Notebook}. Loads the `.ipynb` from
 * the mode-scoped asset store, seeds the in-memory editor, and owns the file
 * actions (refresh / save / download, plus Ctrl+S) through its own toolbar,
 * while the Notebook itself handles editing and running cells.
 */
export const FileNotebook: React.FC<FileNotebookProps> = ({
	mode,
	path,
	onChange = () => null,
	readOnly = false,
}) => {
	const insight = useInsight();
	const { t } = useTranslation("common");

	const notebookRef = useRef<NotebookHandle | null>(null);
	// Latest edited content, used as a save fallback before the ref is ready.
	const latestContentRef = useRef("");
	const [content, setContent] = useState<string | null>(null);
	// Bumped on every load so the Notebook remounts and re-seeds even when the
	// refetched bytes are identical (i.e. Refresh discards in-memory edits).
	const [reloadToken, setReloadToken] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [notebookState, setNotebookState] = useState<NotebookState>({
		isRunning: false,
		runProgress: null,
		hasCodeCells: false,
		hasOutputs: false,
	});

	const targetInsightId =
		mode.type === "INSIGHT"
			? mode.insightId || insight.insightId
			: insight.insightId;

	// Mode-scoped Pixel that reads this file from the matching asset store.
	let getFilePixel = "";
	if (mode.type === "APP") {
		getFilePixel = `GetAppAssets(filePath=["${path}"], project=["${mode.app}"]);`;
	} else if (mode.type === "ENGINE") {
		getFilePixel = `GetEngineAssets(filePath=["${path}"], engine=["${mode.engine}"]);`;
	} else if (mode.type === "INSIGHT" && targetInsightId) {
		getFilePixel = `GetInsightAssets(filePath=["${path}"]);`;
	} else if (mode.type === "USER") {
		getFilePixel = `GetUserAssets(filePath=["${path}"]);`;
	}

	const getFile = usePixel<string>(
		getFilePixel,
		{
			onSuccess: (raw) => {
				const next = raw ?? "";
				setContent(next);
				latestContentRef.current = next;
				setReloadToken((prev) => prev + 1);
			},
			onError: () => setContent(null),
		},
		targetInsightId,
	);

	const handleChange = (nextContent: string, isModified: boolean) => {
		latestContentRef.current = nextContent;
		onChange(nextContent, isModified);
	};

	/** Serialize the live notebook and write it back to the asset store. */
	const saveNotebook = async () => {
		if (isSaving) {
			return;
		}
		const serialized =
			notebookRef.current?.save() || latestContentRef.current;
		if (!serialized) {
			return;
		}

		setIsSaving(true);
		try {
			let pixel = "";
			if (mode.type === "APP") {
				pixel = `SaveAppAssets(project=["${mode.app}"], filePath=["${path}"], content=["<encode>${serialized}</encode>"]);`;
			} else if (mode.type === "ENGINE") {
				pixel = `SaveEngineAssets(engine=["${mode.engine}"], filePath=["${path}"], content=["<encode>${serialized}</encode>"]);`;
			} else if (mode.type === "INSIGHT") {
				pixel = `SaveInsightAssets(filePath=["${path}"], content=["<encode>${serialized}</encode>"]);`;
			} else if (mode.type === "USER") {
				pixel = `SaveUserAssets(filePath=["${path}"], content=["<encode>${serialized}</encode>"]);`;
			}

			if (!pixel) {
				throw new Error("Error missing pixel to save file");
			}

			if (mode.type === "INSIGHT" && targetInsightId) {
				await runPixel(pixel, targetInsightId);
			} else {
				await insight.actions.run(pixel);
			}

			onChange(serialized, false);
			toast.success(t("fileExplorer.toasts.saveSuccess"));
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.saveFailed"),
					e,
				),
			);
			console.error(e);
		} finally {
			setIsSaving(false);
		}
	};

	// Stable ref so the Ctrl+S listener always calls the latest saveNotebook.
	const saveNotebookRef = useRef<() => Promise<void>>();
	saveNotebookRef.current = saveNotebook;

	useEffect(() => {
		if (readOnly) {
			return;
		}

		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				void saveNotebookRef.current?.();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [readOnly]);

	/** Download the raw .ipynb file through the asset store's download flow. */
	const downloadNotebook = async () => {
		setIsDownloading(true);
		try {
			let pixel = "";
			if (mode.type === "APP") {
				pixel = `DownloadAppAsset(project=["${mode.app}"], filePath=["${path}"]);`;
			} else if (mode.type === "ENGINE") {
				pixel = `DownloadEngineAsset(engine=["${mode.engine}"], filePath=["${path}"]);`;
			} else if (mode.type === "INSIGHT") {
				pixel = `DownloadInsightAsset(filePath=["${path}"]);`;
			} else if (mode.type === "USER") {
				pixel = `DownloadUserAsset(filePath=["${path}"]);`;
			}

			if (!pixel) {
				throw new Error("Error missing pixel to download file");
			}

			let pixelReturn: { output: string }[] = [];
			if (mode.type === "INSIGHT" && targetInsightId) {
				const response = await runPixel<[string]>(
					pixel,
					targetInsightId,
				);
				pixelReturn = response.pixelReturn;
			} else {
				const response = await insight.actions.run<[string]>(pixel);
				pixelReturn = response.pixelReturn;
			}

			const fileKey = pixelReturn[0].output;
			await download(targetInsightId, fileKey);
			toast.success(t("fileExplorer.toasts.downloadFileSuccess"));
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.downloadFileFailed"),
					e,
				),
			);
			console.error(e);
		} finally {
			setIsDownloading(false);
		}
	};

	const isBusy = isSaving || isDownloading;
	// File actions are also blocked while cells are executing.
	const fileActionsDisabled = isBusy || notebookState.isRunning;

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
			{/* File toolbar — refresh / save / download */}
			<div className="flex w-full shrink-0 items-center gap-1.5 border-border border-b px-2 py-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							disabled={
								getFile.status === "LOADING" ||
								fileActionsDisabled
							}
							onClick={() => getFile.refresh()}
							aria-label="Refresh"
						>
							<RefreshCwIcon className="size-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Refresh</TooltipContent>
				</Tooltip>
				<div className="flex-1" />
				{notebookState.isRunning ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="text-destructive hover:text-destructive"
								onClick={() =>
									void notebookRef.current?.interrupt()
								}
								aria-label={
									notebookState.runProgress
										? `Stop (${notebookState.runProgress.current} / ${notebookState.runProgress.total})`
										: "Stop"
								}
							>
								<SquareIcon className="size-3" />
								Stop
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{notebookState.runProgress
								? `Stop (${notebookState.runProgress.current} / ${notebookState.runProgress.total})`
								: "Stop"}
						</TooltipContent>
					</Tooltip>
				) : (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								disabled={!notebookState.hasCodeCells || isBusy}
								onClick={() =>
									void notebookRef.current?.runAll()
								}
								aria-label="Run all"
							>
								<PlayIcon className="size-3" />
								Run
							</Button>
						</TooltipTrigger>
						<TooltipContent>Run all</TooltipContent>
					</Tooltip>
				)}
				{!readOnly && (
					<>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									disabled={
										content === null || fileActionsDisabled
									}
									onClick={() => void saveNotebook()}
									aria-label="Save"
								>
									<SaveIcon className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Save</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									disabled={
										getFile.status !== "SUCCESS" ||
										fileActionsDisabled
									}
									onClick={() => void downloadNotebook()}
									aria-label="Download"
								>
									<DownloadIcon className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Download</TooltipContent>
						</Tooltip>
					</>
				)}
			</div>

			{/* Body */}
			<div className="relative flex-1 overflow-hidden">
				{getFile.status === "LOADING" && (
					<div className="flex h-full w-full items-center justify-center">
						<Spinner />
					</div>
				)}
				{getFile.status === "ERROR" && (
					<div className="flex h-full w-full items-center justify-center">
						<Muted className="text-destructive">
							{getFile.error?.message ||
								t("fileExplorer.failedToLoadFiles")}
						</Muted>
					</div>
				)}
				{getFile.status === "SUCCESS" && content !== null && (
					<Notebook
						key={reloadToken}
						ref={notebookRef}
						content={content}
						insightId={
							mode.type === "INSIGHT"
								? targetInsightId
								: undefined
						}
						onChange={handleChange}
						onStateChange={setNotebookState}
						readOnly={readOnly}
					/>
				)}
			</div>
		</div>
	);
};
