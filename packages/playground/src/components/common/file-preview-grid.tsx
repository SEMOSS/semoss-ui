import type { ReactNode } from "react";
import { FilePreviewChip } from "./file-preview-chip";

interface FilePreviewGridProps {
	/** Pending attachments, in submission order. */
	files: File[];
	/** Removes an attachment at its original index. */
	onRemoveFile: (index: number) => void;
	/** Already-saved attachments queued by connector viewers. */
	leading?: ReactNode;
}

/** Wraps pending attachment chips within even a narrow docked composer. */
export function FilePreviewGrid({
	files,
	onRemoveFile,
	leading,
}: FilePreviewGridProps) {
	return (
		<div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
			{leading}
			{files.map((file, index) => (
				<FilePreviewChip
					key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
					file={file}
					onRemove={() => onRemoveFile(index)}
				/>
			))}
		</div>
	);
}
