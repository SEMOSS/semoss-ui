import { EyeIcon, PencilIcon } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Markdown,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { JupyterMarkdownCell } from "./notebook.types";
import { normalizeSource } from "./notebook.utility";
import { NotebookCell, type NotebookCellBaseProps } from "./notebook-cell";
import { NotebookCellInputCode } from "./notebook-cell-input-code";

interface NotebookMarkdownCellProps extends NotebookCellBaseProps {
	/** The markdown cell to render. */
	cell: JupyterMarkdownCell;
	/** Persist an edited cell source. */
	onSourceChange: (index: number, source: string) => void;
}

/**
 * Markdown cell: shows the source as a rendered preview, or the Monaco editor
 * while editing. Toggle editing from the toolbar or by double-clicking the
 * preview. Supplies the Edit/Preview primary control to the shared frame.
 */
export const NotebookMarkdownCell: React.FC<NotebookMarkdownCellProps> = ({
	cell,
	onSourceChange,
	...chrome
}) => {
	const { index } = chrome;
	const [isEditing, setIsEditing] = useState(false);
	const source = normalizeSource(cell.source);

	const primaryAction = (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className="size-7"
					onClick={(e) => {
						e.stopPropagation();
						setIsEditing((prev) => !prev);
					}}
					aria-label={
						isEditing ? "Switch to preview" : "Edit markdown"
					}
				>
					{isEditing ? (
						<EyeIcon className="size-3.5" />
					) : (
						<PencilIcon className="size-3.5" />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{isEditing ? "Switch to preview" : "Edit markdown"}
			</TooltipContent>
		</Tooltip>
	);

	return (
		<NotebookCell cell={cell} {...chrome} primaryAction={primaryAction}>
			{isEditing ? (
				<NotebookCellInputCode
					value={source}
					language="markdown"
					onChange={(next) => onSourceChange(index, next)}
				/>
			) : (
				// biome-ignore lint/a11y/noStaticElementInteractions: double-click enters edit mode
				<div className="p-4" onDoubleClick={() => setIsEditing(true)}>
					{source.trim() ? (
						<Markdown>{source}</Markdown>
					) : (
						<span className="text-muted-foreground text-sm italic">
							Empty markdown cell — double-click to edit.
						</span>
					)}
				</div>
			)}
		</NotebookCell>
	);
};
