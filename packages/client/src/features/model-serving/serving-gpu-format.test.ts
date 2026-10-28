import { describe, expect, it } from "vitest";
import {
	describeGpuSharing,
	describeHistory,
	describeStep,
	describeWindow,
	describeWorkload,
	formatGpuValue,
	gpuHistoryRows,
	gpuMetricDomain,
	grafanaDashboardUrl,
} from "./serving-gpu-format";

describe("GPU values", () => {
	it("carry their units", () => {
		expect(formatGpuValue("utilization", 37.4)).toBe("37%");
		expect(formatGpuValue("power", 9.666)).toBe("9.7 W");
		expect(formatGpuValue("temperature", 40.2)).toBe("40 °C");
		expect(formatGpuValue("smClock", 2418)).toBe(
			`${(2418).toLocaleString()} MHz`,
		);
	});

	it("are drawn against axes that keep an idle GPU low", () => {
		expect(gpuMetricDomain("utilization", [[1, 2]])).toEqual([0, 100]);
		expect(gpuMetricDomain("power", [[1, 9.7]])).toEqual([0, 50]);
		const [low, high] = gpuMetricDomain("power", [[1, 100]]);
		expect(low).toBe(0);
		expect(high).toBeCloseTo(110);
		expect(gpuMetricDomain("temperature", [[1, 40]])).toEqual([20, 90]);
		expect(gpuMetricDomain("temperature", [[1, 91]])).toEqual([20, 96]);
		expect(gpuMetricDomain("smClock", [])).toEqual([0, 1]);
	});

	it("are summed up by their range", () => {
		const percent = (value: number) => formatGpuValue("utilization", value);
		expect(
			describeHistory(
				[
					[1, 37],
					[2, 88],
					[3, 2],
				],
				percent,
			),
		).toBe("2% to 88%");
		expect(
			describeHistory(
				[
					[1, 2.2],
					[2, 1.8],
				],
				percent,
			),
		).toBe("Steady at 2%");
		expect(describeHistory([], percent)).toBe("No history yet");
	});
});

describe("GPU history rows", () => {
	it("join every field and the memory by time, the newest first", () => {
		const rows = gpuHistoryRows(
			{
				utilization: [
					[60, 37],
					[120, 2],
				],
				power: [[120, 9.7]],
				temperature: [],
				smClock: [],
			},
			[[60, 4e10]],
		);

		expect(rows).toEqual([
			{
				time: 120,
				values: {
					utilization: 2,
					power: 9.7,
					temperature: null,
					smClock: null,
				},
				memory: null,
			},
			{
				time: 60,
				values: {
					utilization: 37,
					power: null,
					temperature: null,
					smClock: null,
				},
				memory: 4e10,
			},
		]);
	});
});

describe("GPU words", () => {
	it("name how a GPU is shared, and who uses it", () => {
		expect(describeGpuSharing("none")).toBe("Not shared");
		expect(describeGpuSharing("time-slicing")).toBe("Time-sliced");
		expect(describeGpuSharing("new-strategy")).toBe("New strategy");
		expect(
			describeWorkload({
				namespace: "semoss",
				pod: "olmo-2-1b-instruct-predictor-bfc8475f7-7x5nh",
				container: "kserve-container",
				servedModel: "olmo-2-1b-instruct",
			}),
		).toBe("olmo-2-1b-instruct");
		expect(
			describeWorkload({
				namespace: "research",
				pod: "trainer-0",
				container: "main",
				servedModel: null,
			}),
		).toBe("research/trainer-0");
	});

	it("name the window and its steps", () => {
		expect(describeWindow("1h")).toBe("the last hour");
		expect(describeWindow("3d")).toBe("the last 3d");
		expect(describeStep(60)).toBe("a point a minute");
		expect(describeStep(15)).toBe("a point every 15 seconds");
		expect(describeStep(1440)).toBe("a point every 24 minutes");
	});
});

describe("the Grafana link", () => {
	const path = "/d/Oxed_c6Wz/nvidia-dcgm-exporter-dashboard";

	it("opens Grafana's port on the host this page came from", () => {
		expect(
			grafanaDashboardUrl(
				{ url: null, port: 3000, path },
				"spark-cbde.local",
			),
		).toBe(`http://spark-cbde.local:3000${path}`);
	});

	it("never links anything but a web address", () => {
		expect(
			grafanaDashboardUrl(
				{ url: "javascript:alert(1)", port: 3000, path },
				"spark-cbde.local",
			),
		).toBe(`http://spark-cbde.local:3000${path}`);
	});

	it("opens the Grafana the server names", () => {
		expect(
			grafanaDashboardUrl(
				{ url: "https://grafana.example.org/", port: 3000, path },
				"spark-cbde.local",
			),
		).toBe(`https://grafana.example.org${path}`);
	});
});
