import { getCodeEditorLanguage } from "@semoss/panels";
import { usePixel } from "@semoss/sdk/react";
import { CodeEditor, Markdown, Muted, Spinner } from "@semoss/ui/next";

interface SkillFileViewerProps {
	projectId: string;
	insightId: string;
	path: string | null;
}

/**
 * Read-only preview of the selected file. Markdown files render through the
 * `Markdown` component; everything else is shown in a read-only Monaco view.
 *
 * Reads the file itself and renders `CodeEditor` directly rather than going
 * through `@semoss/shared`'s `FileEditor` family: with `readOnly` and
 * `hideToolbar` set, all that wrapper added was the same pixel this component
 * already ran for its Markdown branch. The workbench's own file panels take the
 * same direct route.
 */
export const SkillFileViewer: React.FC<SkillFileViewerProps> = ({
	projectId,
	insightId,
	path,
}) => {
	const fileContent = usePixel<string>(
		path
			? `GetAppAssets(filePath=["${path}"], project=["${projectId}"]);`
			: "",
		{ data: "" },
		insightId,
	);

	if (!path) {
		return (
			<div className="w-full px-2 py-4 text-center">
				<Muted>Select a file to preview</Muted>
			</div>
		);
	}

	if (fileContent.status === "LOADING" || fileContent.status === "INITIAL") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner className="size-4" />
			</div>
		);
	}

	if (fileContent.status === "ERROR") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Muted className="text-destructive">
					{fileContent.error?.message || "Failed to load file"}
				</Muted>
			</div>
		);
	}

	const extension = path.split(".").pop()?.toLowerCase() ?? "";
	if (extension === "md" || extension === "markdown") {
		return (
			<div className="h-full w-full overflow-y-auto px-1">
				<Markdown
					className="w-full text-sm leading-relaxed"
					variant="document"
				>
					{fileContent.data}
				</Markdown>
			</div>
		);
	}

	return (
		<div className="h-[80vh] overflow-hidden rounded-md border border-border">
			<CodeEditor
				key={path}
				className="size-full"
				code={fileContent.data}
				disabled
				language={getCodeEditorLanguage(path)}
			/>
		</div>
	);
};
