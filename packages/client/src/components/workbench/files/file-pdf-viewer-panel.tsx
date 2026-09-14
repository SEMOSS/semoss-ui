import { DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
import { getFileDownloadPixel, getFileReadPixel } from "./file-panel.utility";
import {
	FilePdfViewerControl,
	type FilePdfViewerControlValue,
} from "./file-pdf-viewer-control";

export interface FilePdfViewerParams {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
	name: string;
	path: string;
}

const FilePdfViewerPanel = ({
	config,
	id,
	setValue,
}: WorkbenchPanelProps<FilePdfViewerParams, FilePdfViewerControlValue>) => {
	const insight = useInsight();
	const { t } = useTranslation("common");
	const access = useWorkbenchAccess(config.type, config.id);
	const [isDownloading, setIsDownloading] = useState(false);
	const targetInsightId =
		config.type === "INSIGHT" ? config.id : insight.insightId;
	const pdf = usePixel<string>(
		access.status === "ready" ? getFileReadPixel(config, true) : "",
		{ data: "" },
		targetInsightId,
	);

	useEffect(
		() => setValue({ refresh: pdf.refresh }),
		[pdf.refresh, setValue],
	);
	useWorkbenchControl(id, FilePdfViewerControl);

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

	/** Download the PDF when the browser cannot render it inline. */
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
				throw new Error("No PDF download is available");
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

	if (pdf.status === "LOADING" || pdf.status === "INITIAL") {
		return (
			<output
				className="flex size-full items-center justify-center"
				aria-label="Loading PDF"
			>
				<Spinner />
			</output>
		);
	}

	if (pdf.status === "ERROR") {
		return (
			<div className="flex size-full items-center justify-center p-4">
				<Muted className="text-destructive" role="alert">
					{pdf.error?.message || "Failed to load PDF"}
				</Muted>
			</div>
		);
	}

	return (
		<div className="relative size-full">
			<object
				className="size-full"
				aria-label={`Preview of ${config.name}`}
				data={`data:application/pdf;base64,${pdf.data}`}
				type="application/pdf"
			>
				<div className="flex size-full flex-col items-center justify-center gap-4 p-4">
					<Muted>This browser cannot display the PDF.</Muted>
					<Button
						type="button"
						onClick={() => void download()}
						disabled={isDownloading}
					>
						<DownloadIcon aria-hidden className="size-4" />
						{isDownloading ? "Downloading" : "Download PDF"}
					</Button>
				</div>
			</object>
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

/** Scope-aware PDF viewer blueprint shared by all workbenches. */
export const FILE_PDF_VIEWER_PANEL: WorkbenchPanelConfig<
	FilePdfViewerParams,
	FilePdfViewerControlValue
> = {
	name: "PDF",
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.type === b.type && a.id === b.id && a.path === b.path,
	icon: ({ config, className }) => {
		const Icon = getFileIconComponent(config.path ?? "");
		return <Icon className={className} />;
	},
	content: FilePdfViewerPanel,
};
