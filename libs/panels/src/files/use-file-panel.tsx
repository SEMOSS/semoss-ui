import { type ReactNode, useCallback, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	download as downloadFile,
	runPixel,
	useInsight,
	usePixel,
} from "@semoss/sdk/react";
import {
	getFileOperationErrorMessage,
	useFileEditorPathRef,
} from "@semoss/shared";
import { Muted, Spinner, toast } from "@semoss/ui/next";
import {
	WorkbenchAccessError,
	WorkbenchAccessLoading,
} from "@semoss/workbench";
import { useAccess } from "../access";
import {
	type FilePanelMode,
	getFilePanelResource,
	getFilePanelScope,
} from "./file-panel.mode";
import {
	getFileDownloadPixel,
	getFileReadPixel,
	getFileSavePixel,
} from "./file-panel.utility";

/** The scope and file every file panel is opened with. */
export interface FilePanelParams {
	mode: FilePanelMode;
	name: string;
	path: string;
}

interface UseFilePanelOptions {
	/** Read through the `*Base64` reactor — images, PDFs, pptx. */
	base64?: boolean;
	/** Skip the read entirely, e.g. a panel that only fetches on demand. */
	enabled?: boolean;
	/** Folded into `isBusy`, for a panel with work of its own (a running notebook). */
	extraBusy?: boolean;
}

/** Everything a file panel needs that is not specific to how it renders. */
export interface FilePanelApi {
	access: ReturnType<typeof useAccess>;
	readOnly: boolean;
	/** The insight every Pixel for this file runs through. */
	targetInsightId: string | undefined;
	/**
	 * The file's *current* path — it follows a rename while the panel stays
	 * mounted, which `config.path` does not. Always save and download through
	 * this, never through `config.path`.
	 */
	currentPathRef: { current: string };
	read: {
		status: string;
		data: string;
		error?: { message?: string };
		refresh: () => void;
		/** Bumped on every successful load, so a buffer knows to re-seed. */
		revision: number;
	};
	save: (content: string) => Promise<boolean>;
	download: () => Promise<void>;
	isSaving: boolean;
	isDownloading: boolean;
	isBusy: boolean;
	/** Blocking access state, or null once resolved. Return it before anything else. */
	gate: ReactNode | null;
	/** Blocking file-load state, or null once loaded. Return it after `gate`. */
	readGate: ReactNode | null;
	/** Non-blocking access-refresh chrome. Render inside the panel body. */
	overlay: ReactNode;
}

/**
 * The half of a file panel that is the same for all of them: resolving access,
 * picking the insight, reading the file, saving it, downloading it, and the
 * three blocking states that gate the body.
 *
 * `gate` and `readGate` come back as nodes rather than being thrown or
 * early-returned from here, because a panel has to finish calling its hooks
 * (`useWorkbenchControl` in particular) before it may return anything.
 *
 * @param config - The panel's resource scope and file.
 * @param options - Read variant and extra busy state.
 * @return The shared machinery, ready to render around.
 */
export const useFilePanel = (
	config: FilePanelParams,
	{
		base64 = false,
		enabled = true,
		extraBusy = false,
	}: UseFilePanelOptions = {},
): FilePanelApi => {
	const insight = useInsight();
	const { t } = useTranslation("common");
	const resource = getFilePanelResource(config.mode);
	const access = useAccess(resource?.type ?? "INSIGHT", resource?.id ?? "");
	const readOnly = access.status !== "ready" || access.readOnly;
	const targetInsightId =
		config.mode.type === "INSIGHT"
			? config.mode.insightId
			: insight.insightId;
	const currentPathRef = useFileEditorPathRef(
		config.path,
		getFilePanelScope(config.mode),
	);
	const [revision, setRevision] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const savingRef = useRef(false);
	const downloadingRef = useRef(false);

	const read = usePixel<string>(
		enabled && access.status === "ready"
			? getFileReadPixel(config.mode, config.path, base64)
			: "",
		{ data: "", onSuccess: () => setRevision((r) => r + 1) },
		targetInsightId,
	);

	const save = useCallback(
		async (content: string): Promise<boolean> => {
			if (readOnly || savingRef.current) return false;
			savingRef.current = true;
			setIsSaving(true);
			try {
				const response = await runPixel<[unknown]>(
					getFileSavePixel(
						config.mode,
						currentPathRef.current,
						content,
					),
					targetInsightId,
				);
				if (response.errors.length > 0) {
					throw new Error(response.errors[0]);
				}
				toast.success(t("fileExplorer.toasts.saveSuccess"));
				return true;
			} catch (error) {
				toast.error(
					getFileOperationErrorMessage(
						t("fileExplorer.toasts.saveFailed"),
						error,
					),
				);
				console.error(error);
				return false;
			} finally {
				savingRef.current = false;
				setIsSaving(false);
			}
		},
		[config, currentPathRef, readOnly, t, targetInsightId],
	);

	const download = useCallback(async (): Promise<void> => {
		if (downloadingRef.current) return;
		downloadingRef.current = true;
		setIsDownloading(true);
		try {
			const response = await runPixel<[string]>(
				getFileDownloadPixel(config.mode, currentPathRef.current),
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
			downloadingRef.current = false;
			setIsDownloading(false);
		}
	}, [config, currentPathRef, t, targetInsightId]);

	const gate =
		access.status === "loading" ? (
			<WorkbenchAccessLoading
				className="size-full"
				label="Loading resource access"
			/>
		) : access.status === "error" ? (
			<WorkbenchAccessError
				className="size-full"
				message={access.error}
				onRetry={() => void access.refresh()}
			/>
		) : null;

	const readGate =
		read.status === "LOADING" || read.status === "INITIAL" ? (
			<output
				className="flex size-full items-center justify-center"
				aria-label="Loading file"
			>
				<Spinner />
			</output>
		) : read.status === "ERROR" ? (
			<div className="flex size-full items-center justify-center p-4">
				<Muted className="text-destructive" role="alert">
					{read.error?.message || "Failed to load file"}
				</Muted>
			</div>
		) : null;

	// Only the "ready" arm carries the refresh fields, and a panel only reaches
	// its body once `gate` is null — so this is null exactly when it is unused.
	const overlay =
		access.status === "ready" ? (
			<>
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
			</>
		) : null;

	return {
		access,
		readOnly,
		targetInsightId,
		currentPathRef,
		read: { ...read, revision },
		save,
		download,
		isSaving,
		isDownloading,
		isBusy:
			isSaving || isDownloading || extraBusy || read.status === "LOADING",
		gate,
		readGate,
		overlay,
	};
};
