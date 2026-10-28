import { runPixel } from "@semoss/sdk/react";
import { isRecord } from "@semoss/utility/object";
import { auditPixelLiteral as pixelLiteral } from "./audit-pixel";

/**
 * The models SEMOSS serves on KServe, read and changed through the admin-only
 * serving reactors (`ListServedModels`, `StartServedModel`, …). Every read
 * validates the payload, since the backend can be older or newer than the client.
 */

/** Where a served model is in its lifecycle, as SEMOSS's ServedModelState names it */
export const SERVED_MODEL_STATES = [
	"READY",
	"STARTING",
	"WAITING_FOR_GPU",
	"FAILED",
	"STOPPING",
	"STOPPED",
	"REMOVING",
] as const;

export type ServedModelState = (typeof SERVED_MODEL_STATES)[number];

/** The model server's container and the one that downloads the weights */
export const SERVED_MODEL_CONTAINERS = [
	"kserve-container",
	"storage-initializer",
] as const;

export type ServedModelContainer = (typeof SERVED_MODEL_CONTAINERS)[number];

/** Why a served model failed, with the backend's hint and the end of its log */
export interface ServedModelFailure {
	/** DOWNLOAD_FAILED, IMAGE_PULL, MODEL_CRASH, … (ServedModelFailure.Cause) */
	cause: string;
	container: string | null;
	reason: string | null;
	exitCode: number | null;
	restarts: number;
	message: string | null;
	hint: string | null;
	logTail: string[];
}

/** The last start, stop or define, as SEMOSS recorded it on the InferenceService */
export interface ServedModelLastAction {
	action: string;
	userName: string | null;
	user: string | null;
	at: string | null;
}

/** A served model as ListServedModels reports it */
export interface ServedModel {
	/** The InferenceService name, which is also the model name clients send */
	servedModel: string;
	namespace: string | null;
	/** Whether SEMOSS defined it; SEMOSS removes only those */
	managed: boolean;
	displayName: string | null;
	catalogEntry: string | null;
	/** One of SERVED_MODEL_STATES, or a newer backend's state */
	state: string;
	/** The step of a start (ServedModelPhase), or null */
	phase: string | null;
	message: string | null;
	/** 0 to 1 while starting, 1 when ready, otherwise null */
	progress: number | null;
	etaSeconds: number | null;
	etaBasis: string | null;
	phaseSince: string | null;
	startRequestedAt: string | null;
	lastAction: ServedModelLastAction | null;
	storageUri: string | null;
	runtime: string | null;
	gpuMemoryUtilization: number | null;
	inClusterUrl: string | null;
	/** The OpenAI base URL at which this SEMOSS reaches the model */
	endpoint: string | null;
	/** Why there is no endpoint, or why it may not last */
	endpointNote: string | null;
	/** The node port it is published on for the LAN, or null */
	hostPort: number | null;
	pod: string | null;
	restarts: number;
	failure: ServedModelFailure | null;
	warnings: string[];
	observedAt: string | null;
}

/** One step of the last start, with how long it took */
export interface ServedModelPhaseSpan {
	phase: string;
	startedAt: string | null;
	endedAt: string | null;
	seconds: number | null;
}

/** A recent Kubernetes event about the model's objects */
export interface ServedModelEvent {
	time: string | null;
	type: string | null;
	reason: string | null;
	object: string | null;
	container: string | null;
	message: string | null;
	count: number | null;
}

/** A KServe status condition */
export interface ServedModelCondition {
	type: string | null;
	status: string | null;
	reason: string | null;
	message: string | null;
}

/** A served model as GetServedModelStatus reports it */
export interface ServedModelDetail extends ServedModel {
	vllm: {
		architecture: string | null;
		maxModelLen: number | null;
		weightsGiB: number | null;
		kvCacheGiB: number | null;
	};
	phases: ServedModelPhaseSpan[];
	events: ServedModelEvent[];
	conditions: ServedModelCondition[];
}

/** The served models of the namespace SEMOSS manages */
export interface ServedModelList {
	namespace: string | null;
	servedModels: ServedModel[];
}

/** A pod holding GPUs */
export interface ServingGpuHolder {
	servedModel: string | null;
	pod: string | null;
	gpus: number;
	state: string | null;
	since: string | null;
	startedBy: string | null;
	leaving: boolean;
}

