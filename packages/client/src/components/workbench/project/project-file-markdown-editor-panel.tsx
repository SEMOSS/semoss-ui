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
	ProjectFileMarkdownEditorControl,
	type ProjectFileMarkdownEditorControlValue,
} from "./project-file-markdown-editor-control";

export interface ProjectFileMarkdownEditorConfig {
	name: string;
	path: string;
	readOnly?: boolean;
}

const ProjectFileMarkdownEditorPanel: WorkbenchComponent<
	ProjectFileMarkdownEditorConfig,
	ProjectFileMarkdownEditorControlValue
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
	const [content, setContent] = useState("");
	const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
	const [loadRevision, setLoadRevision] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const baselineRef = useRef("");
	const contentRef = useRef("");
	const appliedRevisionRef = useRef(0);

	const getFile = usePixel<string>(
		`GetAppAssets(filePath=[${JSON.stringify(config.path)}], project=[${JSON.stringify(project.project_id)}]);`,
		{
			data: "",
			onSuccess: () => setLoadRevision((revision) => revision + 1),
		},
		insight.insightId,
	);

	/** Save the Markdown source to the project asset. */
	const save = useCallback(async () => {
		if (readOnly || isSaving) return;

		const nextContent = contentRef.current;
		setIsSaving(true);
		try {
			const response = await runPixel<[unknown]>(
				`SaveAppAssets(project=["${project.project_id}"], filePath=["${currentPathRef.current}"], content=["<encode>${nextContent}</encode>"]);`,
				insight.insightId,
			);
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
		project.project_id,
		config.name,
		insight.insightId,
		rename,
		t,
		currentPathRef,
	]);

	/** Download the current project Markdown file. */
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
	useWorkbenchControl(id, ProjectFileMarkdownEditorControl);

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

export const PROJECT_FILE_MARKDOWN_EDITOR_PANEL: WorkbenchPanelConfig<
	ProjectFileMarkdownEditorConfig,
	ProjectFileMarkdownEditorControlValue
> = {
	name: "Markdown",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.path === b.path,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: ProjectFileMarkdownEditorPanel,
};
