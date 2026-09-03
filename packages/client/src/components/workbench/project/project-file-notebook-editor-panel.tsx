import { PlayIcon, SquareIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "../file-editor.utility";
import {
	ProjectFileNotebookEditorControl,
	type ProjectFileNotebookEditorControlValue,
} from "./project-file-notebook-editor-control";

export interface ProjectFileNotebookEditorConfig {
	name: string;
	path: string;
	readOnly?: boolean;
}

const EMPTY_NOTEBOOK_STATE: NotebookState = {
	isRunning: false,
	runProgress: null,
	hasCodeCells: false,
	hasOutputs: false,
};

const ProjectFileNotebookEditorPanel: WorkbenchComponent<
	ProjectFileNotebookEditorConfig,
	ProjectFileNotebookEditorControlValue
> = ({ config, id, rename, setValue }) => {
	const { project, permission } = useProject();
	const insight = useInsight();
	const { t } = useTranslation("common");
	const readOnly =
		Boolean(config.readOnly) ||
		!(permission === "OWNER" || permission === "EDIT");
	const pathScope = getFileEditorPathScope({
		type: "APP",
		app: project.project_id,
	});
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
	const refreshRef = useRef<() => void>(() => undefined);
	const saveRef = useRef<() => Promise<void>>(async () => undefined);
	const setViewModeRef = useRef<(mode: "notebook" | "raw") => void>(
		() => undefined,
	);

	const getFile = usePixel<string>(
		`GetAppAssets(filePath=[${JSON.stringify(config.path)}], project=[${JSON.stringify(project.project_id)}]);`,
		{
			data: "",
			onSuccess: () => setLoadRevision((revision) => revision + 1),
		},
		insight.insightId,
	);

	/** Save the serialized notebook to the project asset. */
	const save = async () => {
		if (readOnly || isSaving) return;

		const serialized =
			viewModeRef.current === "raw"
				? contentRef.current
				: notebookRef.current?.save() || latestContentRef.current;
		if (!serialized) return;

		setIsSaving(true);
		try {
			const response = await runPixel<[unknown]>(
				`SaveAppAssets(project=["${project.project_id}"], filePath=["${currentPathRef.current}"], content=["<encode>${serialized}</encode>"]);`,
				insight.insightId,
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
	};

	/** Download the current project notebook file. */
	const download = async () => {
		if (isDownloading) return;

		setIsDownloading(true);
		try {
			const response = await runPixel<[string]>(
				`DownloadAppAsset(project=[${JSON.stringify(project.project_id)}], filePath=[${JSON.stringify(currentPathRef.current)}]);`,
				insight.insightId,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors[0]);
			}

			const fileKey = response.pixelReturn[0]?.output;
			if (!fileKey || !insight.insightId) {
				throw new Error("No file download is available");
			}

			await downloadFile(insight.insightId, fileKey);
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

	contentRef.current = content;
	viewModeRef.current = viewMode;
	refreshRef.current = getFile.refresh;
	saveRef.current = save;
	setViewModeRef.current = (nextMode) => {
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
	};

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

	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: ProjectFileNotebookEditorControlValue = {
			canSave: !readOnly,
			isBusy,
			refresh: () => refreshRef.current(),
			save: () => void saveRef.current(),
			setViewMode: (mode) => setViewModeRef.current(mode),
			viewMode,
		};
		setValue(value);
	}, [isBusy, readOnly, viewMode]);
	useWorkbenchControl(id, ProjectFileNotebookEditorControl);

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

	if (viewMode === "raw") {
		return (
			<CodeEditor
				className="size-full"
				code={content}
				disabled={readOnly}
				language={getCodeEditorLanguage(config.path)}
				menuItems={getFileCodeEditorMenuItems({
					canSave: !readOnly,
					isBusy,
					onDownload: () => void download(),
					onRefresh: () => refreshRef.current(),
					onSave: () => void saveRef.current(),
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
		);
	}

	return (
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
								<SquareIcon aria-hidden className="size-3" />
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
								disabled={!notebookState.hasCodeCells || isBusy}
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
};

export const PROJECT_FILE_NOTEBOOK_EDITOR_PANEL: WorkbenchPanelConfig<
	ProjectFileNotebookEditorConfig,
	ProjectFileNotebookEditorControlValue
> = {
	name: "Notebook",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.path === b.path,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: ProjectFileNotebookEditorPanel,
};
