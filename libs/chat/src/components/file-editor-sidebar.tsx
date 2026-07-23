import { XIcon } from "lucide-react";
import { useState } from "react";
import { FileEditor } from "@semoss/shared";
import { Button } from "@semoss/ui/next";

export interface FileEditorSidebarProps {
	fileName: string;
	path: string;
	onClose?: () => void;
	showCloseButton?: boolean;
}

/**
 * Right-panel file editor for attachment/file clicks, matching playground's
 * room-file-editor behavior within @semoss/chat's local sidebar.
 */
export function FileEditorSidebar({
	fileName,
	path,
	onClose,
	showCloseButton = true,
}: FileEditorSidebarProps) {
	const [isModified, setIsModified] = useState(false);
	const title = isModified ? `${fileName}*` : fileName;

	return (
		<div
			data-slot="file-editor-sidebar"
			className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-card"
		>
			<div className="flex items-center gap-2 border-border border-b px-4 py-3">
				<div className="min-w-0 flex-1">
					<div className="truncate font-semibold text-base">
						{title}
					</div>
					<div className="truncate text-muted-foreground text-sm">
						{path}
					</div>
				</div>
				{showCloseButton && onClose ? (
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						onClick={onClose}
						aria-label="Close file editor sidebar"
					>
						<XIcon className="size-4" />
					</Button>
				) : null}
			</div>
			<div className="min-h-0 flex-1 overflow-hidden">
				<FileEditor
					mode={{ type: "INSIGHT" }}
					path={path}
					onChange={(_content, nextIsModified) => {
						setIsModified(nextIsModified);
					}}
				/>
			</div>
		</div>
	);
}
