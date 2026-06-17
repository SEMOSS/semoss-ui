import { DownloadIcon, RefreshCwIcon, SaveIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Markdown,
	Muted,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import type { FileMode } from "./file.types";
import type { FileCodeEditorActions } from "./file-code-editor";
import { FileCodeEditor } from "./file-code-editor";

interface FileMarkdownEditorProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;
}

export const FileMarkdownEditor: React.FC<FileMarkdownEditorProps> = ({
	mode,
	path,
	onChange = () => null,
}) => {
	const insight = useInsight();
	const [tab, setTab] = useState<"edit" | "preview">("edit");
	const editedContentRef = useRef<string | null>(null);
	const [previewContent, setPreviewContent] = useState<string | null>(null);
	const editorActionsRef = useRef<FileCodeEditorActions | null>(null);

	const targetInsightId =
		mode.type === "INSIGHT"
			? mode.insightId || insight.insightId
			: insight.insightId;

	let getFilePixel = "";
	if (mode.type === "APP") {
		getFilePixel = `GetAppAssets(filePath=["${path}"], project=["${mode.app}"]);`;
	} else if (mode.type === "ENGINE") {
		getFilePixel = `GetEngineAssets(filePath=["${path}"], engine=["${mode.engine}"]);`;
	} else if (mode.type === "INSIGHT" && targetInsightId) {
		getFilePixel = `GetInsightAssets(filePath=["${path}"]);`;
	} else if (mode.type === "USER") {
		getFilePixel = `GetUserAssets(filePath=["${path}"]);`;
	}

	const shouldFetchPreview =
		tab === "preview" && editedContentRef.current === null;
	const previewFetch = usePixel<string>(
		shouldFetchPreview ? getFilePixel : "",
		{},
		targetInsightId,
	);

	const handleContentChange = (content: string, isModified: boolean) => {
		editedContentRef.current = content;
		onChange(content, isModified);
	};

	const handleTabChange = (next: "edit" | "preview") => {
		if (next === "preview") {
			setPreviewContent(editedContentRef.current);
		}
		setTab(next);
	};

	const resolvedPreview =
		previewContent ??
		(previewFetch.status === "SUCCESS" ? previewFetch.data : null);

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
			{/* Unified toolbar — always visible */}
			<div className="flex w-full shrink-0 items-center justify-between gap-2 border-border border-b px-3 pt-[4px] pb-[7px]">
				<Tabs
					value={tab}
					onValueChange={(v) =>
						handleTabChange(v as "edit" | "preview")
					}
				>
					<TabsList>
						<TabsTrigger value="edit">Edit</TabsTrigger>
						<TabsTrigger value="preview">Preview</TabsTrigger>
					</TabsList>
				</Tabs>
				<div className="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						onClick={() => editorActionsRef.current?.refresh()}
					>
						<RefreshCwIcon className="size-4" />
						Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => editorActionsRef.current?.save()}
					>
						<SaveIcon className="size-4" />
						Save
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => editorActionsRef.current?.download()}
					>
						<DownloadIcon className="size-4" />
						Download
					</Button>
				</div>
			</div>

			{/* Edit panel — always mounted so Monaco state is preserved */}
			<div
				className={
					tab === "edit"
						? "absolute inset-0 top-[48px]"
						: "pointer-events-none invisible absolute inset-0 top-[48px]"
				}
			>
				<FileCodeEditor
					ref={editorActionsRef}
					mode={mode}
					path={path}
					onChange={handleContentChange}
					hideToolbar
				/>
			</div>

			{/* Preview panel */}
			{tab === "preview" && (
				<div className="flex-1 overflow-y-auto px-6 py-4">
					{shouldFetchPreview &&
						previewFetch.status === "LOADING" && (
							<div className="flex h-full w-full items-center justify-center">
								<Spinner />
							</div>
						)}
					{shouldFetchPreview && previewFetch.status === "ERROR" && (
						<div className="flex h-full w-full items-center justify-center">
							<Muted className="text-destructive">
								{previewFetch.error?.message ||
									"Failed to load file"}
							</Muted>
						</div>
					)}
					{resolvedPreview !== null && (
						<Markdown>{resolvedPreview}</Markdown>
					)}
				</div>
			)}
		</div>
	);
};