/** Whether a model could start now, and what is in its way */
export interface ServingCapacityModel {
	servedModel: string;
	state: string | null;
	gpus: number;
	gpuMemoryUtilization: number | null;
	fractionSource: string | null;
	/** Known for stopped and failed models only */
	canStart: boolean | null;
	reason: string | null;
	/** The models a start with replace would stop; null from a backend that does not say */
	blocking: string[] | null;
	/** Whether a start with replace can make room; null from a backend that does not say */
	canReplace: boolean | null;
}

/** The GPUs and unified memory the served models share (GetServingCapacity) */
export interface ServingCapacity {
	namespace: string | null;
	gpus: {
		/** GPUs on schedulable nodes; null when SEMOSS may not list the nodes */
		offered: number | null;
		held: number;
		free: number | null;
		nodes: { name: string; gpus: number; schedulable: boolean }[];
		holders: ServingGpuHolder[];
	};
	memory: {
		/** The share of the unified memory all models may use together */
		budget: number;
		used: number;
		free: number;
		models: {
			servedModel: string;
			fraction: number;
			source: string | null;
			leaving: boolean;
		}[];
	};
	models: ServingCapacityModel[];
	warnings: string[];
}

/** The DCGM fields the GPU card shows, as GetServingGpuStatus names them */
export const SERVING_GPU_METRICS = [
	"utilization",
	"power",
	"temperature",
	"smClock",
] as const;

export type ServingGpuMetric = (typeof SERVING_GPU_METRICS)[number];

/** How far back GetServingGpuStatus's history goes, in 60 steps */
export const SERVING_GPU_WINDOWS = ["15m", "1h", "6h", "24h"] as const;

export type ServingGpuWindow = (typeof SERVING_GPU_WINDOWS)[number];

/** A point of a history: seconds since the epoch, and the value */
export type ServingGpuPoint = readonly [time: number, value: number];

/** A pod using a GPU, and its served model when it is one */
export interface ServingGpuWorkload {
	namespace: string | null;
	pod: string;
	container: string | null;
	servedModel: string | null;
}

/** A GPU as the GPU Operator's DCGM exporter and node labels describe it */
export interface ServingGpu {
	node: string | null;
	/** DCGM's index of the GPU on its node */
	index: string | null;
	uuid: string | null;
	/** "NVIDIA GB10" */
	product: string | null;
	driver: string | null;
	/** The CUDA version the driver supports; null when SEMOSS may not list nodes */
	cuda: string | null;
	family: string | null;
	/** How pods share it: none, time-slicing, mps */
	sharing: string | null;
	/** The live values; null for a field Prometheus has no reading of */
	now: Record<ServingGpuMetric, number | null>;
	usedBy: ServingGpuWorkload[];
	/** Each field averaged per step over the window, oldest first */
	history: Record<ServingGpuMetric, ServingGpuPoint[]>;
}

/** A node's memory in bytes, which a GB10 shares with the CPU */
export interface ServingNodeMemory {
	node: string;
	total: number;
	available: number;
	used: number;
	/** The memory in use, oldest first */
	history: ServingGpuPoint[];
}

/** Where the card links to NVIDIA's DCGM dashboard in Grafana */
export interface ServingGrafanaLink {
	/** Grafana's address; null for `port` on the host the browser used */
	url: string | null;
	port: number;
	path: string;
}

/** What the GPUs are doing (GetServingGpuStatus) */
export interface ServingGpuStatus {
	/** prometheus, unavailable (a warning says why) or off */
	metrics: string;
	/** Where the metrics come from; null without Prometheus */
	source: string | null;
	readAt: string | null;
	window: string;
	stepSeconds: number;
	gpus: ServingGpu[];
	nodes: ServingNodeMemory[];
	/** null when the link is turned off */
	grafana: ServingGrafanaLink | null;
	warnings: string[];
}

/** A model admins approved for serving (ListServingCatalog) */
export interface ServingCatalogEntry {
	id: string;
	displayName: string | null;
	storageUri: string | null;
	serviceAccount: string | null;
	runtime: string | null;
	args: string[];
	cpu: string | null;
	memory: string | null;
	sizeBytes: number | null;
	contextWindow: number | null;
	maxTokens: number | null;
	licence: string | null;
	origin: string | null;
	approvedBy: string | null;
	approvedAt: string | null;
}

