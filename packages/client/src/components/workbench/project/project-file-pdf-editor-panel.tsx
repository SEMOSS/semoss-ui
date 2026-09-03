import { DownloadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { useProject, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import {
	ProjectFilePdfEditorControl,
	type ProjectFilePdfEditorControlValue,
} from "./project-file-pdf-editor-control";

export interface ProjectFilePdfEditorConfig {
	name: string;
	path: string;
	readOnly?: boolean;
}

const ProjectFilePdfEditorPanel: WorkbenchComponent<
	ProjectFilePdfEditorConfig
> = ({ config, id, setValue }) => {
	const { project } = useProject();
	const insight = useInsight();
	const { t } = useTranslation("common");
	const [isDownloading, setIsDownloading] = useState(false);
	const pdf = usePixel<string>(
		`GetAppAssetsBase64(filePath=[${JSON.stringify(config.path)}], project=[${JSON.stringify(project.project_id)}]);`,
		{ data: "" },
	);
	const refreshRef = useRef(pdf.refresh);
	refreshRef.current = pdf.refresh;

	// setValue changes identity after writing the value.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => {
		const value: ProjectFilePdfEditorControlValue = {
			refresh: () => refreshRef.current(),
		};
		setValue(value);
	}, []);
	useWorkbenchControl(id, ProjectFilePdfEditorControl);

	/** Download the PDF when the browser cannot render it inline. */
	const download = async () => {
		if (isDownloading) return;

		setIsDownloading(true);
		try {
			const response = await runPixel<[string]>(
				`DownloadAppAsset(project=[${JSON.stringify(project.project_id)}], filePath=[${JSON.stringify(config.path)}]);`,
				insight.insightId,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors[0]);
			}

			const fileKey = response.pixelReturn[0]?.output;
			if (!fileKey || !insight.insightId) {
				throw new Error("No PDF download is available");
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

export const PROJECT_FILE_PDF_EDITOR_PANEL: WorkbenchPanelConfig<ProjectFilePdfEditorConfig> =
	{
		name: "PDF",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		icon: ({ config, className }) => {
			const Icon = getFileIconComponent(config.path ?? "");
			return <Icon className={className} />;
		},
		content: ProjectFilePdfEditorPanel,
	};
