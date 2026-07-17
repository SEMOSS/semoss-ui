import { usePixel } from "@semoss/sdk/react";
import { FileCodeEditor } from "@semoss/shared";
import { Markdown, Muted, Spinner } from "@semoss/ui/next";

interface SkillFileViewerProps {
	projectId: string;
	insightId: string;
	path: string | null;
}

/**
 * Read-only preview of the selected file. Markdown files render through the
 * `Markdown` component; everything else is shown in a read-only Monaco view.
 */
export const SkillFileViewer: React.FC<SkillFileViewerProps> = ({
	projectId,
	insightId,
	path,
}) => {
	const ext = path?.split(".").pop()?.toLowerCase() ?? "";
	const isMarkdown = ext === "md" || ext === "markdown";

	const getFilePixel =
		isMarkdown && path
			? `GetAppAssets(filePath=["${path}"], project=["${projectId}"]);`
			: "";

	const fileContent = usePixel<string>(getFilePixel, {}, insightId);

	if (!path) {
		return (
			<div className="w-full px-2 py-4 text-center">
				<Muted>Select a file to preview</Muted>
			</div>
		);
	}

	if (isMarkdown) {
		if (
			fileContent.status === "LOADING" ||
			fileContent.status === "INITIAL"
		) {
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

		return (
			<div className="h-full w-full">
				<Markdown>{fileContent.data}</Markdown>
			</div>
		);
	}

	return (
		<div className="h-[80vh] overflow-hidden rounded-md border border-border">
			<FileCodeEditor
				key={path}
				mode={{
					type: "APP",
					app: projectId,
				}}
				path={path}
				readOnly
				hideToolbar
			/>
		</div>
	);
};