/** The serving catalog and the entries SEMOSS left out of it */
export interface ServingCatalog {
	/** Where SEMOSS read it, such as a ConfigMap */
	source: string | null;
	models: ServingCatalogEntry[];
	/** Entries left out, and why */
	problems: string[];
}

/** The end of a container's log */
export interface ServedModelLogs {
	servedModel: string;
	pod: string | null;
	container: string | null;
	previous: boolean;
	lines: string[];
}

/** A SEMOSS engine created for a served model */
export interface ServedModelEngine {
	id: string;
	name: string | null;
}

/** What a start did */
export interface ServedModelStartResult {
	model: ServedModelDetail;
	/** False when the model was already starting or ready */
	changed: boolean;
	/** The models stopped to make room */
	replaced: string[];
	/** Whether a failed model was stopped and started again */
	restarted: boolean;
	warnings: string[];
}

/**
 * A SEMOSS model engine that belongs with a served model: linked to it (its smss
 * has KSERVE_SERVED_MODEL, as CreateServedModelEngine writes it), or calling it
 * without the link, like an engine made by hand with the model's name or URL
 */
export interface ServedModelEngineLink {
	engineId: string;
	engineName: string;
	/** The OpenAI base URL it calls */
	endpoint: string | null;
	/** The model name it sends */
	model: string | null;
	/** The served model it is linked to, or null */
	servedModel: string | null;
	/** That served model's KServe namespace, or null */
	namespace: string | null;
	/** The served models it calls, by its model name or its endpoint */
	calls: string[];
}

/** The engines of the served models (ListServedModelEngines) */
export interface ServedModelEngineList {
	namespace: string | null;
	engines: ServedModelEngineLink[];
}

/** What a link did */
export interface ServedModelLinkResult {
	engine: ServedModelEngineLink;
	/** False when the engine already was linked to the model */
	changed: boolean;
}

/** What an unlink did */
export interface ServedModelUnlinkResult {
	/** The served model it was linked to, or null when it was not */
	unlinkedFrom: string | null;
	changed: boolean;
}

/** What a stop did */
export interface ServedModelStopResult {
	model: ServedModelDetail;
	/** False when the model was already stopped */
	changed: boolean;
}

/** What a removal did */
export interface ServedModelRemoveResult {
	servedModel: string;
	removed: boolean;
	state: string | null;
	message: string | null;
}

/** What a definition did */
export interface ServedModelDefineResult {
	model: ServedModelDetail;
	/** The engine created with it, when one was asked for and created */
	engine: ServedModelEngine | null;
	warnings: string[];
}

/** The settings a model is defined with */
export interface ServedModelDefinition {
	servedModel: string;
	catalogEntry: string;
	/** Share of the unified memory vLLM may use; the catalog's when absent */
	gpuMemoryUtilization?: number;
	/** vLLM's context length; the catalog's when absent */
	maxModelLen?: number;
	start: boolean;
	createEngine: boolean;
	engineName?: string;
	engineGlobal: boolean;
	publish: boolean;
	/** The node port to publish on; the lowest free one when absent */
	publishPort?: number;
}

