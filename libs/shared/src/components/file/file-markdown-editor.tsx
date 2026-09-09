import { DownloadIcon, RefreshCwIcon, SaveIcon } from "lucide-react";
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Markdown,
	Muted,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { FileMode } from "./file.types";
import { FileCodeEditor } from "./file-code-editor";

interface FileMarkdownEditorProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;

	/** When true, the editor is view-only: content cannot be edited and the
	 * Save action is hidden. Defaults to false. */
	readOnly?: boolean;

	/** Presentation mode controlled by the workbench panel. */
	viewMode?: "preview" | "raw";

	/** When true, the built-in toolbar (Refresh/Save/Download) is not rendered.
	 *  Use this when the parent renders its own unified toolbar. */
	hideToolbar?: boolean;
}

interface FileMarkdownEditorRef {
	/** Refresh the markdown from its asset source. */
	refresh: () => void;
	/** Save the current markdown content. */
	save?: () => Promise<void>;
}

export const FileMarkdownEditor = forwardRef<
	FileMarkdownEditorRef,
	FileMarkdownEditorProps
>(
	(
		{
			mode,
			path,
			onChange = () => null,
			readOnly = false,
			viewMode,
			hideToolbar = false,
		},
		actionsRef,
	) => {
		const insight = useInsight();
		const editedContentRef = useRef<string | null>(null);
		const [previewContent, setPreviewContent] = useState<string | null>(
			null,
		);
		const editorActionsRef = useRef<React.ComponentRef<
			typeof FileCodeEditor
		> | null>(null);
		const [internalViewMode, setInternalViewMode] = useState<
			"preview" | "raw"
		>("raw");
		const activeViewMode = viewMode ?? internalViewMode;
		const isPreview = activeViewMode === "preview";

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
			isPreview && editedContentRef.current === null;
		const previewFetch = usePixel<string>(
			shouldFetchPreview ? getFilePixel : "",
			{},
			targetInsightId,
		);

		const handleContentChange = (content: string, isModified: boolean) => {
			editedContentRef.current = content;
			if (isPreview) {
				setPreviewContent(content);
			}
			onChange(content, isModified);
		};

		useEffect(() => {
			if (isPreview) {
				setPreviewContent(editedContentRef.current);
			}
		}, [isPreview]);

		useImperativeHandle(actionsRef, () => ({
			refresh: () => editorActionsRef.current?.refresh(),
			save: () => editorActionsRef.current?.save() ?? Promise.resolve(),
		}));

		const resolvedPreview =
			previewContent ??
			(previewFetch.status === "SUCCESS" ? previewFetch.data : null);

		return (
			<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
				{/* Workbench owns common actions only in controlled mode. */}
				{hideToolbar && (
					<div className="flex w-full shrink-0 items-center gap-1.5 border-border border-b px-2 py-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										editorActionsRef.current?.refresh()
									}
									aria-label="Refresh"
								>
									<RefreshCwIcon className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Refresh</TooltipContent>
						</Tooltip>
						<Tabs
							value={activeViewMode}
							onValueChange={(mode) =>
								setInternalViewMode(mode as "preview" | "raw")
							}
						>
							<TabsList>
								<TabsTrigger value="raw">Edit</TabsTrigger>
								<TabsTrigger value="preview">
									Preview
								</TabsTrigger>
							</TabsList>
						</Tabs>

						<div className="flex-1" />
						<div className="flex items-center gap-1.5">
							{!readOnly && (
								<>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													editorActionsRef.current?.save()
												}
												aria-label="Save"
											>
												<SaveIcon className="size-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>Save</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													editorActionsRef.current?.download()
												}
												aria-label="Download"
											>
												<DownloadIcon className="size-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											Download
										</TooltipContent>
									</Tooltip>
								</>
							)}
						</div>
					</div>
				)}

				{/* Edit panel — always mounted so Monaco state is preserved */}
				<div
					className={
						!isPreview
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
						readOnly={readOnly}
					/>
				</div>

				{/* Preview panel */}
				{isPreview && (
					<div className="flex-1 overflow-y-auto px-6 py-4">
						{shouldFetchPreview &&
							previewFetch.status === "LOADING" && (
								<div className="flex h-full w-full items-center justify-center">
									<Spinner />
								</div>
							)}
						{shouldFetchPreview &&
							previewFetch.status === "ERROR" && (
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
	},
);
