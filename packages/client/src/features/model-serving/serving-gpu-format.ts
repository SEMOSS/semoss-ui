import { formatByteSize } from "@semoss/utility";
import { capitalize } from "@semoss/utility/text";
import {
	SERVING_GPU_METRICS,
	type ServingGpuMetric,
	type ServingGpuPoint,
	type ServingGpuWorkload,
	type ServingGrafanaLink,
} from "@/api/model-serving";

/** The words for each GPU field */
export const GPU_METRIC_LABELS: Record<ServingGpuMetric, string> = {
	utilization: "Utilization",
	power: "Power",
	temperature: "Temperature",
	smClock: "SM clock",
};

/** The words for how pods share a GPU (GPU feature discovery's sharing strategy) */
const GPU_SHARING_LABELS: Record<string, string> = {
	none: "Not shared",
	"time-slicing": "Time-sliced",
	mps: "Shared with MPS",
};

/** A GPU field's value with its unit: 37%, 9.7 W, 40 °C, 2,418 MHz. */
export function formatGpuValue(
	metric: ServingGpuMetric,
	value: number,
): string {
	switch (metric) {
		case "utilization":
			return `${Math.round(value)}%`;
		case "power":
			return `${value.toFixed(1)} W`;
		case "temperature":
			return `${Math.round(value)} °C`;
		case "smClock":
			return `${Math.round(value).toLocaleString()} MHz`;
	}
}

/** A memory size, as the rest of Model Serving shows sizes. */
export const formatMemory = (bytes: number): string => formatByteSize(bytes);

/**
 * The value axis of a GPU field's sparkline. Amounts start at zero, so an idle
 * GPU's line sits low instead of filling the plot: utilization out of 100%,
 * power out of at least 50 W. Temperature spans at least 20–90 °C.
 */
export function gpuMetricDomain(
	metric: ServingGpuMetric,
	points: readonly ServingGpuPoint[],
): readonly [number, number] {
	const highest = points.reduce(
		(high, [, value]) => Math.max(high, value),
		Number.NEGATIVE_INFINITY,
	);
	switch (metric) {
		case "utilization":
			return [0, 100];
		case "power":
			return [0, Math.max(50, highest * 1.1)];
		case "temperature":
			return [20, Math.max(90, highest + 5)];
		case "smClock":
			return [0, Math.max(1, highest * 1.1)];
	}
}

/** The lowest and highest value of a history, or null when it is empty. */
export function historyRange(
	points: readonly ServingGpuPoint[],
): readonly [number, number] | null {
	if (points.length === 0) {
		return null;
	}
	let low = Number.POSITIVE_INFINITY;
	let high = Number.NEGATIVE_INFINITY;
	for (const [, value] of points) {
		low = Math.min(low, value);
		high = Math.max(high, value);
	}
	return [low, high];
}

/** "37% to 88%", "Steady at 2%", or that there is no history yet. */
export function describeHistory(
	points: readonly ServingGpuPoint[],
	format: (value: number) => string,
): string {
	const range = historyRange(points);
	if (!range) {
		return "No history yet";
	}
	const [low, high] = range;
	return format(low) === format(high)
		? `Steady at ${format(low)}`
		: `${format(low)} to ${format(high)}`;
}

/** One time of a GPU's history table, with every field read at it */
export interface GpuHistoryRow {
	time: number;
	values: Record<ServingGpuMetric, number | null>;
	/** The node's memory in use */
	memory: number | null;
}

/** A GPU's history and its node's memory as rows, the newest first. */
export function gpuHistoryRows(
	history: Record<ServingGpuMetric, readonly ServingGpuPoint[]>,
	memory: readonly ServingGpuPoint[],
): GpuHistoryRow[] {
	const rows = new Map<number, GpuHistoryRow>();
	const rowAt = (time: number): GpuHistoryRow => {
		let row = rows.get(time);
		if (!row) {
			row = {
				time,
				values: {
					utilization: null,
					power: null,
					temperature: null,
					smClock: null,
				},
				memory: null,
			};
			rows.set(time, row);
		}
		return row;
	};
	for (const metric of SERVING_GPU_METRICS) {
		for (const [time, value] of history[metric]) {
			rowAt(time).values[metric] = value;
		}
	}
	for (const [time, value] of memory) {
		rowAt(time).memory = value;
	}
	return [...rows.values()].sort((a, b) => b.time - a.time);
}

/** "Not shared", "Time-sliced"; a strategy this client does not know in words. */
export function describeGpuSharing(sharing: string): string {
	return (
		GPU_SHARING_LABELS[sharing] ?? capitalize(sharing.replace(/-/g, " "))
	);
}

/** A served model by name; any other pod by its namespace and name. */
export function describeWorkload(workload: ServingGpuWorkload): string {
	if (workload.servedModel) {
		return workload.servedModel;
	}
	return workload.namespace
		? `${workload.namespace}/${workload.pod}`
		: workload.pod;
}

/** Only web addresses become links */
const WEB_URL = /^https?:\/\//i;

/**
 * The dashboard's address: under the Grafana the server names, else on the
 * Grafana port of the host this page came from, which k3s's ServiceLB
 * publishes on every node address.
 */
export function grafanaDashboardUrl(
	link: ServingGrafanaLink,
	hostname: string,
): string {
	const base =
		link.url && WEB_URL.test(link.url)
			? link.url
			: `http://${hostname}:${link.port}`;
	return `${base.replace(/\/+$/, "")}${link.path}`;
}

/** The words for each window GetServingGpuStatus reads */
const WINDOW_LABELS: Record<string, string> = {
	"15m": "the last 15 minutes",
	"1h": "the last hour",
	"6h": "the last 6 hours",
	"24h": "the last 24 hours",
};

/** "the last hour"; a window this client does not know as it is named. */
export const describeWindow = (window: string): string =>
	WINDOW_LABELS[window] ?? `the last ${window}`;

/** "a point a minute", "a point every 15 seconds" */
export function describeStep(seconds: number): string {
	if (seconds === 60) {
		return "a point a minute";
	}
	return seconds % 60 === 0
		? `a point every ${seconds / 60} minutes`
		: `a point every ${seconds} seconds`;
}

/** A history point's time of day, such as 14:05. */
export const formatPointTime = (seconds: number): string =>
	new Date(seconds * 1000).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
