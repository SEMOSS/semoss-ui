import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServingGpuCard } from "./serving-gpu-card";

const mocks = vi.hoisted(() => ({ runPixel: vi.fn() }));
vi.mock("@semoss/sdk/react", () => ({ runPixel: mocks.runPixel }));

/** A pixel's answer, as runPixel resolves it */
function answer(output: unknown, operationType = ["OPERATION"]) {
	return {
		errors: [],
		insightId: "insight-1",
		pixelReturn: [
			{
				isMeta: false,
				operationType,
				output,
				pixelExpression: "",
				pixelId: "1",
				timeToRun: 1,
			},
		],
	};
}

/** The last step before the read, 2026-10-26 23:59 UTC */
const END = 1_793_059_140;

/** No history, as a GPU without DCGM has */
const NO_HISTORY = { utilization: [], power: [], temperature: [], smClock: [] };

/**
 * GetServingGpuStatus with the sample READY on the GB10: DCGM's recorded 2 %,
 * 9.67 W and 40 °C, no SM clock reading, and the box's recorded memory
 */
const STATUS = {
	metrics: "prometheus",
	source: "Prometheus monitoring/monitoring-kube-prometheus-prometheus:9090 through the Kubernetes API",
	readAt: "2026-10-26T23:59:41Z",
	window: "1h",
	stepSeconds: 60,
	gpus: [
		{
			node: "spark-cbde",
			index: "0",
			uuid: "GPU-72ec881d-d090-aa20-9c5d-4edbe21369c0",
			product: "NVIDIA GB10",
			driver: "580.178.04",
			cuda: "13.0",
			family: "blackwell",
			sharing: "none",
			utilization: 2,
			power: 9.67,
			temperature: 40,
			smClock: null,
			usedBy: [
				{
					namespace: "semoss",
					pod: "olmo-2-1b-instruct-predictor-bfc8475f7-7x5nh",
					container: "kserve-container",
					servedModel: "olmo-2-1b-instruct",
				},
			],
			history: {
				utilization: [
					[END - 120, 37],
					[END - 60, 88],
					[END, 2],
				],
				power: [
					[END - 60, 61.2],
					[END, 9.67],
				],
				temperature: [[END, 40]],
				smClock: [],
			},
		},
	],
	nodes: [
		{
			node: "spark-cbde",
			memoryTotal: 130_661_203_968,
			memoryAvailable: 86_777_569_280,
			memoryUsed: 43_883_634_688,
			history: { memoryUsed: [[END, 43_883_634_688]] },
		},
	],
	grafana: {
		url: null,
		port: 3000,
		path: "/d/Oxed_c6Wz/nvidia-dcgm-exporter-dashboard",
	},
	warnings: [],
};

afterEach(() => {
	cleanup();
	mocks.runPixel.mockReset();
	vi.useRealTimers();
});

