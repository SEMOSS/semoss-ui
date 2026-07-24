import DOMPurify from "dompurify";
import { PlayIcon } from "lucide-react";
import { marked } from "marked";
import { Button } from "@semoss/ui/next";
import type { JupyterCell } from "../types";
import { normalizeSource } from "../utils";
import { IpynbOutput } from "./ipynb-output";

interface IpynbCellProps {
	cell: JupyterCell;
	cellIndex: number;
	isSelected: boolean;
	isRunning: boolean;
	onSelect: (rowNumber: number, code: string, cellType: string) => void;
	onRun?: () => Promise<void>;
}

export const IpynbCell: React.FC<IpynbCellProps> = ({
	cell,
	cellIndex,
	isSelected,
	isRunning,
	onSelect,
	onRun,
}) => {
	const source = normalizeSource(cell.source);
	const selectCell = () => onSelect(cellIndex + 1, source, cell.cell_type);

	if (cell.cell_type === "markdown") {
		return (
			<div
				className={`rounded border p-3 ${isSelected ? "border-primary" : "border-border"}`}
			>
				<div className="mb-2 flex items-center justify-end">
					<Button
						size="sm"
						variant="outline"
						className="h-7 px-2 text-xs"
						onClick={selectCell}
					>
						Select Row
					</Button>
				</div>
				<div
					className="prose prose-sm max-w-none"
					// .ipynb files can come from untrusted sources (shared/uploaded), and
					// markdown may embed raw HTML/script; sanitize before injecting.
					// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized via DOMPurify above
					dangerouslySetInnerHTML={{
						__html: DOMPurify.sanitize(
							marked.parse(source) as string,
						),
					}}
				/>
			</div>
		);
	}

	if (cell.cell_type === "raw") {
		return (
			<div
				className={`rounded border p-3 ${isSelected ? "border-primary" : "border-border"}`}
			>
				<div className="mb-2 flex items-center justify-end">
					<Button
						size="sm"
						variant="outline"
						className="h-7 px-2 text-xs"
						onClick={selectCell}
					>
						Select Row
					</Button>
				</div>
				<pre className="whitespace-pre-wrap text-foreground text-xs">
					{source}
				</pre>
			</div>
		);
	}

	return (
		<div
			className={`rounded border p-3 ${isSelected ? "border-primary" : "border-border"}`}
		>
			<div className="mb-2 flex items-center justify-between">
				<div className="font-mono text-muted-foreground text-xs">
					In [{cell.execution_count ?? " "}]
				</div>
				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant="outline"
						className="h-7 px-2 text-xs"
						onClick={selectCell}
					>
						Select Row
					</Button>
					{onRun && (
						<Button
							size="sm"
							variant="outline"
							className="h-7 gap-1 px-2 text-xs"
							disabled={isRunning}
							onClick={() => {
								void onRun();
							}}
						>
							<PlayIcon className="size-3.5" />
							{isRunning ? "Running..." : "Run"}
						</Button>
					)}
				</div>
			</div>
			<pre className="mb-3 whitespace-pre-wrap rounded border bg-muted/30 p-3 font-mono text-foreground text-xs">
				{source}
			</pre>
			<div className="flex flex-col gap-2">
				{cell.outputs.map((output, outputIndex) => (
					<IpynbOutput
						key={`${output.output_type}-${outputIndex}`}
						output={output}
					/>
				))}
			</div>
		</div>
	);
};
