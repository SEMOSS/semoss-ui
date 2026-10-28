import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildCreateServedModelEnginePixel,
	buildDefineServedModelPixel,
	buildLinkServedModelEnginePixel,
	buildServedModelLogsPixel,
	buildServingGpuStatusPixel,
	buildStartServedModelPixel,
	buildUnlinkServedModelEnginePixel,
	defineServedModel,
	getServingGpuStatus,
	linkServedModelEngine,
	parseServedModelDetail,
	parseServedModelEngineList,
	parseServedModelList,
	parseServingCapacity,
	parseServingCatalog,
	parseServingGpuStatus,
	startServedModel,
} from "./model-serving";

const mocks = vi.hoisted(() => ({ runPixel: vi.fn() }));
vi.mock("@semoss/sdk/react", () => ({ runPixel: mocks.runPixel }));

/** A pixel's answer, as runPixel resolves it */
function answer(
	output: unknown,
	operationType = ["OPERATION"],
	additionalOutput?: unknown,
) {
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
				additionalOutput,
			},
		],
	};
}

/** A ready model as ListServedModels reports it */
const READY = {
	servedModel: "olmo-2-1b-instruct",
	namespace: "semoss",
	managed: false,
	displayName: null,
	catalogEntry: null,
	state: "READY",
	phase: null,
	message: "Serving requests",
	progress: 1,
	etaSeconds: null,
	etaBasis: null,
	phaseSince: "2026-10-27T09:00:00Z",
	startRequestedAt: "2026-10-27T08:58:00Z",
	lastAction: {
		action: "start",
		user: "ada",
		userName: "Ada Admin",
		at: "2026-10-27T08:58:00Z",
		instance: "host",
	},
	storageUri: "hf://allenai/OLMo-2-0425-1B-Instruct",
	runtime: "nvidia-vllm",
	gpuMemoryUtilization: 0.2,
	inClusterUrl: "http://olmo-2-1b-instruct-predictor.semoss.svc/v1",
	endpoint: "http://localhost:8000/v1",
	endpointNote: null,
	hostPort: 8000,
	pod: "olmo-2-1b-instruct-predictor-abc",
	restarts: 0,
	failure: null,
	warnings: [],
	observedAt: "2026-10-27T10:00:00Z",
};

beforeEach(() => {
	mocks.runPixel.mockReset();
});

describe("serving pixels", () => {
	it("quote names so they cannot end the argument or carry markup", () => {
		expect(buildStartServedModelPixel('odd"name<encode>', false)).toBe(
			'StartServedModel(servedModel=["odd\\"name\\u003cencode>"]);',
		);
		expect(buildStartServedModelPixel("olmo-2-1b", true)).toBe(
			'StartServedModel(servedModel=["olmo-2-1b"], replace=[true]);',
		);
	});

	it("define only what differs from the reactor's defaults", () => {
		expect(
			buildDefineServedModelPixel({
				servedModel: "olmo-2-1b",
				catalogEntry: "allenai/OLMo-2-0425-1B-Instruct",
				start: false,
				createEngine: false,
				engineGlobal: false,
				publish: false,
			}),
		).toBe(
			'DefineServedModel(servedModel=["olmo-2-1b"], catalogEntry=["allenai/OLMo-2-0425-1B-Instruct"]);',
		);
		expect(
			buildDefineServedModelPixel({
				servedModel: "olmo-2-1b",
				catalogEntry: "allenai/OLMo-2-0425-1B-Instruct",
				gpuMemoryUtilization: 0.25,
				maxModelLen: 2048,
				start: true,
				createEngine: true,
				engineName: "OLMo 1B",
				engineGlobal: true,
				publish: true,
				publishPort: 8001,
			}),
		).toBe(
			'DefineServedModel(servedModel=["olmo-2-1b"], catalogEntry=["allenai/OLMo-2-0425-1B-Instruct"], ' +
				'overrides=[{"gpuMemoryUtilization":0.25,"maxModelLen":2048}], start=[true], createEngine=[true], ' +
				'engineName=["OLMo 1B"], engineGlobal=[true], publish=[true], publishPort=[8001]);',
		);
	});

	it("leave out an engine's options when no engine is made", () => {
		expect(
			buildDefineServedModelPixel({
				servedModel: "olmo-2-1b",
				catalogEntry: "allenai/OLMo-2-0425-1B-Instruct",
				start: false,
				createEngine: false,
				engineName: "ignored",
				engineGlobal: true,
				publish: false,
				publishPort: 8001,
			}),
		).not.toMatch(/engineName|engineGlobal|publishPort/);
	});

	it("ask for logs and engines with their options", () => {
		expect(
			buildServedModelLogsPixel("olmo-2-1b", {
				container: "storage-initializer",
				tailLines: 500,
				previous: true,
				includeAccessLogs: false,
			}),
		).toBe(
			'GetServedModelLogs(servedModel=["olmo-2-1b"], container=["storage-initializer"], tailLines=[500], previous=[true]);',
		);
		expect(
			buildCreateServedModelEnginePixel("olmo-2-1b", undefined, false),
		).toBe('CreateServedModelEngine(servedModel=["olmo-2-1b"]);');
	});
});

