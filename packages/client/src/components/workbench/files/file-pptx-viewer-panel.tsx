import { DownloadIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	download as downloadFile,
	runPixel,
	useInsight,
	usePixel,
} from "@semoss/sdk/react";
import {
	getFileIconComponent,
	getFileOperationErrorMessage,
} from "@semoss/shared";
import { Button, Muted, Spinner, toast } from "@semoss/ui/next";
import { useWorkbenchAccess, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { WorkbenchAccessError } from "../core/workbench-access-error";
import { WorkbenchAccessLoading } from "../core/workbench-access-loading";
import {
	decodeBase64Asset,
	getFileDownloadPixel,
	getFileReadPixel,
} from "./file-panel.utility";
import {
	FilePptxViewerControl,
	type FilePptxViewerControlValue,
} from "./file-pptx-viewer-control";

const FilePptxViewerContent = lazy(() => import("./file-pptx-viewer-content"));

export interface FilePptxViewerParams {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
	name: string;
	path: string;
}

const FilePptxViewerPanel = ({
	config,
	id,
	setValue,
}: WorkbenchPanelProps<FilePptxViewerParams, FilePptxViewerControlValue>) => {
	const insight = useInsight();
	const { t } = useTranslation("common");
	const access = useWorkbenchAccess(config.type, config.id);
	const [isDownloading, setIsDownloading] = useState(false);
	const targetInsightId =
		config.type === "INSIGHT" ? config.id : insight.insightId;
	const pptx = usePixel<string>(
		access.status === "ready" ? getFileReadPixel(config, true) : "",
		{ data: "" },
		targetInsightId,
	);

	const content = useMemo(() => decodeBase64Asset(pptx.data), [pptx.data]);

	useEffect(
		() => setValue({ refresh: pptx.refresh }),
		[pptx.refresh, setValue],
	);
	useWorkbenchControl(id, FilePptxViewerControl);

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

	/** Download the presentation when it cannot be rendered inline. */
	const download = async () => {
		if (isDownloading) return;

		setIsDownloading(true);
		try {
			const response = await runPixel<[string]>(
				getFileDownloadPixel(config),
				targetInsightId,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors[0]);
			}

			const fileKey = response.pixelReturn[0]?.output;
			if (!fileKey || !targetInsightId) {
				throw new Error("No presentation download is available");
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

	if (pptx.status === "LOADING" || pptx.status === "INITIAL") {
		return (
			<output
				className="flex size-full items-center justify-center"
				aria-label="Loading presentation"
			>
				<Spinner />
			</output>
		);
	}

	if (pptx.status === "ERROR" || !content) {
		return (
			<div className="flex size-full flex-col items-center justify-center gap-4 p-4">
				<Muted className="text-destructive" role="alert">
					{pptx.error?.message || "Failed to load the presentation"}
				</Muted>
				<Button
					type="button"
					onClick={() => void download()}
					disabled={isDownloading}
				>
					<DownloadIcon aria-hidden className="size-4" />
					{isDownloading ? "Downloading" : "Download file"}
				</Button>
			</div>
		);
	}

	return (
		<div className="relative size-full">
			<Suspense
				fallback={
					<output
						className="flex size-full items-center justify-center"
						aria-label="Loading presentation viewer"
					>
						<Spinner />
					</output>
				}
			>
				<FilePptxViewerContent
					content={content}
					fileName={config.name}
				/>
			</Suspense>
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

/** Scope-aware PowerPoint viewer blueprint shared by all workbenches. */
export const FILE_PPTX_VIEWER_PANEL: WorkbenchPanelConfig<
	FilePptxViewerParams,
	FilePptxViewerControlValue
> = {
	name: "PowerPoint",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.type === b.type && a.id === b.id && a.path === b.path,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FilePptxViewerPanel,
};
