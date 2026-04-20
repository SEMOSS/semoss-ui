import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Env, runPixel } from "@semoss/sdk/react";
import { Button, Spinner } from "@semoss/ui/next";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";

export interface PDFViewerBlockDef extends BlockDef<"pdfViewer"> {
	widget: "pdfViewer";
	data: {
		style: {
			width: string;
			height: string;
			padding: string;
		};
		selectedPdf: string | null;
		engineId: string;
		show: string;
	};
	listeners: {
		preProcess: {
			type: "sync" | "async";
			order: ListenerActions[];
		};
	};
}

export const PDF_FILE_PREFIX = "data:application/pdf;base64,";

export const PDFViewerBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData, listeners } = useBlock<PDFViewerBlockDef>(id);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pdfContent, setPdfContent] = useState<string | null>(null);
	const { appId } = useParams();

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);

	const downloadAndPrepareFile = useCallback(
		async (path: string, engineIds: string) => {
			try {
				setLoading(true);

				if (engineIds) {
					const response = await runPixel<[string]>(
						`GetEngineAssetsBase64(filePath=["${path}"], engine=["${engineIds}"]);`,
					);
					const base64Content = response?.pixelReturn[0]?.output;
					if (!base64Content)
						throw new Error("Failed to get base64 PDF");
					return base64Content.startsWith(PDF_FILE_PREFIX)
						? base64Content
						: PDF_FILE_PREFIX +
								base64Content.replace(/^data:.*?;base64,/, "");
				} else {
					const response = await runPixel<[string]>(
						`DownloadAsset(filePath=["${path}"], space=["${appId}"]);`,
					);
					const fileKey = response?.pixelReturn[0]?.output;
					const savedInsightId = response?.insightId;
					if (!fileKey) throw new Error("Failed to get file key");
					const url = `${Env.MODULE}/api/engine/downloadFile?insightId=${savedInsightId}&fileKey=${encodeURIComponent(fileKey as string)}`;
					const fileResponse = await fetch(url, {
						method: "GET",
						headers: new Headers({
							"Content-Type": "application/pdf",
						}),
					});
					const blob = await fileResponse.blob();
					return new Promise((resolve, reject) => {
						const reader = new FileReader();
						reader.onloadend = () => {
							const base64data = reader.result as string;
							if (!base64data.startsWith(PDF_FILE_PREFIX)) {
								resolve(
									PDF_FILE_PREFIX +
										base64data.replace(
											/^data:.*?;base64,/,
											"",
										),
								);
							} else {
								resolve(base64data);
							}
						};
						reader.onerror = reject;
						reader.readAsDataURL(blob);
					});
				}
			} catch {
				setError("Failed to load PDF");
				setLoading(false);
			}
		},
		[appId],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (data?.selectedPdf) {
			downloadAndPrepareFile(data.selectedPdf, data.engineId)
				.then((content) => {
					setPdfContent(content as string);
					setLoading(false);
				})
				.catch((err) => {
					console.error("Error loading PDF:", err);
					setError("Failed to load PDF");
					setLoading(false);
				});
		} else {
			setPdfContent(null);
			setError(null);
			setLoading(false);
		}
	}, [data.selectedPdf]);

	const fileName = data.selectedPdf?.split("/").pop() || "";

	const handleClear = useCallback(() => {
		setData("selectedPdf", "", true);
		setPdfContent(null);
		setError(null);
	}, [setData]);

	if (!data.selectedPdf) {
		return (
			<div style={data.style} {...attrs}>
				<span className="text-muted-foreground text-sm">
					Select a PDF from settings to view it here
				</span>
			</div>
		);
	}

	return (
		<div
			{...attrs}
			className="relative h-full rounded-md border bg-card p-2 shadow-sm"
		>
			<div className="mb-0 flex items-center justify-between">
				<span className="flex-1 truncate font-semibold text-base">
					{fileName}
				</span>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleClear}
					aria-label="clear pdf"
				>
					<X className="size-4" />
				</Button>
			</div>

			{loading && (
				<div className="flex min-h-[200px] items-center justify-center">
					<Spinner className="size-8" />
				</div>
			)}

			{error && <p className="p-2.5 text-destructive text-sm">{error}</p>}

			{pdfContent && !loading && !error && (
				<div className="h-[92%] flex-1 overflow-hidden rounded-md border">
					<object
						data={pdfContent}
						type="application/pdf"
						className="h-full w-full"
					>
						<iframe
							src={pdfContent}
							title={fileName}
							className="h-full min-h-[340px] w-full border-none"
							style={{ height: "calc(100% - 35px)" }}
						/>
					</object>
				</div>
			)}
		</div>
	);
});