describe("serving payloads", () => {
	it("read a list, keeping a state this client does not know", () => {
		const list = parseServedModelList({
			namespace: "semoss",
			servedModels: [
				READY,
				{ ...READY, servedModel: "next", state: "HIBERNATING" },
			],
		});

		expect(list.namespace).toBe("semoss");
		expect(list.servedModels[0]).toMatchObject({
			servedModel: "olmo-2-1b-instruct",
			state: "READY",
			managed: false,
			hostPort: 8000,
			lastAction: { action: "start", userName: "Ada Admin" },
		});
		expect(list.servedModels[1].state).toBe("HIBERNATING");
	});

	it("refuse a list without its models or a model without its name", () => {
		expect(() => parseServedModelList({ namespace: "semoss" })).toThrow(
			"The server did not return the served models.",
		);
		expect(() =>
			parseServedModelList({ servedModels: [{ state: "READY" }] }),
		).toThrow("The server returned a served model without a name.");
	});

	it("read a detail's timeline, events and failure", () => {
		const detail = parseServedModelDetail({
			...READY,
			state: "FAILED",
			failure: {
				cause: "DOWNLOAD_FAILED",
				container: "storage-initializer",
				reason: "Error",
				exitCode: 1,
				restarts: 2,
				message: "Repository not found",
				hint: "Check the catalog entry's storageUri",
				logTail: ["line 1", 2, "line 3"],
			},
			vllm: { architecture: "Olmo2ForCausalLM", maxModelLen: 4096 },
			phases: [
				{
					phase: "DOWNLOADING_WEIGHTS",
					startedAt: "2026-10-27T09:00:00Z",
					seconds: 40,
				},
				{ startedAt: "no phase, so left out" },
			],
			events: [{ type: "Warning", reason: "BackOff", count: 3 }],
		});

		expect(detail.failure).toMatchObject({
			cause: "DOWNLOAD_FAILED",
			restarts: 2,
			logTail: ["line 1", "line 3"],
		});
		expect(detail.vllm).toEqual({
			architecture: "Olmo2ForCausalLM",
			maxModelLen: 4096,
			weightsGiB: null,
			kvCacheGiB: null,
		});
		expect(detail.phases).toEqual([
			{
				phase: "DOWNLOADING_WEIGHTS",
				startedAt: "2026-10-27T09:00:00Z",
				endedAt: null,
				seconds: 40,
			},
		]);
		expect(detail.events[0]).toMatchObject({ reason: "BackOff", count: 3 });
		expect(detail.conditions).toEqual([]);
	});

	it("read what a replace would stop, and leave it unknown from an older backend", () => {
		const capacity = parseServingCapacity({
			namespace: "semoss",
			gpus: { offered: 1, held: 1, free: 0, nodes: [], holders: [] },
			memory: { budget: 0.7, used: 0.2, free: 0.5, models: [] },
			models: [
				{
					servedModel: "olmo-2-1b",
					state: "STOPPED",
					gpus: 1,
					canStart: false,
					reason: "The GPU is in use by olmo-2-1b-instruct.",
					blocking: ["olmo-2-1b-instruct"],
					canReplace: true,
				},
				{ servedModel: "older", state: "STOPPED", canStart: false },
			],
			warnings: [],
		});

		expect(capacity.models[0]).toMatchObject({
			canStart: false,
			blocking: ["olmo-2-1b-instruct"],
			canReplace: true,
		});
		expect(capacity.models[1]).toMatchObject({
			blocking: null,
			canReplace: null,
		});
		expect(capacity.gpus.offered).toBe(1);
	});

	it("read the catalog and the entries it left out", () => {
		const catalog = parseServingCatalog({
			source: "ConfigMap semoss/semoss-serving-catalog",
			models: [
				{
					id: "allenai/OLMo-2-0425-1B-Instruct",
					displayName: "OLMo 2 1B Instruct",
					contextWindow: 4096,
					licence: "apache-2.0",
				},
				{ displayName: "no id, so left out" },
			],
			problems: ["entry unapproved has no approvedBy"],
		});

		expect(catalog.models).toHaveLength(1);
		expect(catalog.models[0]).toMatchObject({
			id: "allenai/OLMo-2-0425-1B-Instruct",
			contextWindow: 4096,
			args: [],
		});
		expect(catalog.problems).toEqual([
			"entry unapproved has no approvedBy",
		]);
	});
});