/** What to read of a served model's log */
export interface ServedModelLogOptions {
	container: ServedModelContainer;
	tailLines: number;
	/** The previous instance of the container, after a restart */
	previous: boolean;
	/** Keep vLLM's per-request access lines */
	includeAccessLogs: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                   Pixels                                   */
/* -------------------------------------------------------------------------- */

/** Every served model, stopped ones included */
export const buildListServedModelsPixel = (): string => "ListServedModels();";

export const buildServingCapacityPixel = (): string => "GetServingCapacity();";

export const buildServingGpuStatusPixel = (window: ServingGpuWindow): string =>
	`GetServingGpuStatus(window=[${pixelLiteral(window)}]);`;

export const buildServingCatalogPixel = (): string => "ListServingCatalog();";

export const buildServedModelStatusPixel = (servedModel: string): string =>
	`GetServedModelStatus(servedModel=[${pixelLiteral(servedModel)}]);`;

export const buildStartServedModelPixel = (
	servedModel: string,
	replace: boolean,
): string =>
	`StartServedModel(servedModel=[${pixelLiteral(servedModel)}]${replace ? ", replace=[true]" : ""});`;

export const buildStopServedModelPixel = (servedModel: string): string =>
	`StopServedModel(servedModel=[${pixelLiteral(servedModel)}]);`;

export const buildRemoveServedModelPixel = (servedModel: string): string =>
	`RemoveServedModel(servedModel=[${pixelLiteral(servedModel)}]);`;

/** DefineServedModel with only the arguments that differ from its defaults */
export const buildDefineServedModelPixel = (
	definition: ServedModelDefinition,
): string => {
	const args = [
		`servedModel=[${pixelLiteral(definition.servedModel)}]`,
		`catalogEntry=[${pixelLiteral(definition.catalogEntry)}]`,
	];
	const overrides: Record<string, number> = {};
	if (definition.gpuMemoryUtilization !== undefined) {
		overrides.gpuMemoryUtilization = definition.gpuMemoryUtilization;
	}
	if (definition.maxModelLen !== undefined) {
		overrides.maxModelLen = definition.maxModelLen;
	}
	if (Object.keys(overrides).length > 0) {
		args.push(
			`overrides=[${JSON.stringify(overrides).replace(/</g, "\\u003c")}]`,
		);
	}
	if (definition.start) {
		args.push("start=[true]");
	}
	if (definition.createEngine) {
		args.push("createEngine=[true]");
		if (definition.engineName) {
			args.push(`engineName=[${pixelLiteral(definition.engineName)}]`);
		}
		if (definition.engineGlobal) {
			args.push("engineGlobal=[true]");
		}
	}
	if (definition.publish) {
		args.push("publish=[true]");
		if (definition.publishPort !== undefined) {
			args.push(`publishPort=[${pixelLiteral(definition.publishPort)}]`);
		}
	}
	return `DefineServedModel(${args.join(", ")});`;
};

export const buildCreateServedModelEnginePixel = (
	servedModel: string,
	engineName: string | undefined,
	global: boolean,
): string => {
	const args = [`servedModel=[${pixelLiteral(servedModel)}]`];
	if (engineName) {
		args.push(`engineName=[${pixelLiteral(engineName)}]`);
	}
	if (global) {
		args.push("global=[true]");
	}
	return `CreateServedModelEngine(${args.join(", ")});`;
};

export const buildServedModelLogsPixel = (
	servedModel: string,
	options: ServedModelLogOptions,
): string => {
	const args = [
		`servedModel=[${pixelLiteral(servedModel)}]`,
		`container=[${pixelLiteral(options.container)}]`,
		`tailLines=[${pixelLiteral(options.tailLines)}]`,
	];
	if (options.previous) {
		args.push("previous=[true]");
	}
	if (options.includeAccessLogs) {
		args.push("includeAccessLogs=[true]");
	}
	return `GetServedModelLogs(${args.join(", ")});`;
};

/** The model engines linked to the served models, and those that call one */
export const buildServedModelEnginesPixel = (): string =>
	"ListServedModelEngines();";

export const buildLinkServedModelEnginePixel = (
	servedModel: string,
	engineId: string,
): string =>
	`LinkServedModelEngine(servedModel=[${pixelLiteral(servedModel)}], engine=[${pixelLiteral(engineId)}]);`;

export const buildUnlinkServedModelEnginePixel = (engineId: string): string =>
	`UnlinkServedModelEngine(engine=[${pixelLiteral(engineId)}]);`;

/* -------------------------------------------------------------------------- */
/*                                   Parsing                                  */
/* -------------------------------------------------------------------------- */

const readString = (value: unknown): string | null =>
	typeof value === "string" ? value : null;

const readNumber = (value: unknown): number | null =>
	typeof value === "number" && Number.isFinite(value) ? value : null;

const readStrings = (value: unknown): string[] =>
	Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];

const readRecords = (value: unknown): Record<string, unknown>[] =>
	Array.isArray(value) ? value.filter(isRecord) : [];

/** Read a record, or throw naming what the backend should have sent. */
const requireRecord = (
	value: unknown,
	what: string,
): Record<string, unknown> => {
	if (!isRecord(value)) {
		throw new Error(`The server did not return ${what}.`);
	}
	return value;
};

const parseFailure = (value: unknown): ServedModelFailure | null => {
	if (!isRecord(value)) {
		return null;
	}
	return {
		cause: readString(value.cause) ?? "UNKNOWN",
		container: readString(value.container),
		reason: readString(value.reason),
		exitCode: readNumber(value.exitCode),
		restarts: readNumber(value.restarts) ?? 0,
		message: readString(value.message),
		hint: readString(value.hint),
		logTail: readStrings(value.logTail),
	};
};

