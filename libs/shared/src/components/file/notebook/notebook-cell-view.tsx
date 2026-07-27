import { ChevronDownIcon, ChevronRightIcon, PlayIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@semoss/ui/next";
import type { CellType, JupyterCell } from "./notebook.utility";
import { normalizeSource } from "./notebook.utility";
import { NotebookCellTypeSelect } from "./notebook-cell-type-select";
import { NotebookCodeCellView } from "./notebook-code-cell-view";
import { NotebookMarkdownCellView } from "./notebook-markdown-cell-view";
import { NotebookOutputView } from "./notebook-output-view";

/** Render a single notebook cell (markdown / raw / code + its outputs). */
export const NotebookCellView: React.FC<{
	cell: JupyterCell;
	index: number;
	isRunning: boolean;
	disabled: boolean;
	onRun: (index: number) => void;
	onSourceChange: (index: number, source: string) => void;
	onChangeType: (index: number, type: CellType) => void;
}> = ({
	cell,
	index,
	isRunning,
	disabled,
	onRun,
	onSourceChange,
	onChangeType,
}) => {
	const [outputsCollapsed, setOutputsCollapsed] = useState(false);
	const source = normalizeSource(cell.source);

	if (cell.cell_type === "markdown") {
		return (
			<NotebookMarkdownCellView
				value={source}
				disabled={disabled}
				onChange={(next) => onSourceChange(index, next)}
				onChangeType={(type) => onChangeType(index, type)}
			/>
		);
	}

	if (cell.cell_type === "raw") {
		return (
			<div className="overflow-hidden rounded-md border border-border">
				<div className="flex items-center gap-2 border-border border-b bg-muted/40 px-3 py-1.5">
					<NotebookCellTypeSelect
						value="raw"
						disabled={disabled}
						onChange={(type) => onChangeType(index, type)}
					/>
				</div>
				<pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-foreground text-xs">
					{source}
				</pre>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-md border border-border">
			<div className="flex items-center justify-between gap-2 border-border border-b bg-muted/40 px-3 py-1.5">
				<div className="flex items-center gap-2">
					<NotebookCellTypeSelect
						value="code"
						disabled={disabled}
						onChange={(type) => onChangeType(index, type)}
					/>
					<span className="font-mono text-muted-foreground text-xs">
						In [{cell.execution_count ?? " "}]
					</span>
				</div>
				<Button
					variant="outline"
					size="sm"
					className="h-7 gap-1 px-2 text-xs"
					disabled={disabled}
					onClick={() => onRun(index)}
				>
					<PlayIcon className="size-3.5" />
					{isRunning ? "Running…" : "Run"}
				</Button>
			</div>
			<NotebookCodeCellView
				value={source}
				onChange={(next) => onSourceChange(index, next)}
			/>
			{cell.outputs.length > 0 && (
				<div className="border-border border-t">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setOutputsCollapsed((prev) => !prev)}
						className="h-auto w-full justify-start gap-1 rounded-none px-3 py-1.5 font-normal text-muted-foreground text-xs hover:text-foreground"
					>
						{outputsCollapsed ? (
							<ChevronRightIcon className="size-3.5" />
						) : (
							<ChevronDownIcon className="size-3.5" />
						)}
						<span>
							{outputsCollapsed
								? `Output (${cell.outputs.length} hidden)`
								: "Output"}
						</span>
					</Button>
					{!outputsCollapsed && (
						<div className="flex flex-col gap-2 px-3 pb-3">
							{cell.outputs.map((output, outputIndex) => (
								<NotebookOutputView
									key={`${output.output_type}-${outputIndex}`}
									output={output}
								/>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
};
