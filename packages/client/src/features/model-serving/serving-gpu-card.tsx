import { ChevronDown, ExternalLink, Table2, TriangleAlert } from "lucide-react";
import { type ReactElement, useId, useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	H3,
	Muted,
	P,
	Skeleton,
} from "@semoss/ui/next";
import { capitalize } from "@semoss/utility/text";
import {
	SERVING_GPU_METRICS,
	type ServingGpu,
	type ServingGpuStatus,
	type ServingNodeMemory,
} from "@/api/model-serving";
import {
	describeStep,
	describeWindow,
	grafanaDashboardUrl,
} from "./serving-gpu-format";
import { ServingGpuHistoryTable } from "./serving-gpu-history-table";
import { ServingGpuPanel } from "./serving-gpu-panel";
import { useServingGpuStatus } from "./use-serving-gpu-status";

/** GetServingGpuStatus's history has this many steps */
const HISTORY_STEPS = 60;

/** A GPU and the memory shown with it */
interface GpuWithMemory {
	gpu: ServingGpu;
	title: string;
	memory: ServingNodeMemory | null;
}

/** The sparklines' time axis: the window, ending on the step boundary before the read. */
function timeDomainOf(status: ServingGpuStatus): readonly [number, number] {
	const read = status.readAt ? Date.parse(status.readAt) / 1000 : Number.NaN;
	const seconds = Number.isFinite(read) ? read : Date.now() / 1000;
	const step = status.stepSeconds > 0 ? status.stepSeconds : 60;
	const end = Math.floor(seconds / step) * step;
	return [end - step * HISTORY_STEPS, end];
}

/** Each GPU with its node's memory, shown once, with the node's first GPU. */
function withMemory(status: ServingGpuStatus): GpuWithMemory[] {
	const memoryOf = new Map(status.nodes.map((node) => [node.node, node]));
	const shown = new Set<string>();
	return status.gpus.map((gpu) => {
		const node = gpu.node ?? "";
		const memory = shown.has(node) ? null : (memoryOf.get(node) ?? null);
		shown.add(node);
		const product = gpu.product ?? "GPU";
		return {
			gpu,
			title:
				status.gpus.length > 1 && gpu.index !== null
					? `${product} (GPU ${gpu.index})`
					: product,
			memory,
		};
	});
}

/**
 * What the GPUs are doing, from the GPU Operator's DCGM exporter through
 * Prometheus: each GPU's live values with a sparkline of the last hour, the
 * pods using it, and its node's memory, with the points as a table and a link
 * to NVIDIA's dashboard in Grafana. Read every 15 seconds while shown.
 */
export function ServingGpuCard(): ReactElement | null {
	const titleId = useId();
	const { status, error, isLoading, updatedAt } = useServingGpuStatus();
	const [isTableOpen, setIsTableOpen] = useState(false);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-2">
				<output className="sr-only">Loading the GPU status...</output>
				<Skeleton className="h-56 w-full rounded-lg" />
			</div>
		);
	}
	if (!status) {
		return error ? (
			<P className="flex items-start gap-2 text-muted-foreground text-sm">
				<TriangleAlert
					className="mt-0.5 size-4 shrink-0 text-warning"
					aria-hidden
				/>
				<span>The GPU status could not be read: {error}</span>
			</P>
		) : null;
	}

	const hasMetrics = status.metrics === "prometheus";
	const windowLabel = describeWindow(status.window);
	const timeDomain = timeDomainOf(status);
	const gpus = withMemory(status);
	const hasHistory = gpus.some(
		({ gpu, memory }) =>
			SERVING_GPU_METRICS.some(
				(metric) => gpu.history[metric].length > 0,
			) ||
			(memory !== null && memory.history.length > 0),
	);
	const grafanaUrl = status.grafana
		? grafanaDashboardUrl(status.grafana, window.location.hostname)
		: null;

	return (
		<section
			aria-labelledby={titleId}
			className="flex min-w-0 flex-col gap-4 rounded-lg border p-4"
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<H3 id={titleId} className="font-medium text-sm">
					GPU status
				</H3>
				{grafanaUrl ? (
					<Button asChild variant="outline" size="sm">
						<a href={grafanaUrl} target="_blank" rel="noreferrer">
							Open in Grafana
							<span className="sr-only">
								{" "}
								(opens in a new tab)
							</span>
							<ExternalLink className="size-4" aria-hidden />
						</a>
					</Button>
				) : null}
			</div>

			{gpus.length === 0 ? (
				<Muted className="text-sm">No GPU to show.</Muted>
			) : (
				gpus.map(({ gpu, title, memory }) => (
					<ServingGpuPanel
						key={`${gpu.node ?? ""}/${gpu.uuid ?? gpu.index ?? ""}`}
						gpu={gpu}
						title={title}
						memory={memory}
						hasMetrics={hasMetrics}
						timeDomain={timeDomain}
						stepSeconds={status.stepSeconds}
						windowLabel={windowLabel}
					/>
				))
			)}

			{[
				...status.warnings,
				...(error ? [`It could not be read again: ${error}`] : []),
			].map((warning) => (
				<P
					key={warning}
					className="flex items-start gap-2 text-muted-foreground text-sm"
				>
					<TriangleAlert
						className="mt-0.5 size-4 shrink-0 text-warning"
						aria-hidden
					/>
					<span className="min-w-0 break-words">{warning}</span>
				</P>
			))}

			{hasHistory ? (
				<Collapsible open={isTableOpen} onOpenChange={setIsTableOpen}>
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="-ml-2 text-muted-foreground"
						>
							<Table2 className="size-4" aria-hidden />
							Table View
							<ChevronDown
								aria-hidden
								className={cn(
									"size-4 transition-transform",
									isTableOpen && "rotate-180",
								)}
							/>
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="flex flex-col gap-4 pt-2">
						{gpus.map(({ gpu, title, memory }) => (
							<ServingGpuHistoryTable
								key={`${gpu.node ?? ""}/${gpu.uuid ?? gpu.index ?? ""}`}
								caption={`${title} over ${windowLabel}`}
								history={gpu.history}
								memory={memory?.history ?? []}
							/>
						))}
					</CollapsibleContent>
				</Collapsible>
			) : null}

			<Muted className="break-words text-xs">
				{hasMetrics
					? [
							`${capitalize(windowLabel)}, ${describeStep(status.stepSeconds)}`,
							status.source,
							updatedAt
								? `Updated ${updatedAt.toLocaleTimeString()}`
								: null,
						]
							.filter(Boolean)
							.join(" · ")
					: status.metrics === "off"
						? "Live GPU metrics are turned off (KSERVE_PROMETHEUS_URL=off)."
						: "No live GPU metrics."}
			</Muted>
		</section>
	);
}
