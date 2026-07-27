import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { CellType } from "./notebook.utility";

/** Compact dropdown for switching a cell between code / markdown / raw. */
export const NotebookCellTypeSelect: React.FC<{
	value: CellType;
	onChange: (type: CellType) => void;
	disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
	return (
		<Select
			value={value}
			onValueChange={(next) => onChange(next as CellType)}
			disabled={disabled}
		>
			<SelectTrigger
				size="sm"
				aria-label="Cell type"
				className="h-7 w-[104px] text-xs"
			>
				<SelectValue placeholder="Type" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="code">Code</SelectItem>
				<SelectItem value="markdown">Markdown</SelectItem>
				<SelectItem value="raw">Raw</SelectItem>
			</SelectContent>
		</Select>
	);
};