describe("serving requests", () => {
	it("reject with the backend's reason when a pixel fails", async () => {
		mocks.runPixel.mockResolvedValue(
			answer("The GPU is in use by olmo-2-1b-instruct.", ["ERROR"]),
		);

		await expect(startServedModel("olmo-2-1b", false)).rejects.toThrow(
			"The GPU is in use by olmo-2-1b-instruct.",
		);
	});

	it("collect the warnings a reactor adds to its answer", async () => {
		mocks.runPixel.mockResolvedValue(
			answer(
				{ ...READY, state: "WAITING_FOR_GPU", changed: false },
				["OPERATION"],
				[
					{
						output: "olmo-2-1b is waiting for the GPU",
						operationType: ["WARNING"],
					},
					{ output: "not a warning", operationType: ["OPERATION"] },
				],
			),
		);

		const result = await startServedModel("olmo-2-1b", false);

		expect(result.changed).toBe(false);
		expect(result.warnings).toEqual(["olmo-2-1b is waiting for the GPU"]);
		expect(result.model.state).toBe("WAITING_FOR_GPU");
	});

	it("name the engine a definition created", async () => {
		mocks.runPixel.mockResolvedValue(
			answer({
				...READY,
				engine: {
					engine_id: "engine-1",
					engine_name: "OLMo 2 1B Instruct",
				},
			}),
		);

		const result = await defineServedModel({
			servedModel: "olmo-2-1b-instruct",
			catalogEntry: "allenai/OLMo-2-0425-1B-Instruct",
			start: false,
			createEngine: true,
			engineGlobal: false,
			publish: false,
		});

		expect(result.engine).toEqual({
			id: "engine-1",
			name: "OLMo 2 1B Instruct",
		});
		expect(mocks.runPixel).toHaveBeenCalledWith(
			'DefineServedModel(servedModel=["olmo-2-1b-instruct"], catalogEntry=["allenai/OLMo-2-0425-1B-Instruct"], createEngine=[true]);',
		);
	});
});

describe("engine links", () => {
	it("are sent with the engine's id quoted", () => {
		expect(
			buildLinkServedModelEnginePixel("olmo-2-1b-instruct", "hand-1"),
		).toBe(
			'LinkServedModelEngine(servedModel=["olmo-2-1b-instruct"], engine=["hand-1"]);',
		);
		expect(buildUnlinkServedModelEnginePixel('a"b')).toBe(
			'UnlinkServedModelEngine(engine=["a\\"b"]);',
		);
	});

	it("are read with what each engine calls", () => {
		const list = parseServedModelEngineList({
			namespace: "semoss",
			engines: [
				{
					engineId: "hand-1",
					engineName: "OLMo by hand",
					endpoint: "http://localhost:8000/v1",
					model: "olmo-2-1b-instruct",
					servedModel: null,
					calls: ["olmo-2-1b-instruct"],
				},
			],
		});

		expect(list.engines[0]).toEqual({
			engineId: "hand-1",
			engineName: "OLMo by hand",
			endpoint: "http://localhost:8000/v1",
			model: "olmo-2-1b-instruct",
			servedModel: null,
			namespace: null,
			calls: ["olmo-2-1b-instruct"],
		});
		expect(() => parseServedModelEngineList({ engines: [{}] })).toThrow(
			"The server returned a model engine without its id.",
		);
	});

	it("reject a link with the backend's reason", async () => {
		mocks.runPixel.mockResolvedValue(
			answer(
				"Cloud model calls the model gpt-4o, not olmo-2-1b-instruct. Set its MODEL to olmo-2-1b-instruct",
				["ERROR"],
			),
		);

		await expect(
			linkServedModelEngine("olmo-2-1b-instruct", "cloud-1"),
		).rejects.toThrow(/Set its MODEL to olmo-2-1b-instruct/);
	});
});

