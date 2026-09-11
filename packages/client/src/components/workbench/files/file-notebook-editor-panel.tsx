import { PlayIcon, SquareIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	getFileIconComponent,
	Notebook,
	type NotebookHandle,
	type NotebookState,
} from "@semoss/shared";
import {
	Button,
	CodeEditor,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "./file-editor.utility";
import {
	FileNotebookEditorControl,
	type FileNotebookEditorControlValue,
} from "./file-notebook-editor-control";
import { useFileBuffer } from "./use-file-buffer";
import { type FilePanelParams, useFilePanel } from "./use-file-panel";

export type FileNotebookEditorParams = FilePanelParams;

const EMPTY_NOTEBOOK_STATE: NotebookState = {
	isRunning: false,
	runProgress: null,
	hasCodeCells: false,
	hasOutputs: false,
};

/** Edit and run a Jupyter notebook, with a raw JSON escape hatch. */
const FileNotebookEditorPanel = ({
	config,
	id,
	rename,
	setValue,
}: WorkbenchPanelProps<
	FileNotebookEditorParams,
	FileNotebookEditorControlValue
>) => {
	const notebookRef = useRef<NotebookHandle | null>(null);
	const [reloadToken, setReloadToken] = useState(0);
	const [viewMode, setViewMode] = useState<"notebook" | "raw">("notebook");
	const [notebookState, setNotebookState] =
		useState<NotebookState>(EMPTY_NOTEBOOK_STATE);
	// the notebook edits itself, so its latest serialization lives outside the
	// text buffer; only the raw view writes that
	const latestContentRef = useRef("");
	const viewModeRef = useRef<"notebook" | "raw">("notebook");
	viewModeRef.current = viewMode;

	const panel = useFilePanel(config, {
		extraBusy: notebookState.isRunning,
	});

	const getContent = useCallback((bufferContent: string) => {
		const serialized =
			viewModeRef.current === "raw"
				? bufferContent
				: notebookRef.current?.save() || latestContentRef.current;
		latestContentRef.current = serialized;
		return serialized;
	}, []);

	const onLoaded = useCallback((content: string) => {
		latestContentRef.current = content;
		setReloadToken((token) => token + 1);
	}, []);

	const buffer = useFileBuffer({
		panel,
		name: config.name,
		rename,
		getContent,
		skipEmptySave: true,
		onLoaded,
	});

	/** Switch views while preserving the latest serialized notebook. */
	const setNotebookViewMode = useCallback(
		(nextMode: "notebook" | "raw") => {
			if (nextMode === viewModeRef.current) return;

			if (nextMode === "raw") {
				const serialized =
					notebookRef.current?.save() || latestContentRef.current;
				latestContentRef.current = serialized;
				buffer.setContent(serialized);
			} else {
				buffer.setContent(latestContentRef.current);
				setReloadToken((token) => token + 1);
			}

			viewModeRef.current = nextMode;
			setViewMode(nextMode);
		},
		[buffer],
	);

	useEffect(() => {
		setValue({
			canSave: !panel.readOnly,
			isBusy: panel.isBusy,
			refresh: panel.read.refresh,
			save: buffer.save,
			setViewMode: setNotebookViewMode,
			viewMode,
		});
	}, [
		panel.readOnly,
		panel.isBusy,
		panel.read.refresh,
		buffer.save,
		setValue,
		setNotebookViewMode,
		viewMode,
	]);
	useWorkbenchControl(id, FileNotebookEditorControl);

	if (panel.gate) return panel.gate;
	if (panel.readGate) return panel.readGate;

	const body =
		viewMode === "raw" ? (
			<CodeEditor
				className="size-full"
				code={buffer.content}
				disabled={panel.readOnly}
				language={getCodeEditorLanguage(config.path)}
				menuItems={getFileCodeEditorMenuItems({
					canSave: !panel.readOnly,
					isBusy: panel.isBusy,
					onDownload: () => void panel.download(),
					onRefresh: panel.read.refresh,
					onSave: buffer.save,
				})}
				onChange={(value) => {
					const next = value ?? "";
					latestContentRef.current = next;
					buffer.setContent(next);
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
										!notebookState.hasCodeCells ||
										panel.isBusy
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
						content={buffer.content}
						insightId={
							config.type === "INSIGHT"
								? panel.targetInsightId
								: undefined
						}
						onChange={(nextContent) => {
							// the marker only — writing the buffer here would
							// re-render the parent on every cell keystroke
							latestContentRef.current = nextContent;
							buffer.markDirty(nextContent);
						}}
						onStateChange={setNotebookState}
						readOnly={panel.readOnly}
					/>
				</div>
			</div>
		);

	return (
		<div className="relative size-full">
			{body}
			{panel.overlay}
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
