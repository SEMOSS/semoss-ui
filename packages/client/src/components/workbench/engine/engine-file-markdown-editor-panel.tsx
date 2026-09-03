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
	useFileEditorPathRef,
} from "@semoss/shared";
import { CodeEditor, Markdown, Muted, Spinner, toast } from "@semoss/ui/next";
import { useEngine, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "../file-editor.utility";
import {
	EngineFileMarkdownEditorControl,
	type EngineFileMarkdownEditorControlValue,
} from "./engine-file-markdown-editor-control";

export interface EngineFileMarkdownEditorConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

const EngineFileMarkdownEditorPanel: WorkbenchComponent<
	EngineFileMarkdownEditorConfig,
	EngineFileMarkdownEditorControlValue
> = ({ config, id, rename, setValue }) => {
	const { engine, permission } = useEngine();
	const insight = useInsight();
	const { t } = useTranslation("common");
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const targetInsightId =
		config.fileMode === "INSIGHT"
			? config.insightId || insight.insightId
			: insight.insightId;
	const pathScope =
		config.fileMode === "INSIGHT"
			? getFileEditorPathScope(
					{ type: "INSIGHT", insightId: config.insightId },
					targetInsightId,
				)
			: getFileEditorPathScope({
					type: "ENGINE",
					engine: engine.engine_id,
				});
	const currentPathRef = useFileEditorPathRef(config.path, pathScope);
	const [content, setContent] = useState("");
	const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
	const [loadRevision, setLoadRevision] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const baselineRef = useRef("");
	const contentRef = useRef("");
	const appliedRevisionRef = useRef(0);

	const getFile = usePixel<string>(
		config.fileMode === "INSIGHT"
			? `GetInsightAssets(filePath=[${JSON.stringify(config.path)}]);`
			: `GetEngineAssets(filePath=[${JSON.stringify(config.path)}], engine=[${JSON.stringify(engine.engine_id)}]);`,
		{
			data: "",
			onSuccess: () => setLoadRevision((revision) => revision + 1),
		},
		targetInsightId,
	);

	/** Save the Markdown source to its owning asset scope. */
	const save = useCallback(async () => {
		if (readOnly || isSaving) return;

		const nextContent = contentRef.current;
		const pixel =
			config.fileMode === "INSIGHT"
				? `SaveInsightAssets(filePath=["${currentPathRef.current}"], content=["<encode>${nextContent}</encode>"]);`
				: `SaveEngineAssets(engine=["${engine.engine_id}"], filePath=["${currentPathRef.current}"], content=["<encode>${nextContent}</encode>"]);`;

		setIsSaving(true);
		try {
			const response = await runPixel<[unknown]>(pixel, targetInsightId);
			if (response.errors.length > 0) {
				throw new Error(response.errors[0]);
			}

			baselineRef.current = nextContent;
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
		readOnly,
		isSaving,
		config.fileMode,
		config.name,
		engine.engine_id,
		targetInsightId,
		rename,
		t,
		currentPathRef,
	]);

	/** Download the current Markdown file. */
	const download = async () => {
		if (isDownloading) return;

		const pixel =
			config.fileMode === "INSIGHT"
				? `DownloadInsightAsset(filePath=[${JSON.stringify(currentPathRef.current)}]);`
				: `DownloadEngineAsset(engine=[${JSON.stringify(engine.engine_id)}], filePath=[${JSON.stringify(currentPathRef.current)}]);`;

		setIsDownloading(true);
		try {
			const response = await runPixel<[string]>(pixel, targetInsightId);
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

	contentRef.current = content;

	useEffect(() => {
		if (
			getFile.status !== "SUCCESS" ||
			appliedRevisionRef.current === loadRevision
		) {
			return;
		}

		appliedRevisionRef.current = loadRevision;
		baselineRef.current = getFile.data;
		contentRef.current = getFile.data;
		setContent(getFile.data);
		rename(config.name);
	}, [config.name, getFile.data, getFile.status, loadRevision, rename]);

	const isBusy = isSaving || isDownloading || getFile.status === "LOADING";

	useEffect(() => {
		setValue({
			canSave: !readOnly,
			isBusy,
			refresh: getFile.refresh,
			save,
			setViewMode,
			viewMode,
		});
	}, [getFile.refresh, isBusy, readOnly, save, setValue, viewMode]);
	useWorkbenchControl(id, EngineFileMarkdownEditorControl);

	if (getFile.status === "LOADING" || getFile.status === "INITIAL") {
		return (
			<output
				className="flex size-full items-center justify-center"
				aria-label="Loading Markdown file"
			>
				<Spinner />
			</output>
		);
	}

	if (getFile.status === "ERROR") {
		return (
			<div className="flex size-full items-center justify-center p-4">
				<Muted className="text-destructive" role="alert">
					{getFile.error?.message || "Failed to load Markdown file"}
				</Muted>
			</div>
		);
	}

	return (
		<div className="relative size-full overflow-hidden bg-background">
			{viewMode === "raw" ? (
				<CodeEditor
					className="size-full"
					code={content}
					disabled={readOnly}
					language={getCodeEditorLanguage(config.path)}
					menuItems={getFileCodeEditorMenuItems({
						canSave: !readOnly,
						isBusy,
						onDownload: () => void download(),
						onRefresh: () => getFile.refresh(),
						onSave: save,
					})}
					onChange={(value) => {
						const nextContent = value ?? "";
						contentRef.current = nextContent;
						setContent(nextContent);
						rename(
							nextContent === baselineRef.current
								? config.name
								: `${config.name}*`,
						);
					}}
				/>
			) : (
				<div className="size-full overflow-y-auto px-6 py-4">
					<Markdown>{content}</Markdown>
				</div>
			)}
		</div>
	);
};

export const ENGINE_FILE_MARKDOWN_EDITOR_PANEL: WorkbenchPanelConfig<
	EngineFileMarkdownEditorConfig,
	EngineFileMarkdownEditorControlValue
> = {
	name: "Markdown",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) =>
		a.path === b.path &&
		a.fileMode === b.fileMode &&
		a.insightId === b.insightId,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: EngineFileMarkdownEditorPanel,
};
