import {
	ChevronDownIcon,
	ChevronRightIcon,
	ChevronsDownIcon,
	ChevronsUpIcon,
	EraserIcon,
	PlayIcon,
	SquareIcon,
} from "lucide-react";
import { useState } from "react";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { JupyterCodeCell, JupyterOutput } from "./notebook.types";
import { normalizeSource } from "./notebook.utility";
import {
	NotebookCell,
	type NotebookCellAction,
	type NotebookCellBaseProps,
} from "./notebook-cell";
import { NotebookCellInputCode } from "./notebook-cell-input-code";
import { NotebookCellOutput } from "./notebook-cell-output";

interface NotebookCodeCellProps extends NotebookCellBaseProps {
	/** The code cell to render. */
	cell: JupyterCodeCell;
	/** True while this cell is executing. */
	isRunning: boolean;
	/** Duration of the last execution in milliseconds. */
	executionDurationMs?: number;
	/** Whether at least one code cell exists above this one. */
	canRunAbove: boolean;
	/** Whether at least one code cell exists below this one. */
	canRunBelow: boolean;
	/** Run this cell. */
	onRun: (index: number) => void;
	/** Run this cell then advance focus. */
	onRunAndAdvance: (index: number) => void;
	/** Interrupt a running execution. */
	onInterrupt: (index: number) => void;
	/** Run every code cell above this one. */
	onRunAbove: (index: number) => void;
	/** Run every code cell below this one. */
	onRunBelow: (index: number) => void;
	/** Clear this cell's persisted outputs (and its live console). */
	onClearOutput: (index: number) => void;
	/** Persist an edited cell source. */
	onSourceChange: (index: number, source: string) => void;
	/** Live console lines for the current/last run; shown but never persisted. */
	streamingLogs?: string[];
}

/**
 * Code cell: the Monaco editor plus its persisted nbformat outputs and a
 * transient "Console" block mirroring streamed logs (viewable but not saved to
 * the file). Supplies the Run/Stop primary control and the run/clear menu
 * actions to the shared `NotebookCell` frame.
 */