const parseLastAction = (value: unknown): ServedModelLastAction | null => {
	if (!isRecord(value) || typeof value.action !== "string") {
		return null;
	}
	return {
		action: value.action,
		userName: readString(value.userName),
		user: readString(value.user),
		at: readString(value.at),
	};
};

/** Read a served model's summary (ServedModelStatus.toSummaryMap). */
export function parseServedModel(value: unknown): ServedModel {
	const record = requireRecord(value, "a served model");
	const servedModel = readString(record.servedModel);
	if (!servedModel) {
		throw new Error("The server returned a served model without a name.");
	}
	return {
		servedModel,
		namespace: readString(record.namespace),
		managed: record.managed === true,
		displayName: readString(record.displayName),
		catalogEntry: readString(record.catalogEntry),
		state: readString(record.state) ?? "UNKNOWN",
		phase: readString(record.phase),
		message: readString(record.message),
		progress: readNumber(record.progress),
		etaSeconds: readNumber(record.etaSeconds),
		etaBasis: readString(record.etaBasis),
		phaseSince: readString(record.phaseSince),
		startRequestedAt: readString(record.startRequestedAt),
		lastAction: parseLastAction(record.lastAction),
		storageUri: readString(record.storageUri),
		runtime: readString(record.runtime),
		gpuMemoryUtilization: readNumber(record.gpuMemoryUtilization),
		inClusterUrl: readString(record.inClusterUrl),
		endpoint: readString(record.endpoint),
		endpointNote: readString(record.endpointNote),
		hostPort: readNumber(record.hostPort),
		pod: readString(record.pod),
		restarts: readNumber(record.restarts) ?? 0,
		failure: parseFailure(record.failure),
		warnings: readStrings(record.warnings),
		observedAt: readString(record.observedAt),
	};
}

/** Read a served model's detail (ServedModelStatus.toDetailMap). */
export function parseServedModelDetail(value: unknown): ServedModelDetail {
	const summary = parseServedModel(value);
	const record = requireRecord(value, "a served model");
	const vllm = isRecord(record.vllm) ? record.vllm : {};
	return {
		...summary,
		vllm: {
			architecture: readString(vllm.architecture),
			maxModelLen: readNumber(vllm.maxModelLen),
			weightsGiB: readNumber(vllm.weightsGiB),
			kvCacheGiB: readNumber(vllm.kvCacheGiB),
		},
		phases: readRecords(record.phases).flatMap((span) => {
			const phase = readString(span.phase);
			return phase
				? [
						{
							phase,
							startedAt: readString(span.startedAt),
							endedAt: readString(span.endedAt),
							seconds: readNumber(span.seconds),
						},
					]
				: [];
		}),
		events: readRecords(record.events).map((event) => ({
			time: readString(event.time),
			type: readString(event.type),
			reason: readString(event.reason),
			object: readString(event.object),
			container: readString(event.container),
			message: readString(event.message),
			count: readNumber(event.count),
		})),
		conditions: readRecords(record.conditions).map((condition) => ({
			type: readString(condition.type),
			status: readString(condition.status),
			reason: readString(condition.reason),
			message: readString(condition.message),
		})),
	};
}

/** Read ListServedModels's result. */
export function parseServedModelList(value: unknown): ServedModelList {
	const record = requireRecord(value, "the served models");
	if (!Array.isArray(record.servedModels)) {
		throw new Error("The server did not return the served models.");
	}
	return {
		namespace: readString(record.namespace),
		servedModels: record.servedModels.map(parseServedModel),
	};
}