/** GetServingGpuStatus with the sample READY on the GB10, as the reactor maps it */
const GPU_STATUS = {
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
					[1793059080, 37],
					[1793059140, 2],
				],
				power: [[1793059140, 9.67]],
				temperature: [],
				smClock: [],
			},
		},
	],
	nodes: [
		{
			node: "spark-cbde",
			memoryTotal: 130661203968,
			memoryAvailable: 86777569280,
			memoryUsed: 43883634688,
			history: { memoryUsed: [[1793059140, 43883634688]] },
		},
	],
	grafana: {
		url: null,
		port: 3000,
		path: "/d/Oxed_c6Wz/nvidia-dcgm-exporter-dashboard",
	},
	warnings: [],
};

describe("GPU status", () => {
	it("is asked for over a window", () => {
		expect(buildServingGpuStatusPixel("1h")).toBe(
			'GetServingGpuStatus(window=["1h"]);',
		);
	});

	it("reads each GPU's live values, its users and its history", () => {
		const status = parseServingGpuStatus(GPU_STATUS);

		expect(status.metrics).toBe("prometheus");
		expect(status.stepSeconds).toBe(60);
		expect(status.gpus[0].now).toEqual({
			utilization: 2,
			power: 9.67,
			temperature: 40,
			smClock: null,
		});
		expect(status.gpus[0].usedBy[0].servedModel).toBe("olmo-2-1b-instruct");
		expect(status.gpus[0].history.utilization).toEqual([
			[1793059080, 37],
			[1793059140, 2],
		]);
		expect(status.nodes[0]).toEqual({
			node: "spark-cbde",
			total: 130661203968,
			available: 86777569280,
			used: 43883634688,
			history: [[1793059140, 43883634688]],
		});
		expect(status.grafana).toEqual({
			url: null,
			port: 3000,
			path: "/d/Oxed_c6Wz/nvidia-dcgm-exporter-dashboard",
		});
	});

	it("leaves out what is malformed, and reads an older or partial answer", () => {
		const status = parseServingGpuStatus({
			metrics: "unavailable",
			gpus: [
				{
					product: "NVIDIA-GB10",
					usedBy: [{ namespace: "semoss" }],
					history: {
						utilization: [
							[1, 2, 3],
							["t", 4],
							[5, 6],
						],
					},
				},
			],
			nodes: [{ node: "spark-cbde" }],
			grafana: null,
			warnings: ["The GPU metrics could not be read.", 7],
		});

		expect(status.gpus[0].usedBy).toEqual([]);
		expect(status.gpus[0].history.utilization).toEqual([[5, 6]]);
		expect(status.gpus[0].history.power).toEqual([]);
		expect(status.gpus[0].now.utilization).toBeNull();
		expect(status.nodes).toEqual([]);
		expect(status.grafana).toBeNull();
		expect(status.window).toBe("1h");
		expect(status.warnings).toEqual(["The GPU metrics could not be read."]);
		expect(() => parseServingGpuStatus("busy")).toThrow(
			"The server did not return the GPU status.",
		);
	});

	it("rejects with the backend's reason", async () => {
		mocks.runPixel.mockResolvedValue(
			answer("The window must be 15m, 1h, 6h or 24h; it is 2h", [
				"ERROR",
			]),
		);

		await expect(getServingGpuStatus("1h")).rejects.toThrow(
			"The window must be 15m, 1h, 6h or 24h; it is 2h",
		);
	});
});
