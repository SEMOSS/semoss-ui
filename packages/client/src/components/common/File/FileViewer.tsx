import { useEffect, useState } from "react";
import { Env, runPixel } from "@semoss/sdk/react";
import { Box, CircularProgress, styled, Typography } from "@semoss/ui";

const ViewerContainer = styled("div")({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	height: "100%",
	width: "100%",
	overflow: "auto",
});

const PDFContainer = styled(Box)(({ theme }) => ({
	height: "100%",
	width: "100%",
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius,
	overflow: "hidden",
}));

const PDFObject = styled("object")({
	width: "100%",
	height: "100%",
});

const PDFIframe = styled("iframe")({
	width: "100%",
	height: "100%",
	border: "none",
});

const ImageContainer = styled(Box)({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	height: "100%",
	width: "100%",
	padding: "16px",
	overflow: "auto",
	backgroundColor: "#f5f5f5",
});

const StyledImage = styled("img")({
	maxWidth: "100%",
	maxHeight: "100%",
	objectFit: "contain",
	borderRadius: "4px",
	boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
});

const ErrorMessage = styled(Typography)(({ theme }) => ({
	padding: theme.spacing(2.5),
	color: theme.palette.error.main,
	textAlign: "center",
}));

const InfoMessage = styled(Typography)(({ theme }) => ({
	padding: theme.spacing(2.5),
	color: theme.palette.text.secondary,
	textAlign: "center",
}));

const PDF_FILE_PREFIX = "data:application/pdf;base64,";

interface FileViewerProps {
	type: "app" | "insight" | "engine";
	space: string;
	path: string;
	insightId?: string | null;
	fileType: "pdf" | "image" | "unsupported";
}

export const FileViewer: React.FC<FileViewerProps> = ({
	type,
	space,
	path,
	insightId,
	fileType,
}) => {
	const [content, setContent] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadFileContent();
	}, [type, space, path]);

	const loadFileContent = async () => {
		try {
			setIsLoading(true);
			setError(null);

			if (type === "engine") {
				// For engine files, use GetEngineAssetsBase64
				const response = await runPixel<[string]>(
					`GetEngineAssetsBase64(filePath=["${path}"], engine=["${space}"]);`,
					insightId,
				);

				const base64Content = response?.pixelReturn[0]?.output;
				if (!base64Content) {
					throw new Error("Failed to get file content");
				}

				// Ensure proper data URI prefix
				let dataUri = base64Content;
				if (fileType === "pdf") {
					dataUri = base64Content.startsWith(PDF_FILE_PREFIX)
						? base64Content
						: PDF_FILE_PREFIX +
							base64Content.replace(/^data:.*?;base64,/, "");
				} else if (fileType === "image") {
					// Detect image type from extension
					const ext = path.split(".").pop()?.toLowerCase();
					const mimeTypes: Record<string, string> = {
						jpg: "image/jpeg",
						jpeg: "image/jpeg",
						png: "image/png",
						gif: "image/gif",
						svg: "image/svg+xml",
						webp: "image/webp",
						bmp: "image/bmp",
						ico: "image/x-icon",
					};
					const mimeType = mimeTypes[ext || ""] || "image/jpeg";
					const imagePrefix = `data:${mimeType};base64,`;
					dataUri = base64Content.startsWith("data:")
						? base64Content
						: imagePrefix +
							base64Content.replace(/^data:.*?;base64,/, "");
				}

				setContent(dataUri);
			} else if (type === "app") {
				// For app files, use DownloadAsset and fetch from API
				const response = await runPixel<[string]>(
					`DownloadAsset(filePath=["${path}"], space=["${space}"]);`,
					insightId,
				);

				const fileKey = response?.pixelReturn[0]?.output;
				const savedInsightId = response?.insightId;

				if (!fileKey) {
					console.error("No file key returned from DownloadAsset");
					throw new Error("Failed to get file key");
				}

				const url = `${Env.MODULE}/api/engine/downloadFile?insightId=${savedInsightId}&fileKey=${encodeURIComponent(fileKey as string)}`;

				console.log("Fetching file from URL:", url);

				const fileResponse = await fetch(url, {
					method: "GET",
				});

				if (!fileResponse.ok) {
					console.error(
						"File download failed:",
						fileResponse.status,
						fileResponse.statusText,
					);
					throw new Error(
						`Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`,
					);
				}

				const blob = await fileResponse.blob();
				console.log(
					"Blob received, size:",
					blob.size,
					"type:",
					blob.type,
				);

				// Convert blob to base64 data URI
				const base64data = await new Promise<string>(
					(resolve, reject) => {
						const reader = new FileReader();
						reader.onloadend = () => {
							const result = reader.result as string;

							if (fileType === "pdf") {
								// Ensure PDF has proper prefix
								if (!result.startsWith(PDF_FILE_PREFIX)) {
									const base64Content = result.replace(
										/^data:.*?;base64,/,
										"",
									);
									resolve(PDF_FILE_PREFIX + base64Content);
								} else {
									resolve(result);
								}
							} else {
								resolve(result);
							}
						};
						reader.onerror = reject;
						reader.readAsDataURL(blob);
					},
				);
				setContent(base64data);
			} else {
				throw new Error("Insight type not yet supported");
			}
		} catch (e) {
			console.error("Error loading file:", e);
			console.error(
				"File details - type:",
				type,
				"space:",
				space,
				"path:",
				path,
				"fileType:",
				fileType,
			);
			setError(e.message || "Failed to load file");
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return (
			<ViewerContainer>
				<CircularProgress />
				<Typography variant="body2" sx={{ mt: 2 }}>
					Loading file...
				</Typography>
			</ViewerContainer>
		);
	}

	if (error) {
		return (
			<ViewerContainer>
				<ErrorMessage variant="body1">{error}</ErrorMessage>
			</ViewerContainer>
		);
	}

	if (!content) {
		return (
			<ViewerContainer>
				<InfoMessage variant="body2">No content to display</InfoMessage>
			</ViewerContainer>
		);
	}

	if (fileType === "pdf") {
		return (
			<PDFContainer>
				<PDFObject data={content} type="application/pdf">
					<PDFIframe src={content} title={path.split("/").pop()} />
				</PDFObject>
			</PDFContainer>
		);
	}
	if (fileType === "image") {
		return (
			<ImageContainer>
				<StyledImage
					src={content}
					alt={path.split("/").pop()}
					onError={() => setError("Failed to load image")}
				/>
			</ImageContainer>
		);
	}

	return (
		<ViewerContainer>
			<InfoMessage variant="body1">
				Preview not available for this file type.
				<br />
				Please download the file to view it.
			</InfoMessage>
		</ViewerContainer>
	);
};