export const NotebookCodeCell: React.FC<NotebookCodeCellProps> = ({
	cell,
	isRunning,
	executionDurationMs,
	canRunAbove,
	canRunBelow,
	onRun,
	onRunAndAdvance,
	onInterrupt,
	onRunAbove,
	onRunBelow,
	onClearOutput,
	onSourceChange,
	streamingLogs,
	...otherProps
}) => {
	const { index, disabled, readOnly } = otherProps;

	const hasError = cell.outputs.some((o) => o.output_type === "error");
	const executionStatus =
		isRunning || cell.execution_count === null
			? null
			: hasError
				? "error"
				: "success";

	const [outputsCollapsed, setOutputsCollapsed] = useState<boolean>(() => {
		const tags = cell.metadata.tags;
		return (
			Array.isArray(tags) && (tags as string[]).includes("hide-output")
		);
	});
	const [consoleCollapsed, setConsoleCollapsed] = useState(false);

	const hasOutputs = cell.outputs.length > 0;
	const hasStreaming = Boolean(streamingLogs && streamingLogs.length > 0);
	const hasVisibleOutput = hasOutputs || hasStreaming;

	const gutterAction = isRunning ? (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className="size-6 text-destructive hover:text-destructive"
					onClick={(e) => {
						e.stopPropagation();
						onInterrupt(index);
					}}
					aria-label="Stop execution"
				>
					<SquareIcon className="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Stop execution</TooltipContent>
		</Tooltip>
	) : (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className="sticky top-0 size-6 text-muted-foreground/60 hover:text-foreground"
					disabled={disabled}
					onClick={(e) => {
						e.stopPropagation();
						onClearOutput(index);
						onRun(index);
					}}
					aria-label="Run cell"
				>
					<PlayIcon className="size-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Run cell</TooltipContent>
		</Tooltip>
	);

	const actions: NotebookCellAction[] = [
		{
			id: "run",
			label: "Run Cell",
			icon: <PlayIcon className="size-4" />,
			onSelect: () => {
				onClearOutput(index);
				onRun(index);
			},
			disabled,
		},
		{
			id: "run-above",
			label: "Run Cells Above",
			icon: <ChevronsUpIcon className="size-4" />,
			onSelect: () => {
				onClearOutput(index);
				onRunAbove(index);
			},
			disabled: disabled || !canRunAbove,
		},
		{
			id: "run-below",
			label: "Run Cells Below",
			icon: <ChevronsDownIcon className="size-4" />,
			onSelect: () => {
				onClearOutput(index);
				onRunBelow(index);
			},
			disabled: disabled || !canRunBelow,
		},
	];
	if (!readOnly && hasVisibleOutput) {
		actions.push({
			id: "clear-output",
			label: "Clear Output",
			icon: <EraserIcon className="size-4" />,
			onSelect: () => onClearOutput(index),
			disabled,
		});
	}

	// Each streamed log on its own line, as one synthetic stdout stream.
	const streamingOutput: JupyterOutput | null = hasStreaming
		? {
				output_type: "stream",
				name: "stdout",
				text: (streamingLogs ?? []).join("\n"),
			}
		: null;

	return (
		<NotebookCell
			cell={cell}
			{...otherProps}
			gutterAction={gutterAction}
			actions={actions}
			executionStatus={executionStatus}
			executionDurationMs={executionDurationMs}
		>
			<NotebookCellInputCode
				value={normalizeSource(cell.source)}
				language="python"
				readOnly={readOnly}
				onChange={(next) => onSourceChange(index, next)}
				onRunInPlace={() => {
					onClearOutput(index);
					onRun(index);
				}}
				onRunAndAdvance={() => {
					onClearOutput(index);
					onRunAndAdvance(index);
				}}
			/>

			{hasStreaming && (
				<div className="border-border border-t">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setConsoleCollapsed((prev) => !prev);
						}}
						className="flex h-auto w-full items-center justify-start gap-1 rounded-none px-1 py-1.5 font-normal text-muted-foreground text-xs hover:text-foreground"
					>
						{consoleCollapsed ? (
							<ChevronRightIcon className="size-3" />
						) : (
							<ChevronDownIcon className="size-3" />
						)}
						<span>
							{consoleCollapsed
								? `Console (${streamingLogs?.length ?? 0} hidden)`
								: "Console"}
						</span>
						{isRunning && <Spinner className="size-3" />}
					</button>
					{!consoleCollapsed && streamingOutput && (
						// Cap the console at ~8 lines (8rem text + p-3), then scroll.
						<div className="flex max-h-36 flex-col-reverse overflow-y-auto">
							<div>
								<NotebookCellOutput output={streamingOutput} />
							</div>
						</div>
					)}
				</div>
			)}

			{hasOutputs && (
				<div className="border-border border-t">
					<div className="flex w-full items-center justify-between">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setOutputsCollapsed((prev) => !prev);
							}}
							className="flex items-center justify-start gap-1 rounded-none px-1 py-1.5 font-normal text-muted-foreground text-xs hover:text-foreground"
						>
							{outputsCollapsed ? (
								<ChevronRightIcon className="size-3" />
							) : (
								<ChevronDownIcon className="size-3" />
							)}
							<span>
								{outputsCollapsed
									? `Output (${cell.outputs.length} hidden)`
									: "Output"}
							</span>
						</button>
						{!outputsCollapsed && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										className="mr-2 size-4 text-muted-foreground text-xs hover:text-foreground"
										onClick={(e) => {
											e.stopPropagation();
											onClearOutput(index);
										}}
										aria-label="Clear output"
									>
										<EraserIcon className="size-3.5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Clear output</TooltipContent>
							</Tooltip>
						)}
					</div>
					{!outputsCollapsed && (
						<div className="flex flex-col gap-1">
							{cell.outputs.map((output, outputIndex) => (
								<NotebookCellOutput
									key={`${output.output_type}-${outputIndex}`}
									output={output}
								/>
							))}
						</div>
					)}
				</div>
			)}
		</NotebookCell>
	);
};
