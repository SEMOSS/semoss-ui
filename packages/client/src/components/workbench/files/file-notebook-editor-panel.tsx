import { PlayIcon, SquareIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	download as downloadFile,
	runPixel,
	useInsight,
	usePixel,
} from "@semoss/sdk/react";
import {
	getFileEditorPathScope,
	getFileIconComponent,
	getFileOperationErrorMessage,
	Notebook,
	type NotebookHandle,
	type NotebookState,
	useFileEditorPathRef,
} from "@semoss/shared";
import {
	Button,
	CodeEditor,
	Muted,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useAccess, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { WorkbenchAccessError } from "../core/workbench-access-error";
import { WorkbenchAccessLoading } from "../core/workbench-access-loading";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "./file-editor.utility";
import {
	FileNotebookEditorControl,
	type FileNotebookEditorControlValue,
} from "./file-notebook-editor-control";
import {
	getFileDownloadPixel,
	getFileMode,
	getFileReadPixel,
	getFileSavePixel,
} from "./file-panel.utility";

export interface FileNotebookEditorParams {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
	name: string;
	path: string;
}

const EMPTY_NOTEBOOK_STATE: NotebookState = {
	isRunning: false,
	runProgress: null,
	hasCodeCells: false,
	hasOutputs: false,
};

const FileNotebookEditorPanel = ({
	config,
	id,
	rename,
	setValue,
}: WorkbenchPanelProps<
	FileNotebookEditorParams,
	FileNotebookEditorControlValue
>) => {
	const insight = useInsight();
	const { t } = useTranslation("common");
	const access = useAccess(config.type, config.id);
	const readOnly = access.status !== "ready" || access.readOnly;
	const targetInsightId =
		config.type === "INSIGHT" ? config.id : insight.insightId;
	const pathScope = getFileEditorPathScope(
		getFileMode(config),
		targetInsightId,
	);
	const currentPathRef = useFileEditorPathRef(config.path, pathScope);
	const notebookRef = useRef<NotebookHandle | null>(null);
	const [content, setContent] = useState("");
	const [reloadToken, setReloadToken] = useState(0);
	const [viewMode, setViewMode] = useState<"notebook" | "raw">("notebook");
	const [notebookState, setNotebookState] =
		useState<NotebookState>(EMPTY_NOTEBOOK_STATE);
	const [loadRevision, setLoadRevision] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const baselineRef = useRef("");
	const latestContentRef = useRef("");
	const contentRef = useRef("");
	const viewModeRef = useRef<"notebook" | "raw">("notebook");
	const appliedRevisionRef = useRef(0);

	const getFile = usePixel<string>(
		access.status === "ready" ? getFileReadPixel(config) : "",
		{
			data: "",
			onSuccess: () => setLoadRevision((revision) => revision + 1),
		},
		targetInsightId,
	);

	/** Save the serialized notebook to its configured resource. */
	const save = useCallback(async () => {
		if (readOnly || isSaving) return;

		const serialized =
			viewModeRef.current === "raw"
				? contentRef.current
				: notebookRef.current?.save() || latestContentRef.current;
		if (!serialized) return;

		setIsSaving(true);
		try {
			const response = await runPixel<[unknown]>(
				getFileSavePixel(
					{ ...config, path: currentPathRef.current },
					serialized,
				),
				targetInsightId,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors[0]);
			}

			baselineRef.current = serialized;
			latestContentRef.current = serialized;
			rename(config.name);
			toast.success(t("fileExplorer.toasts.saveSuccess"));
		} catch (error) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.saveFailed"),
					error,
				),
			);
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	}, [
		config,
		currentPathRef,
		isSaving,
		readOnly,
		rename,
		t,
		targetInsightId,
	]);

	/** Download the current notebook file. */
	const download = async () => {
		if (isDownloading) return;

		setIsDownloading(true);
		try {
			const response = await runPixel<[string]>(
				getFileDownloadPixel({
					...config,
					path: currentPathRef.current,
				}),
				targetInsightId,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors[0]);
			}

			const fileKey = response.pixelReturn[0]?.output;
			if (!fileKey || !targetInsightId) {
				throw new Error("No file download is available");
			}

			await downloadFile(targetInsightId, fileKey);
			toast.success(t("fileExplorer.toasts.downloadFileSuccess"));
		} catch (error) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.downloadFileFailed"),
					error,
				),
			);
			console.error(error);
		} finally {
			setIsDownloading(false);
		}
	};

	/** Switch views while preserving the latest serialized notebook. */
	const setNotebookViewMode = useCallback((nextMode: "notebook" | "raw") => {
		if (nextMode === viewModeRef.current) return;

		if (nextMode === "raw") {
			const serialized =
				notebookRef.current?.save() || latestContentRef.current;
			latestContentRef.current = serialized;
			contentRef.current = serialized;
			setContent(serialized);
		} else {
			const serialized = latestContentRef.current;
			contentRef.current = serialized;
			setContent(serialized);
			setReloadToken((token) => token + 1);
		}

		viewModeRef.current = nextMode;
		setViewMode(nextMode);
	}, []);

	contentRef.current = content;
	viewModeRef.current = viewMode;

	useEffect(() => {
		if (
			getFile.status !== "SUCCESS" ||
			appliedRevisionRef.current === loadRevision
		) {
			return;
		}

		appliedRevisionRef.current = loadRevision;
		baselineRef.current = getFile.data;
		latestContentRef.current = getFile.data;
		contentRef.current = getFile.data;
		setContent(getFile.data);
		setReloadToken((token) => token + 1);
		rename(config.name);
	}, [config.name, getFile.data, getFile.status, loadRevision, rename]);

	const isBusy =
		isSaving ||
		isDownloading ||
		getFile.status === "LOADING" ||
		notebookState.isRunning;

	useEffect(() => {
		setValue({
			canSave: !readOnly,
			isBusy,
			refresh: getFile.refresh,
			save,
			setViewMode: setNotebookViewMode,
			viewMode,
		});
	}, [
		isBusy,
		readOnly,
		getFile.refresh,
		save,
		setValue,
		setNotebookViewMode,
		viewMode,
	]);
	useWorkbenchControl(id, FileNotebookEditorControl);

	if (access.status === "loading") {
		return (
			<WorkbenchAccessLoading
				className="size-full"
				label="Loading resource access"
			/>
		);
	}

	if (access.status === "error") {
		return (
			<WorkbenchAccessError
				className="size-full"
				message={access.error}
				onRetry={() => void access.refresh()}
			/>
		);
	}

	if (getFile.status === "LOADING" || getFile.status === "INITIAL") {
		return (
			<output
				className="flex size-full items-center justify-center"
				aria-label="Loading notebook"
			>
				<Spinner />
			</output>
		);
	}

	if (getFile.status === "ERROR") {
		return (
			<div className="flex size-full items-center justify-center p-4">
				<Muted className="text-destructive" role="alert">
					{getFile.error?.message || "Failed to load notebook"}
				</Muted>
			</div>
		);
	}

	const body =
		viewMode === "raw" ? (
			<CodeEditor
				className="size-full"
				code={content}
				disabled={readOnly}
				language={getCodeEditorLanguage(config.path)}
				menuItems={getFileCodeEditorMenuItems({
					canSave: !readOnly,
					isBusy,
					onDownload: () => void download(),
					onRefresh: getFile.refresh,
					onSave: save,
				})}
				onChange={(value) => {
					const nextContent = value ?? "";
					contentRef.current = nextContent;
					latestContentRef.current = nextContent;
					setContent(nextContent);
					rename(
						nextContent === baselineRef.current
							? config.name
							: `${config.name}*`,
					);
				}}
			/>
		) : (
			<div className="flex size-full flex-col overflow-hidden bg-background">
				<div className="flex shrink-0 items-center justify-end gap-2 border-border border-b px-2 py-1">
					{notebookState.isRunning ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-destructive hover:text-destructive"
									onClick={() =>
										void notebookRef.current?.interrupt()
									}
									aria-label="Stop notebook"
								>
									<SquareIcon
										aria-hidden
										className="size-3"
									/>
									Stop
								</Button>
							</TooltipTrigger>
							<TooltipContent>Stop notebook</TooltipContent>
						</Tooltip>
					) : (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									disabled={
										!notebookState.hasCodeCells || isBusy
									}
									onClick={() =>
										void notebookRef.current?.runAll()
									}
									aria-label="Run all notebook cells"
								>
									<PlayIcon aria-hidden className="size-3" />
									Run
								</Button>
							</TooltipTrigger>
							<TooltipContent>Run all</TooltipContent>
						</Tooltip>
					)}
				</div>
				<div className="min-h-0 flex-1 overflow-hidden">
					<Notebook
						key={reloadToken}
						ref={notebookRef}
						content={content}
						insightId={
							config.type === "INSIGHT"
								? targetInsightId
								: undefined
						}
						onChange={(nextContent) => {
							latestContentRef.current = nextContent;
							rename(
								nextContent === baselineRef.current
									? config.name
									: `${config.name}*`,
							);
						}}
						onStateChange={setNotebookState}
						readOnly={readOnly}
					/>
				</div>
			</div>
		);

	return (
		<div className="relative size-full">
			{body}
			{access.refreshing ? (
				<WorkbenchAccessLoading
					className="absolute inset-0 bg-background/80"
					label="Refreshing resource access"
				/>
			) : null}
			{access.refreshError ? (
				<WorkbenchAccessError
					className="absolute inset-0 bg-background/90"
					message={access.refreshError}
					onRetry={() => void access.refresh()}
				/>
			) : null}
		</div>
	);
};

/** Scope-aware notebook editor blueprint shared by all workbenches. */
export const FILE_NOTEBOOK_EDITOR_PANEL: WorkbenchPanelConfig<
	FileNotebookEditorParams,
	FileNotebookEditorControlValue
> = {
	name: "Notebook",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.type === b.type && a.id === b.id && a.path === b.path,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FileNotebookEditorPanel,
};