/** Read GetServingCapacity's result. */
export function parseServingCapacity(value: unknown): ServingCapacity {
	const record = requireRecord(value, "the serving capacity");
	const gpus = isRecord(record.gpus) ? record.gpus : {};
	const memory = isRecord(record.memory) ? record.memory : {};
	return {
		namespace: readString(record.namespace),
		gpus: {
			offered: readNumber(gpus.offered),
			held: readNumber(gpus.held) ?? 0,
			free: readNumber(gpus.free),
			nodes: readRecords(gpus.nodes).map((node) => ({
				name: readString(node.name) ?? "",
				gpus: readNumber(node.gpus) ?? 0,
				schedulable: node.schedulable === true,
			})),
			holders: readRecords(gpus.holders).map((holder) => ({
				servedModel: readString(holder.servedModel),
				pod: readString(holder.pod),
				gpus: readNumber(holder.gpus) ?? 0,
				state: readString(holder.state),
				since: readString(holder.since),
				startedBy: readString(holder.startedBy),
				leaving: holder.leaving === true,
			})),
		},
		memory: {
			budget: readNumber(memory.budget) ?? 0,
			used: readNumber(memory.used) ?? 0,
			free: readNumber(memory.free) ?? 0,
			models: readRecords(memory.models).flatMap((use) => {
				const servedModel = readString(use.servedModel);
				return servedModel
					? [
							{
								servedModel,
								fraction: readNumber(use.fraction) ?? 0,
								source: readString(use.source),
								leaving: use.leaving === true,
							},
						]
					: [];
			}),
		},
		models: readRecords(record.models).flatMap((model) => {
			const servedModel = readString(model.servedModel);
			return servedModel
				? [
						{
							servedModel,
							state: readString(model.state),
							gpus: readNumber(model.gpus) ?? 0,
							gpuMemoryUtilization: readNumber(
								model.gpuMemoryUtilization,
							),
							fractionSource: readString(model.fractionSource),
							canStart:
								typeof model.canStart === "boolean"
									? model.canStart
									: null,
							reason: readString(model.reason),
							blocking: Array.isArray(model.blocking)
								? readStrings(model.blocking)
								: null,
							canReplace:
								typeof model.canReplace === "boolean"
									? model.canReplace
									: null,
						},
					]
				: [];
		}),
		warnings: readStrings(record.warnings),
	};
}

/** `[seconds, value]` pairs; anything else is left out */
const readPoints = (value: unknown): ServingGpuPoint[] =>
	Array.isArray(value)
		? value.flatMap((pair): ServingGpuPoint[] => {
				if (!Array.isArray(pair) || pair.length !== 2) {
					return [];
				}
				const time = readNumber(pair[0]);
				const reading = readNumber(pair[1]);
				return time !== null && reading !== null
					? [[time, reading]]
					: [];
			})
		: [];

/** Read GetServingGpuStatus's result. */
export function parseServingGpuStatus(value: unknown): ServingGpuStatus {
	const record = requireRecord(value, "the GPU status");
	const grafana = isRecord(record.grafana) ? record.grafana : null;
	const grafanaPath = grafana ? readString(grafana.path) : null;
	return {
		metrics: readString(record.metrics) ?? "unavailable",
		source: readString(record.source),
		readAt: readString(record.readAt),
		window: readString(record.window) ?? "1h",
		stepSeconds: readNumber(record.stepSeconds) ?? 60,
		gpus: readRecords(record.gpus).map((gpu) => {
			const history = isRecord(gpu.history) ? gpu.history : {};
			return {
				node: readString(gpu.node),
				index: readString(gpu.index),
				uuid: readString(gpu.uuid),
				product: readString(gpu.product),
				driver: readString(gpu.driver),
				cuda: readString(gpu.cuda),
				family: readString(gpu.family),
				sharing: readString(gpu.sharing),
				now: {
					utilization: readNumber(gpu.utilization),
					power: readNumber(gpu.power),
					temperature: readNumber(gpu.temperature),
					smClock: readNumber(gpu.smClock),
				},
				usedBy: readRecords(gpu.usedBy).flatMap((use) => {
					const pod = readString(use.pod);
					return pod
						? [
								{
									namespace: readString(use.namespace),
									pod,
									container: readString(use.container),
									servedModel: readString(use.servedModel),
								},
							]
						: [];
				}),
				history: {
					utilization: readPoints(history.utilization),
					power: readPoints(history.power),
					temperature: readPoints(history.temperature),
					smClock: readPoints(history.smClock),
				},
			};
		}),
		nodes: readRecords(record.nodes).flatMap((node) => {
			const name = readString(node.node);
			const total = readNumber(node.memoryTotal);
			const available = readNumber(node.memoryAvailable);
			if (!name || total === null || available === null) {
				return [];
			}
			const history = isRecord(node.history) ? node.history : {};
			return [
				{
					node: name,
					total,
					available,
					used:
						readNumber(node.memoryUsed) ??
						Math.max(0, total - available),
					history: readPoints(history.memoryUsed),
				},
			];
		}),
		grafana:
			grafana && grafanaPath
				? {
						url: readString(grafana.url),
						port: readNumber(grafana.port) ?? 3000,
						path: grafanaPath,
					}
				: null,
		warnings: readStrings(record.warnings),
	};
}

