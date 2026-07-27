import { EyeIcon, PencilIcon } from "lucide-react";
import { useState } from "react";
import { Button, Markdown } from "@semoss/ui/next";
import type { CellType } from "./notebook.utility";
import { NotebookCellTypeSelect } from "./notebook-cell-type-select";
import { NotebookCodeCellView } from "./notebook-code-cell-view";

/** Render a markdown cell with an Edit/Preview toggle so its source is editable. */
export const NotebookMarkdownCellView: React.FC<{
	value: string;
	disabled?: boolean;
	onChange: (value: string) => void;
	onChangeType: (type: CellType) => void;
}> = ({ value, disabled, onChange, onChangeType }) => {
	const [isEditing, setIsEditing] = useState(false);

	return (
		<div className="overflow-hidden rounded-md border border-border">
			<div className="flex items-center justify-between gap-2 border-border border-b bg-muted/40 px-3 py-1.5">
				<NotebookCellTypeSelect
					value="markdown"
					disabled={disabled}
					onChange={onChangeType}
				/>
				<Button
					variant="outline"
					size="sm"
					className="h-7 gap-1 px-2 text-xs"
					onClick={() => setIsEditing((prev) => !prev)}
				>
					{isEditing ? (
						<>
							<EyeIcon className="size-3.5" />
							Preview
						</>
					) : (
						<>
							<PencilIcon className="size-3.5" />
							Edit
						</>
					)}
				</Button>
			</div>
			{isEditing ? (
				<NotebookCodeCellView
					value={value}
					language="markdown"
					onChange={onChange}
				/>
			) : (
				<div className="p-4">
					{value.trim() ? (
						<Markdown>{value}</Markdown>
					) : (
						<span className="text-muted-foreground text-sm italic">
							Empty markdown cell — click Edit to add content.
						</span>
					)}
				</div>
			)}
		</div>
	);
};
