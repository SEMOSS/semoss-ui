import { type ReactElement, useId } from "react";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import {
	SERVING_GPU_METRICS,
	type ServingGpuMetric,
	type ServingGpuPoint,
} from "@/api/model-serving";
import {
	formatGpuValue,
	formatMemory,
	formatPointTime,
	GPU_METRIC_LABELS,
	gpuHistoryRows,
} from "./serving-gpu-format";

/** A cell with no reading: a dash to the eye, words to a screen reader */
const NO_READING = (
	<>
		<span aria-hidden>–</span>
		<span className="sr-only">No reading</span>
	</>
);

export interface ServingGpuHistoryTableProps {
	/** What the table holds, such as "NVIDIA GB10 over the last hour" */
	caption: string;
	/** The GPU's history by field */
	history: Record<ServingGpuMetric, readonly ServingGpuPoint[]>;
	/** Its node's memory in use; empty when not known */
	memory: readonly ServingGpuPoint[];
}

/**
 * Every point behind a GPU's sparklines, the newest first: the table view of
 * the charts, in a region of its own that scrolls.
 */
export function ServingGpuHistoryTable({
	caption,
	history,
	memory,
}: ServingGpuHistoryTableProps): ReactElement {
	const captionId = useId();
	const rows = gpuHistoryRows(history, memory);
	const hasMemory = memory.length > 0;
	return (
		<section
			aria-labelledby={captionId}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: the region scrolls, so keyboard users must be able to reach it
			tabIndex={0}
			className="max-h-72 overflow-auto rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
		>
			<Table>
				<TableCaption id={captionId} className="sr-only">
					{caption}
				</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>Time</TableHead>
						{SERVING_GPU_METRICS.map((metric) => (
							<TableHead key={metric} className="text-right">
								{GPU_METRIC_LABELS[metric]}
							</TableHead>
						))}
						{hasMemory ? (
							<TableHead className="text-right">
								Memory in use
							</TableHead>
						) : null}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={row.time}>
							<TableCell className="tabular-nums">
								{formatPointTime(row.time)}
							</TableCell>
							{SERVING_GPU_METRICS.map((metric) => {
								const value = row.values[metric];
								return (
									<TableCell
										key={metric}
										className="text-right tabular-nums"
									>
										{value === null
											? NO_READING
											: formatGpuValue(metric, value)}
									</TableCell>
								);
							})}
							{hasMemory ? (
								<TableCell className="text-right tabular-nums">
									{row.memory === null
										? NO_READING
										: formatMemory(row.memory)}
								</TableCell>
							) : null}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</section>
	);
}
