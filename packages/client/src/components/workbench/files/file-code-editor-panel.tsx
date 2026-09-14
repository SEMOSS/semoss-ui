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
import { CodeEditor, Muted, Spinner, toast } from "@semoss/ui/next";
import { useWorkbenchAccess, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { WorkbenchAccessError } from "../core/workbench-access-error";
import { WorkbenchAccessLoading } from "../core/workbench-access-loading";
import {
	FileCodeEditorControl,
	type FileCodeEditorControlValue,
} from "./file-code-editor-control";
import {
	getCodeEditorLanguage,
	getFileCodeEditorMenuItems,
} from "./file-editor.utility";
import {
	getFileDownloadPixel,
	getFileMode,
	getFileReadPixel,
	getFileSavePixel,
} from "./file-panel.utility";

export interface FileCodeEditorParams {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
	name: string;
	path: string;
}

/** Edit a file in a project, engine, or insight resource. */
const FileCodeEditorPanel = ({
	config,
	id,
	rename,
	setValue,
}: WorkbenchPanelProps<FileCodeEditorParams, FileCodeEditorControlValue>) => {
	const insight = useInsight();
	const { t } = useTranslation("common");
	const access = useWorkbenchAccess(config.type, config.id);
	const readOnly = access.status !== "ready" || access.readOnly;
	const targetInsightId =
		config.type === "INSIGHT" ? config.id : insight.insightId;
	const pathScope = getFileEditorPathScope(
		getFileMode(config),
		targetInsightId,
	);
	const currentPathRef = useFileEditorPathRef(config.path, pathScope);
	const [content, setContent] = useState("");
	const [loadRevision, setLoadRevision] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const baselineRef = useRef("");
	const contentRef = useRef("");
	const appliedRevisionRef = useRef(0);

	const getFile = usePixel<string>(
		access.status === "ready" ? getFileReadPixel(config) : "",
		{
			data: "",
			onSuccess: () => setLoadRevision((revision) => revision + 1),
		},
		targetInsightId,
	);

	/** Save the current editor buffer to its configured resource. */
	const save = useCallback(async () => {
		if (readOnly || isSaving) return;

		const nextContent = contentRef.current;
		setIsSaving(true);
		try {
			const response = await runPixel<[unknown]>(
				getFileSavePixel(
					{ ...config, path: currentPathRef.current },
					nextContent,
				),
				targetInsightId,
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
		config,
		currentPathRef,
		isSaving,
		readOnly,
		rename,
		t,
		targetInsightId,
	]);

	/** Download the current file through the active insight. */
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
		});
	}, [getFile.refresh, isBusy, readOnly, save, setValue]);
	useWorkbenchControl(id, FileCodeEditorControl);

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
				aria-label="Loading file"
			>
				<Spinner />
			</output>
		);
	}

	if (getFile.status === "ERROR") {
		return (
			<div className="flex size-full items-center justify-center p-4">
				<Muted className="text-destructive" role="alert">
					{getFile.error?.message || "Failed to load file"}
				</Muted>
			</div>
		);
	}

	return (
		<div className="relative size-full">
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
					setContent(nextContent);
					rename(
						nextContent === baselineRef.current
							? config.name
							: `${config.name}*`,
					);
				}}
			/>
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

/** Scope-aware code editor blueprint shared by all workbenches. */
export const FILE_CODE_EDITOR_PANEL: WorkbenchPanelConfig<
	FileCodeEditorParams,
	FileCodeEditorControlValue
> = {
	name: "Editor",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.type === b.type && a.id === b.id && a.path === b.path,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FileCodeEditorPanel,
};
