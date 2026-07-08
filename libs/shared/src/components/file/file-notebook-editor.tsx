import { DownloadIcon, RefreshCwIcon, SaveIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Env } from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { Button, Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import type { FileMode } from "./file.types";
import type { FileCodeEditorActions } from "./file-code-editor";
import { FileCodeEditor } from "./file-code-editor";
import {
	getFileEditorPathScope,
	useFileEditorRefreshListener,
} from "./file-editor-path-events";

const NOTEBOOK_ROW_SELECTED_EVENT = "SEMOSS_NOTEBOOK_ROW_SELECTED";

export interface NotebookRowSelection {
	insightId: string;
	path: string;
	queryId: string;
	cellId: string;
	rowNumber: number;
	widget?: string;
	cellType?: string;
	code?: string;
}

interface NotebookRowSelectedMessage {
	type: string;
	payload?: {
		queryId?: string;
		cellId?: string;
		rowNumber?: number;
		widget?: string;
		cellType?: string;
		code?: string;
	};
}

interface FileNotebookEditorProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;

	/**
	 * Base URL of the client SPA (e.g. VITE_PLATFORM_URL from the playground).
	 * Used to construct the iframe src for the Preview tab.
	 * Falls back to Env.MODULE when not provided (correct for production).
	 */
	platformUrl?: string;

	/** Which tab to show initially. Falls back to \"edit\" when not provided. */
	initialTab?: "edit" | "preview";

	/** Called whenever a row is selected in the Preview notebook iframe. */
	onNotebookRowSelectionChange?: (
		selection: NotebookRowSelection | null,
	) => void;
}

export const FileNotebookEditor: React.FC<FileNotebookEditorProps> = ({
	mode,
	path,
	onChange = () => null,
	platformUrl,
	initialTab = "edit",
	onNotebookRowSelectionChange,
}) => {
	const insight = useInsight();
	const [tab, setTab] = useState<"edit" | "preview">(initialTab);
	const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
	const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(
		null,
	);
	const editorActionsRef = useRef<FileCodeEditorActions | null>(null);
	const iframeRef = useRef<HTMLIFrameElement | null>(null);

	const targetInsightId =
		mode.type === "INSIGHT"
			? mode.insightId || insight.insightId
			: insight.insightId;

	// Base URL of the client SPA — prefer the explicit prop, fall back to
	// Env.MODULE (correct in production where the SPA is embedded in the war).
	const baseUrl = platformUrl !== undefined ? platformUrl : Env.MODULE;

	// URL for the notebook preview iframe â€” points to the client app's
	// /notebook-preview route which renders the real <Notebook> component.
	const previewUrl =
		mode.type === "INSIGHT" && targetInsightId
			? `${baseUrl}/#/notebook-preview?insightId=${encodeURIComponent(targetInsightId)}&path=${encodeURIComponent(path)}`
			: null;

	const handleContentChange = (content: string, isModified: boolean) => {
		onChange(content, isModified);
	};

	const scope = getFileEditorPathScope(mode, targetInsightId);
	useFileEditorRefreshListener(path, scope, () => {
		editorActionsRef.current?.refresh();
		setPreviewRefreshKey((value) => value + 1);
	});

	useEffect(() => {
		setSelectedRowNumber(null);
		onNotebookRowSelectionChange?.(null);
	}, [path, onNotebookRowSelectionChange]);

	useEffect(() => {
		const handleNotebookRowSelection = (event: MessageEvent) => {
			if (!targetInsightId) {
				return;
			}

			if (!iframeRef.current?.contentWindow) {
				return;
			}

			if (event.source !== iframeRef.current.contentWindow) {
				return;
			}

			const data = event.data as NotebookRowSelectedMessage;
			if (!data || data.type !== NOTEBOOK_ROW_SELECTED_EVENT) {
				return;
			}

			const queryId = data.payload?.queryId;
			const cellId = data.payload?.cellId;
			const rowNumber = data.payload?.rowNumber;
			if (
				!queryId ||
				!cellId ||
				!Number.isFinite(rowNumber) ||
				(rowNumber ?? 0) <= 0
			) {
				return;
			}

			const rowSelection: NotebookRowSelection = {
				insightId: targetInsightId,
				path,
				queryId,
				cellId,
				rowNumber: rowNumber || 0,
				widget: data.payload?.widget,
				cellType: data.payload?.cellType,
				code: data.payload?.code,
			};

			setSelectedRowNumber(rowSelection.rowNumber);
			onNotebookRowSelectionChange?.(rowSelection);
		};

		window.addEventListener("message", handleNotebookRowSelection);
		return () => {
			window.removeEventListener("message", handleNotebookRowSelection);
		};
	}, [path, targetInsightId, onNotebookRowSelectionChange]);

	const notebookName = path.split("/").pop() ?? path;

	const clearSelection = () => {
		setSelectedRowNumber(null);
		onNotebookRowSelectionChange?.(null);
	};

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
			<div className="flex w-full shrink-0 items-center justify-between gap-2 border-border border-b px-3 pt-[4px] pb-[7px]">
				<Tabs
					value={tab}
					onValueChange={(v) => setTab(v as "edit" | "preview")}
				>
					<TabsList>
						<TabsTrigger value="edit">Edit</TabsTrigger>
						<TabsTrigger value="preview">Preview</TabsTrigger>
					</TabsList>
				</Tabs>
				{tab === "edit" && (
					<div className="flex items-center gap-1.5">
						<Button
							variant="outline"
							size="sm"
							onClick={() => editorActionsRef.current?.refresh()}
						>
							<RefreshCwIcon className="size-4" />
							Refresh
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => editorActionsRef.current?.save()}
						>
							<SaveIcon className="size-4" />
							Save
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => editorActionsRef.current?.download()}
						>
							<DownloadIcon className="size-4" />
							Download
						</Button>
					</div>
				)}
			</div>

			{selectedRowNumber !== null && (
				<div className="flex w-full items-center justify-between gap-2 border-border border-b bg-primary/5 px-3 py-2 text-primary text-xs">
					<span className="font-medium">
						Row {selectedRowNumber} selected in notebook{" "}
						{notebookName}
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-6 gap-1 px-2 text-primary text-xs hover:text-primary"
						onClick={clearSelection}
					>
						<XIcon className="size-3.5" />
						Unselect
					</Button>
				</div>
			)}

			<div
				style={{ top: selectedRowNumber !== null ? 82 : 48 }}
				className={
					tab === "edit"
						? "absolute inset-x-0 bottom-0"
						: "pointer-events-none invisible absolute inset-x-0 bottom-0"
				}
			>
				<FileCodeEditor
					ref={editorActionsRef}
					mode={mode}
					path={path}
					onChange={handleContentChange}
					hideToolbar
				/>
			</div>

			{tab === "preview" && (
				<div className="flex-1 overflow-hidden">
					{previewUrl ? (
						<iframe
							ref={iframeRef}
							key={previewRefreshKey}
							src={previewUrl}
							className="h-full w-full border-0"
							title="Notebook Preview"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center">
							<p className="text-muted-foreground text-sm">
								Preview is only available for insight files.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