/** Read ListServingCatalog's result. */
export function parseServingCatalog(value: unknown): ServingCatalog {
	const record = requireRecord(value, "the serving catalog");
	return {
		source: readString(record.source),
		models: readRecords(record.models).flatMap((entry) => {
			const id = readString(entry.id);
			return id
				? [
						{
							id,
							displayName: readString(entry.displayName),
							storageUri: readString(entry.storageUri),
							serviceAccount: readString(entry.serviceAccount),
							runtime: readString(entry.runtime),
							args: readStrings(entry.args),
							cpu: readString(entry.cpu),
							memory: readString(entry.memory),
							sizeBytes: readNumber(entry.sizeBytes),
							contextWindow: readNumber(entry.contextWindow),
							maxTokens: readNumber(entry.maxTokens),
							licence: readString(entry.licence),
							origin: readString(entry.origin),
							approvedBy: readString(entry.approvedBy),
							approvedAt: readString(entry.approvedAt),
						},
					]
				: [];
		}),
		problems: readStrings(record.problems),
	};
}

/** Read GetServedModelLogs's result. */
export function parseServedModelLogs(value: unknown): ServedModelLogs {
	const record = requireRecord(value, "the log");
	return {
		servedModel: readString(record.servedModel) ?? "",
		pod: readString(record.pod),
		container: readString(record.container),
		previous: record.previous === true,
		lines: readStrings(record.lines),
	};
}

/** The engine in CreateModelEngine's result, which is the engine's catalog row */
const parseEngine = (value: unknown): ServedModelEngine | null => {
	if (!isRecord(value)) {
		return null;
	}
	const id = readString(value.engine_id) ?? readString(value.database_id);
	if (!id) {
		return null;
	}
	return {
		id,
		name:
			readString(value.engine_display_name) ??
			readString(value.engine_name) ??
			readString(value.database_name),
	};
};

/** Read one engine of ListServedModelEngines, or LinkServedModelEngine's result. */
export function parseServedModelEngineLink(
	value: unknown,
): ServedModelEngineLink {
	const record = requireRecord(value, "a model engine");
	const engineId = readString(record.engineId);
	if (!engineId) {
		throw new Error("The server returned a model engine without its id.");
	}
	return {
		engineId,
		engineName: readString(record.engineName) ?? engineId,
		endpoint: readString(record.endpoint),
		model: readString(record.model),
		servedModel: readString(record.servedModel),
		namespace: readString(record.namespace),
		calls: readStrings(record.calls),
	};
}

/** Read ListServedModelEngines's result. */
export function parseServedModelEngineList(
	value: unknown,
): ServedModelEngineList {
	const record = requireRecord(value, "the model engines");
	if (!Array.isArray(record.engines)) {
		throw new Error("The server did not return the model engines.");
	}
	return {
		namespace: readString(record.namespace),
		engines: record.engines.map(parseServedModelEngineLink),
	};
}

/* -------------------------------------------------------------------------- */
/*                                  Requests                                  */
/* -------------------------------------------------------------------------- */

/**
 * Run one serving pixel: its output, and the warnings the reactor added to it.
 * Rejects with the backend's message when the pixel fails.
 */
async function runServingPixel(
	pixel: string,
): Promise<{ output: unknown; warnings: string[] }> {
	const response = await runPixel<[unknown]>(pixel);
	const result = response?.pixelReturn?.[0];
	if (!result) {
		throw new Error("The server did not answer.");
	}
	if (result.operationType?.includes("ERROR")) {
		throw new Error(
			typeof result.output === "string"
				? result.output
				: "The request failed.",
		);
	}
	const warnings = readRecords(result.additionalOutput).flatMap((extra) =>
		Array.isArray(extra.operationType) &&
		extra.operationType.includes("WARNING") &&
		typeof extra.output === "string"
			? [extra.output]
			: [],
	);
	return { output: result.output, warnings };
}

