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
import { useEngine, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { EngineFilePdfEditorControl } from "./engine-file-pdf-editor-control";

export interface EngineFilePdfEditorConfig {
	name: string;
	path: string;
	fileMode?: "ENGINE" | "INSIGHT";
	insightId?: string;
}

const EngineFilePdfEditorPanel: WorkbenchComponent<
	EngineFilePdfEditorConfig
> = ({ config, id, setValue }) => {
	const { engine } = useEngine();
	const insight = useInsight();
	const { t } = useTranslation("common");
	const [isDownloading, setIsDownloading] = useState(false);
	const targetInsightId =
		config.fileMode === "INSIGHT"
			? config.insightId || insight.insightId
			: insight.insightId;
	const pdf = usePixel<string>(
		config.fileMode === "INSIGHT"
			? `GetInsightAssetsBase64(filePath=[${JSON.stringify(config.path)}]);`
			: `GetEngineAssetsBase64(filePath=[${JSON.stringify(config.path)}], engine=[${JSON.stringify(engine.engine_id)}]);`,
		{ data: "" },
		targetInsightId,
	);
	useEffect(
		() => setValue({ refresh: pdf.refresh }),
		[pdf.refresh, setValue],
	);
	useWorkbenchControl(id, EngineFilePdfEditorControl);

	/** Download the PDF when the browser cannot render it inline. */
	const download = async () => {
		if (isDownloading) return;

		const pixel =
			config.fileMode === "INSIGHT"
				? `DownloadInsightAsset(filePath=[${JSON.stringify(config.path)}]);`
				: `DownloadEngineAsset(engine=[${JSON.stringify(engine.engine_id)}], filePath=[${JSON.stringify(config.path)}]);`;

		setIsDownloading(true);
		try {
			const response = await runPixel<[string]>(pixel, targetInsightId);
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
	);
};

export const ENGINE_FILE_PDF_EDITOR_PANEL: WorkbenchPanelConfig<EngineFilePdfEditorConfig> =
	{
		name: "PDF",
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
		content: EngineFilePdfEditorPanel,
	};
