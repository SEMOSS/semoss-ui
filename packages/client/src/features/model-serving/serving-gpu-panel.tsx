import { Cpu } from "lucide-react";
import type { ReactElement } from "react";
import { Muted, P, Progress } from "@semoss/ui/next";
import { capitalize } from "@semoss/utility/text";
import {
	SERVING_GPU_METRICS,
	type ServingGpu,
	type ServingNodeMemory,
} from "@/api/model-serving";
import { GpuStatTile } from "./gpu-stat-tile";
import {
	describeGpuSharing,
	describeHistory,
	describeWorkload,
	formatGpuValue,
	formatMemory,
	GPU_METRIC_LABELS,
	gpuMetricDomain,
} from "./serving-gpu-format";
import { Sparkline } from "./sparkline";

export interface ServingGpuPanelProps {
	gpu: ServingGpu;
	/** The panel's title, such as the GPU's product */
	title: string;
	/** Its node's memory; null when not known, or shown with another GPU of the node */
	memory: ServingNodeMemory | null;
	/** Whether Prometheus was read, so the GPU's use is known */
	hasMetrics: boolean;
	/** The sparklines' time axis, in seconds since the epoch */
	timeDomain: readonly [number, number];
	/** Seconds between history points */
	stepSeconds: number;
	/** The window of the history, such as "the last hour" */
	windowLabel: string;
}

/**
 * One GPU: what it is, which pods use it, its live values with their history,
 * and the memory of its node, which a GB10 shares with the CPU.
 */
export function ServingGpuPanel({
	gpu,
	title,
	memory,
	hasMetrics,
	timeDomain,
	stepSeconds,
	windowLabel,
}: ServingGpuPanelProps): ReactElement {
	const facts = [
		gpu.node,
		gpu.family ? capitalize(gpu.family) : null,
		gpu.driver ? `Driver ${gpu.driver}` : null,
		gpu.cuda ? `CUDA ${gpu.cuda}` : null,
		gpu.sharing ? describeGpuSharing(gpu.sharing) : null,
	].filter((fact): fact is string => Boolean(fact));
	const hasReadings = SERVING_GPU_METRICS.some(
		(metric) => gpu.now[metric] !== null || gpu.history[metric].length > 0,
	);

	return (
		<div className="flex min-w-0 flex-col gap-4">
			<div className="flex min-w-0 flex-col gap-1">
				<div className="flex items-center gap-2">
					<Cpu className="size-4 text-muted-foreground" aria-hidden />
					<span className="font-medium text-sm">{title}</span>
				</div>
				{facts.length > 0 ? (
					<Muted className="break-words text-xs">
						{facts.join(" · ")}
					</Muted>
				) : null}
				{hasMetrics ? (
					<P className="break-words text-sm">
						{gpu.usedBy.length > 0
							? `Used by ${gpu.usedBy.map(describeWorkload).join(", ")}`
							: "No pod is using it"}
					</P>
				) : null}
			</div>
			{hasReadings ? (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{SERVING_GPU_METRICS.map((metric) => {
						const format = (value: number): string =>
							formatGpuValue(metric, value);
						const now = gpu.now[metric];
						const points = gpu.history[metric];
						return (
							<GpuStatTile
								key={metric}
								label={GPU_METRIC_LABELS[metric]}
								value={now === null ? null : format(now)}
							>
								<Sparkline
									label={`${GPU_METRIC_LABELS[metric]} over ${windowLabel}`}
									points={points}
									domain={gpuMetricDomain(metric, points)}
									timeDomain={timeDomain}
									stepSeconds={stepSeconds}
									format={format}
									caption={describeHistory(points, format)}
								/>
							</GpuStatTile>
						);
					})}
				</div>
			) : null}
			{memory ? (
				<GpuStatTile
					label={`Memory in use on ${memory.node}`}
					value={`${formatMemory(memory.used)} of ${formatMemory(memory.total)}`}
				>
					<Progress
						value={
							memory.total > 0
								? Math.min(
										100,
										(memory.used / memory.total) * 100,
									)
								: 0
						}
						aria-label={`Memory in use on ${memory.node}`}
						aria-valuetext={`${formatMemory(memory.used)} of ${formatMemory(memory.total)}`}
						className="h-1.5"
					/>
					<Sparkline
						label={`Memory in use on ${memory.node} over ${windowLabel}`}
						points={memory.history}
						domain={[0, memory.total]}
						timeDomain={timeDomain}
						stepSeconds={stepSeconds}
						format={formatMemory}
						caption={describeHistory(memory.history, formatMemory)}
					/>
				</GpuStatTile>
			) : null}
		</div>
	);
}