export async function listServedModels(): Promise<ServedModelList> {
	const { output } = await runServingPixel(buildListServedModelsPixel());
	return parseServedModelList(output);
}

export async function getServingCapacity(): Promise<ServingCapacity> {
	const { output } = await runServingPixel(buildServingCapacityPixel());
	return parseServingCapacity(output);
}

export async function getServingGpuStatus(
	window: ServingGpuWindow,
): Promise<ServingGpuStatus> {
	const { output } = await runServingPixel(
		buildServingGpuStatusPixel(window),
	);
	return parseServingGpuStatus(output);
}

export async function getServedModelStatus(
	servedModel: string,
): Promise<ServedModelDetail> {
	const { output } = await runServingPixel(
		buildServedModelStatusPixel(servedModel),
	);
	return parseServedModelDetail(output);
}

/**
 * Start a stopped or failed model. With replace, first stop the models in its
 * way; without it, a model that does not fit is refused with the reason.
 */
export async function startServedModel(
	servedModel: string,
	replace: boolean,
): Promise<ServedModelStartResult> {
	const { output, warnings } = await runServingPixel(
		buildStartServedModelPixel(servedModel, replace),
	);
	const record = requireRecord(output, "the started model");
	return {
		model: parseServedModelDetail(record),
		changed: record.changed === true,
		replaced: readStrings(record.replaced),
		restarted: record.restarted === true,
		warnings,
	};
}

export async function stopServedModel(
	servedModel: string,
): Promise<ServedModelStopResult> {
	const { output } = await runServingPixel(
		buildStopServedModelPixel(servedModel),
	);
	const record = requireRecord(output, "the stopped model");
	return {
		model: parseServedModelDetail(record),
		changed: record.changed === true,
	};
}

export async function removeServedModel(
	servedModel: string,
): Promise<ServedModelRemoveResult> {
	const { output } = await runServingPixel(
		buildRemoveServedModelPixel(servedModel),
	);
	const record = requireRecord(output, "the removed model");
	return {
		servedModel: readString(record.servedModel) ?? servedModel,
		removed: record.removed === true,
		state: readString(record.state),
		message: readString(record.message),
	};
}

export async function defineServedModel(
	definition: ServedModelDefinition,
): Promise<ServedModelDefineResult> {
	const { output, warnings } = await runServingPixel(
		buildDefineServedModelPixel(definition),
	);
	const record = requireRecord(output, "the defined model");
	return {
		model: parseServedModelDetail(record),
		engine: parseEngine(record.engine),
		warnings,
	};
}

/** Create a SEMOSS model engine that calls the served model's endpoint. */
export async function createServedModelEngine(
	servedModel: string,
	engineName: string | undefined,
	global: boolean,
): Promise<ServedModelEngine> {
	const { output } = await runServingPixel(
		buildCreateServedModelEnginePixel(servedModel, engineName, global),
	);
	const engine = parseEngine(requireRecord(output, "the engine").engine);
	if (!engine) {
		throw new Error("The server did not say which engine it created.");
	}
	return engine;
}

export async function getServedModelLogs(
	servedModel: string,
	options: ServedModelLogOptions,
): Promise<ServedModelLogs> {
	const { output } = await runServingPixel(
		buildServedModelLogsPixel(servedModel, options),
	);
	return parseServedModelLogs(output);
}

export async function listServedModelEngines(): Promise<ServedModelEngineList> {
	const { output } = await runServingPixel(buildServedModelEnginesPixel());
	return parseServedModelEngineList(output);
}

/**
 * Link a model engine to a served model, so it says when the model is stopped.
 * Rejects when the engine does not call the model, saying what to change.
 */
export async function linkServedModelEngine(
	servedModel: string,
	engineId: string,
): Promise<ServedModelLinkResult> {
	const { output } = await runServingPixel(
		buildLinkServedModelEnginePixel(servedModel, engineId),
	);
	return {
		engine: parseServedModelEngineLink(output),
		changed: requireRecord(output, "the linked engine").changed === true,
	};
}

export async function unlinkServedModelEngine(
	engineId: string,
): Promise<ServedModelUnlinkResult> {
	const { output } = await runServingPixel(
		buildUnlinkServedModelEnginePixel(engineId),
	);
	const record = requireRecord(output, "the unlinked engine");
	return {
		unlinkedFrom: readString(record.unlinkedFrom),
		changed: record.changed === true,
	};
}
