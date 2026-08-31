import { EyeIcon, PencilIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { SandpackHtmlPreview } from "../html";
import type { FileMode } from "./file.types";
import { FileCodeEditor } from "./file-code-editor";

export interface FileHtmlEditorProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;

	/** When true the code view cannot be edited and Save is hidden */
	readOnly?: boolean;
}

/**
 * Code editor for an html file, with a preview of the rendered page.
 *
 * The preview goes through the same sandboxed renderer the chat uses for html
 * it generates, so a page opened from the file browser cannot reach the app
 * around it. The Edit / Preview control is the same one the chat block uses.
 *
 * Edits show up in the preview without saving first: the code editor reports
 * what the user has typed, and that takes precedence over what was read from
 * disk.
 */
export const FileHtmlEditor: React.FC<FileHtmlEditorProps> = ({
	mode,
	path,
	onChange = () => null,
	readOnly = false,
}) => {
	const [showPreview, setShowPreview] = useState(false);
	// what the editor currently holds, which is ahead of the saved file once the
	// user starts typing
	const [editedContent, setEditedContent] = useState<string | null>(null);

	const targetInsightId =
		mode.type === "INSIGHT" ? mode.insightId : undefined;

	let getFilePixel = "";
	if (mode.type === "APP") {
		getFilePixel = `GetAppAssets(filePath=["${path}"], project=["${mode.app}"]);`;
	} else if (mode.type === "ENGINE") {
		getFilePixel = `GetEngineAssets(filePath=["${path}"], engine=["${mode.engine}"]);`;
	} else if (mode.type === "INSIGHT") {
		getFilePixel = `GetInsightAssets(filePath=["${path}"]);`;
	} else if (mode.type === "USER") {
		getFilePixel = `GetUserAssets(filePath=["${path}"]);`;
	}

	// the file is only read for the preview, and only once the preview is
	// showing without a working copy to render. While editing, what the editor
	// reports is used instead
	const getFile = usePixel<string>(
		showPreview && editedContent === null ? getFilePixel : "",
		{
			onSuccess: (raw) => {
				const next = raw ?? "";
				// what was read becomes the working copy, and it matches the file,
				// so tell the caller to drop any dirty marker. Refreshing from the
				// preview would otherwise leave the marker until the editor is
				// opened again
				setEditedContent(next);
				onChange(next, false);
			},
		},
		targetInsightId,
	);

	const handleChange = useCallback(
		(content: string, isModified: boolean) => {
			setEditedContent(content);
			onChange(content, isModified);
		},
		[onChange],
	);

	// the button names where it goes, matching the chat block
	const previewToggle = (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					className="text-muted-foreground text-xs hover:text-foreground"
					variant="ghost"
					size="sm"
					onClick={() => setShowPreview((shown) => !shown)}
					aria-label={showPreview ? "Edit HTML" : "Switch to preview"}
					aria-pressed={showPreview}
				>
					{showPreview ? (
						<PencilIcon className="size-3" />
					) : (
						<EyeIcon className="size-3" />
					)}
					{showPreview ? "Edit" : "Preview"}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{showPreview ? "Edit HTML" : "Switch to preview"}
			</TooltipContent>
		</Tooltip>
	);

	if (!showPreview) {
		return (
			<FileCodeEditor
				mode={mode}
				path={path}
				// the working copy lives here, so switching to the preview and
				// back keeps whatever has been typed. It is only in memory until
				// the editor's own Save writes it
				value={editedContent ?? undefined}
				onChange={handleChange}
				readOnly={readOnly}
				toolbarStart={previewToggle}
			/>
		);
	}

	const html = editedContent ?? getFile.data ?? "";
	const isLoading = editedContent === null && getFile.status === "LOADING";

	return (
		<div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
			{/* same shape as the code editor's toolbar so the toggle stays put */}
			<div className="flex w-full shrink-0 items-center justify-between gap-1.5 border-border border-b px-2 py-1">
				<div className="flex items-center gap-1.5">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								disabled={isLoading}
								onClick={() => {
									// drop the edited copy so the file is read again
									setEditedContent(null);
									getFile.refresh();
								}}
								aria-label="Refresh"
							>
								<RefreshCwIcon className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Refresh</TooltipContent>
					</Tooltip>
					{previewToggle}
				</div>
			</div>

			<div className="min-h-0 flex-1">
				{isLoading ? (
					<div className="flex h-full w-full items-center justify-center">
						<Spinner />
					</div>
				) : (
					<SandpackHtmlPreview
						key={path}
						html={html}
						forceFullHeight
						className="border-0"
					/>
				)}
			</div>
		</div>
	);
};
