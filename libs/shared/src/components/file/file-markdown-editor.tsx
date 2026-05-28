import { useRef, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Markdown,
	Muted,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
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

	// Only fetch when we actually need the preview content (preview tab active
	// and the user has not produced edited content yet).
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

	const handleTabChange = (next: string) => {
		const nextTab = next === "preview" ? "preview" : "edit";
		if (nextTab === "preview") {
			setPreviewContent(editedContentRef.current);
		}
		setTab(nextTab);
	};

	const resolvedPreview =
		previewContent ??
		(previewFetch.status === "SUCCESS" ? previewFetch.data : null);

	const tabsHeader = (
		<TabsList className="h-7">
			<TabsTrigger value="edit" className="px-3 text-xs">
				Edit
			</TabsTrigger>
			<TabsTrigger value="preview" className="px-3 text-xs">
				Preview
			</TabsTrigger>
		</TabsList>
	);

	return (
		<Tabs
			value={tab}
			onValueChange={handleTabChange}
			className="relative h-full w-full overflow-hidden bg-background"
		>
			<TabsContent
				value="edit"
				forceMount
				className="absolute inset-0 data-[state=inactive]:pointer-events-none data-[state=inactive]:invisible"
			>
				<FileCodeEditor
					mode={mode}
					path={path}
					onChange={handleContentChange}
					leadingToolbar={tabsHeader}
				/>
			</TabsContent>
			<TabsContent
				value="preview"
				className="absolute inset-0 flex flex-col"
			>
				<div className="flex shrink-0 items-center justify-between gap-1 border-border border-b px-1.5 py-0.5">
					<div className="flex items-center gap-1">{tabsHeader}</div>
				</div>
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
			</TabsContent>
		</Tabs>
	);
};