describe("GPU status card", () => {
	it("shows the GPU, who uses it, its live values and the box's memory", async () => {
		mocks.runPixel.mockResolvedValue(answer(STATUS));
		render(<ServingGpuCard />);

		expect(await screen.findByText("NVIDIA GB10")).toBeInTheDocument();
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'GetServingGpuStatus(window=["1h"]);',
		);
		expect(
			screen.getByRole("heading", { name: "GPU status" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"spark-cbde · Blackwell · Driver 580.178.04 · CUDA 13.0 · Not shared",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText("Used by olmo-2-1b-instruct"),
		).toBeInTheDocument();
		expect(screen.getByText("2%")).toBeInTheDocument();
		expect(screen.getByText("9.7 W")).toBeInTheDocument();
		expect(screen.getByText("40 °C")).toBeInTheDocument();
		expect(screen.getByText("No reading")).toBeInTheDocument();
		expect(screen.getByText("2% to 88%")).toBeInTheDocument();
		expect(screen.getByText("Steady at 40 °C")).toBeInTheDocument();
		expect(
			screen.getByRole("img", { name: "Utilization over the last hour" }),
		).toBeInTheDocument();
		expect(screen.getByText("40.9 GB of 121.7 GB")).toBeInTheDocument();
		expect(
			screen.getByRole("progressbar", {
				name: "Memory in use on spark-cbde",
			}),
		).toHaveAttribute("aria-valuetext", "40.9 GB of 121.7 GB");

		const grafana = screen.getByRole("link", { name: /Open in Grafana/ });
		expect(grafana).toHaveAttribute(
			"href",
			"http://localhost:3000/d/Oxed_c6Wz/nvidia-dcgm-exporter-dashboard",
		);
		expect(grafana).toHaveAttribute("target", "_blank");
		expect(
			screen.getByText(
				/^The last hour, a point a minute · Prometheus monitoring\/monitoring-kube-prometheus-prometheus:9090 through the Kubernetes API · Updated /,
			),
		).toBeInTheDocument();
	});

	it("lists every point of the sparklines in its table view", async () => {
		mocks.runPixel.mockResolvedValue(answer(STATUS));
		render(<ServingGpuCard />);

		fireEvent.click(
			await screen.findByRole("button", { name: /Table View/ }),
		);

		const table = screen.getByRole("table", {
			name: "NVIDIA GB10 over the last hour",
		});
		const rows = within(table).getAllByRole("row");
		expect(rows).toHaveLength(4);
		expect(
			within(rows[0])
				.getAllByRole("columnheader")
				.map((cell) => cell.textContent),
		).toEqual([
			"Time",
			"Utilization",
			"Power",
			"Temperature",
			"SM clock",
			"Memory in use",
		]);
		// the newest first; a field with no reading at that time says so
		expect(within(rows[1]).getByText("40 °C")).toBeInTheDocument();
		expect(within(rows[1]).getByText("40.9 GB")).toBeInTheDocument();
		expect(within(rows[2]).getByText("88%")).toBeInTheDocument();
		expect(within(rows[2]).getAllByText("No reading")).toHaveLength(3);
	});

	it("reads out the point under the pointer", async () => {
		mocks.runPixel.mockResolvedValue(answer(STATUS));
		render(<ServingGpuCard />);

		const chart = await screen.findByRole("img", {
			name: "Utilization over the last hour",
		});
		vi.spyOn(chart, "getBoundingClientRect").mockReturnValue(
			DOMRect.fromRect({ x: 0, y: 0, width: 600, height: 32 }),
		);
		// 59/60 of the way along: the minute before the last. jsdom has no
		// PointerEvent, so a MouseEvent of that type carries the position
		fireEvent(
			chart,
			new MouseEvent("pointermove", { bubbles: true, clientX: 590 }),
		);
		expect(screen.getByText(/^88% at /)).toBeInTheDocument();

		fireEvent.pointerLeave(chart);
		expect(screen.getByText("2% to 88%")).toBeInTheDocument();
	});

	it("still names the GPU, and says why, when the metrics cannot be read", async () => {
		mocks.runPixel.mockResolvedValue(
			answer({
				...STATUS,
				metrics: "unavailable",
				source: null,
				gpus: [
					{
						...STATUS.gpus[0],
						uuid: null,
						product: "NVIDIA-GB10",
						driver: "580.178.04",
						utilization: null,
						power: null,
						temperature: null,
						usedBy: [],
						history: NO_HISTORY,
					},
				],
				nodes: [],
				warnings: [
					"The GPU metrics could not be read. There is no Prometheus at monitoring/monitoring-kube-prometheus-prometheus:9090 (HTTP 404). Apply dgx/monitoring.yml, or set KSERVE_PROMETHEUS_URL to where it is",
				],
			}),
		);
		render(<ServingGpuCard />);

		expect(await screen.findByText("NVIDIA-GB10")).toBeInTheDocument();
		expect(
			screen.getByText(/There is no Prometheus at/),
		).toBeInTheDocument();
		expect(screen.getByText("No live GPU metrics.")).toBeInTheDocument();
		expect(screen.queryByText("Utilization")).not.toBeInTheDocument();
		expect(
			screen.queryByText(/Used by|No pod is using it/),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /Table View/ }),
		).not.toBeInTheDocument();
	});

	it("says so when the metrics are turned off", async () => {
		mocks.runPixel.mockResolvedValue(
			answer({
				...STATUS,
				metrics: "off",
				source: null,
				gpus: [{ ...STATUS.gpus[0], history: NO_HISTORY, usedBy: [] }],
				grafana: null,
			}),
		);
		render(<ServingGpuCard />);

		expect(
			await screen.findByText(
				"Live GPU metrics are turned off (KSERVE_PROMETHEUS_URL=off).",
			),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("link", { name: /Open in Grafana/ }),
		).not.toBeInTheDocument();
	});

	it("says why when the status cannot be read at all", async () => {
		mocks.runPixel.mockResolvedValue(
			answer("Could not find reactor GetServingGpuStatus", ["ERROR"]),
		);
		render(<ServingGpuCard />);

		expect(
			await screen.findByText(
				"The GPU status could not be read: Could not find reactor GetServingGpuStatus",
			),
		).toBeInTheDocument();
	});

	it("reads again every 15 seconds, keeping the last answer when a read fails", async () => {
		vi.useFakeTimers();
		mocks.runPixel.mockResolvedValue(answer(STATUS));
		render(<ServingGpuCard />);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(mocks.runPixel).toHaveBeenCalledTimes(1);

		mocks.runPixel.mockResolvedValue(
			answer("Prometheus is busy", ["ERROR"]),
		);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(15_000);
		});

		expect(mocks.runPixel).toHaveBeenCalledTimes(2);
		expect(screen.getByText("NVIDIA GB10")).toBeInTheDocument();
		expect(
			screen.getByText("It could not be read again: Prometheus is busy"),
		).toBeInTheDocument();
	});
});
