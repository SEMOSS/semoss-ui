import { describe, expect, test } from "vitest";
import {
	collectGuardrailConfigIssues,
	createGuardrailPipeline,
	extractGuardrailEngineDetails,
	extractGuardrailFileStatus,
	extractInterceptableMethods,
	extractResultArgumentName,
	guardrailArgumentOptions,
	guardrailConfigFromResponse,
	guardrailConfigToJson,
	type InterceptableMethod,
	validateGuardrailConfig,
} from "./engine-guardrail-settings.constants";

const INPUT_REACTOR = "prerna.reactor.interceptor.GenericGuardrailInputReactor";

const LIST_BATCHES: InterceptableMethod = {
	name: "listBatches",
	deprecated: false,
	returnType: "BatchListResponse",
	returnsModelResponse: false,
	arguments: [],
};

/** A blocking response check reading one argument. */
const outputCheck = (args: string) => ({
	id: "check-1",
	guardrailEngineId: "guardrail-1",
	failureAction: "block" as const,
	closeRoomOnBlock: false,
	blockErrorMessage: "",
	inputMapping: [{ id: "a", key: "prompt", args }],
	directParameters: [],
});

const ASK_ROOM: InterceptableMethod = {
	name: "askRoom",
	deprecated: false,
	returnType: "AskModelEngineResponse",
	returnsModelResponse: true,
	arguments: [
		{
			name: "arg0",
			position: 0,
			nameIsFromSource: false,
			type: "InputMessage",
			guardable: true,
		},
		{
			name: "arg1",
			position: 1,
			nameIsFromSource: false,
			type: "Room",
			guardable: false,
		},
	],
};

describe("guardrail settings configuration", () => {
	test("loads and serializes a response as one exclusive action", () => {
		const form = guardrailConfigFromResponse({
			pipelines: {
				askRoom: {
					input: [
						{
							reactorClass: INPUT_REACTOR,
							params: {
								guardrailEngineId: "guardrail-1",
								blockOnGuardrailFailure: false,
								maskOnGuardrailFailure: false,
								respondWithGuardrailMessage: true,
								closeRoomOnBlock: false,
								inputMapping: { prompt: "arg0" },
							},
						},
					],
				},
			},
		});

		const entry = form.pipelines[0]?.input[0];
		expect(entry).toMatchObject({
			failureAction: "respond",
			closeRoomOnBlock: false,
			blockErrorMessage: "",
		});

		const serializedEntry = JSON.parse(guardrailConfigToJson(form))
			.pipelines.askRoom.input[0];
		expect(serializedEntry.reactorClass).toBe(INPUT_REACTOR);
		expect(serializedEntry.params).toMatchObject({
			blockOnGuardrailFailure: false,
			maskOnGuardrailFailure: false,
			respondWithGuardrailMessage: true,
			closeRoomOnBlock: false,
		});
		expect(serializedEntry.params).not.toHaveProperty("blockErrorMessage");
	});

	test("writes explicit false defaults and omits an empty block message", () => {
		const form = { pipelines: [createGuardrailPipeline("askRoom")] };
		const entry = form.pipelines[0]?.input[0];
		if (entry) {
			entry.guardrailEngineId = "guardrail-1";
		}

		const serialized = JSON.parse(guardrailConfigToJson(form));
		const params = serialized.pipelines.askRoom.input[0].params;
		expect(params.blockOnGuardrailFailure).toBe(true);
		expect(params.maskOnGuardrailFailure).toBe(false);
		expect(params.respondWithGuardrailMessage).toBe(false);
		expect(params.closeRoomOnBlock).toBe(false);
		expect(params).not.toHaveProperty("blockErrorMessage");
	});

	test("serializes masking as the only active failure action", () => {
		const form = { pipelines: [createGuardrailPipeline("askRoom")] };
		const entry = form.pipelines[0]?.input[0];
		if (entry) {
			entry.guardrailEngineId = "guardrail-1";
			entry.failureAction = "mask";
		}

		expect(validateGuardrailConfig(form)).toBe(true);
		const params = JSON.parse(guardrailConfigToJson(form)).pipelines.askRoom
			.input[0].params;
		expect(params).toMatchObject({
			blockOnGuardrailFailure: false,
			maskOnGuardrailFailure: true,
			respondWithGuardrailMessage: false,
		});
		expect(params).not.toHaveProperty("maskTargetParam");
	});

	test("accepts masking under any guardrail parameter name", () => {
		const pipeline = createGuardrailPipeline("askRoom");
		const entry = pipeline.input[0];
		if (entry) {
			entry.guardrailEngineId = "guardrail-1";
			entry.failureAction = "mask";
			// a storage or vector call names its content something else
			entry.inputMapping = [{ id: "a", key: "content", args: "arg1" }];
		}

		expect(validateGuardrailConfig({ pipelines: [pipeline] })).toBe(true);
	});

	test("rejects masking when no input can receive the masked value", () => {
		const combined = createGuardrailPipeline("askRoom");
		const combinedEntry = combined.input[0];
		if (combinedEntry) {
			combinedEntry.guardrailEngineId = "guardrail-1";
			combinedEntry.failureAction = "mask";
			combinedEntry.inputMapping = [
				{ id: "a", key: "content", args: "arg0, arg1" },
			];
		}
		expect(validateGuardrailConfig({ pipelines: [combined] })).toContain(
			"Masking needs one input that reads a single argument",
		);

		const overridden = createGuardrailPipeline("askRoom");
		const overriddenEntry = overridden.input[0];
		if (overriddenEntry) {
			overriddenEntry.guardrailEngineId = "guardrail-1";
			overriddenEntry.failureAction = "mask";
			overriddenEntry.inputMapping = [
				{ id: "a", key: "content", args: "arg0" },
			];
			// a fixed value shadows the mapping, so the argument is never read
			overriddenEntry.directParameters = [
				{ id: "b", key: "content", type: "string", value: "fixed" },
			];
		}
		expect(validateGuardrailConfig({ pipelines: [overridden] })).toContain(
			"is not overridden by a fixed value",
		);
	});

	test("accepts masking when only one of several inputs is writable", () => {
		const pipeline = createGuardrailPipeline("askRoom");
		const entry = pipeline.input[0];
		if (entry) {
			entry.guardrailEngineId = "guardrail-1";
			entry.failureAction = "mask";
			entry.inputMapping = [
				{ id: "a", key: "content", args: "arg0, arg1" },
				{ id: "b", key: "title", args: "arg2" },
			];
		}

		expect(validateGuardrailConfig({ pipelines: [pipeline] })).toBe(true);
	});

	test("loads and serializes array and JSON direct parameters", () => {
		const form = guardrailConfigFromResponse({
			pipelines: {
				askRoom: {
					input: [
						{
							reactorClass: INPUT_REACTOR,
							params: {
								guardrailEngineId: "guardrail-1",
								inputMapping: { prompt: "arg0" },
								directParameters: {
									labels: ["person", "email address"],
									thresholds: [0.5, 0.8],
									flags: [true, false],
									options: { mode: "strict" },
								},
							},
						},
					],
				},
			},
		});

		const directParameters = form.pipelines[0]?.input[0]?.directParameters;
		expect(
			directParameters?.map(({ key, type }) => ({ key, type })),
		).toEqual([
			{ key: "labels", type: "string-array" },
			{ key: "thresholds", type: "number-array" },
			{ key: "flags", type: "boolean-array" },
			{ key: "options", type: "json" },
		]);

		const serialized = JSON.parse(guardrailConfigToJson(form)).pipelines
			.askRoom.input[0].params.directParameters;
		expect(serialized).toEqual({
			labels: ["person", "email address"],
			thresholds: [0.5, 0.8],
			flags: [true, false],
			options: { mode: "strict" },
		});
	});

	test("rejects array direct parameters with the wrong item type", () => {
		const form = { pipelines: [createGuardrailPipeline("askRoom")] };
		const entry = form.pipelines[0]?.input[0];
		if (entry) {
			entry.guardrailEngineId = "guardrail-1";
			entry.directParameters = [
				{
					id: "labels",
					key: "labels",
					type: "string-array",
					value: '["person", 1]',
				},
			];
		}

		expect(validateGuardrailConfig(form)).toBe(
			'Direct parameter "labels" must contain only string values in pipeline "askRoom".',
		);
	});

	test("reports every problem with the rule and check it belongs to", () => {
		const first = createGuardrailPipeline("askRoom");
		const second = createGuardrailPipeline("askRoom");
		const issues = collectGuardrailConfigIssues(
			{ pipelines: [first, second] },
			{ methods: [ASK_ROOM], resultArgumentName: "result" },
		);
		const errors = issues.filter((issue) => issue.severity === "error");

		// both checks lack an engine, and the second rule repeats the method
		expect(errors).toHaveLength(3);
		expect(
			errors.filter((issue) =>
				/needs a guardrail engine/.test(issue.message),
			),
		).toHaveLength(2);
		expect(errors[0]).toMatchObject({
			pipelineId: first.id,
			phase: "input",
			entryId: first.input[0]?.id,
		});
		expect(
			errors.some(
				(issue) =>
					issue.pipelineId === second.id &&
					issue.message.includes("must be unique"),
			),
		).toBe(true);
	});

	test("warns about argument names the runtime cannot resolve", () => {
		const pipeline = createGuardrailPipeline("askRoom");
		const entry = pipeline.input[0];
		if (entry) {
			entry.guardrailEngineId = "guardrail-1";
			entry.inputMapping[0] = {
				id: "mapping-1",
				key: "prompt",
				args: "arg9",
			};
		}

		const warnings = collectGuardrailConfigIssues(
			{ pipelines: [pipeline] },
			{ methods: [ASK_ROOM] },
		).filter((issue) => issue.severity === "warning");

		expect(warnings).toHaveLength(1);
		expect(warnings[0]?.message).toBe(
			'"arg9" is not an argument of askRoom, so the guardrail receives nothing for "prompt".',
		);
		// a warning still leaves the configuration saveable
		expect(validateGuardrailConfig({ pipelines: [pipeline] })).toBe(true);
	});

	test("warns that a dot path is allowed but a plumbing argument is not text", () => {
		const pipeline = createGuardrailPipeline("askRoom");
		const entry = pipeline.input[0];
		if (entry) {
			entry.guardrailEngineId = "guardrail-1";
			entry.inputMapping = [
				{ id: "a", key: "prompt", args: "arg0.message" },
				{ id: "b", key: "room", args: "arg1" },
			];
		}

		const warnings = collectGuardrailConfigIssues(
			{ pipelines: [pipeline] },
			{ methods: [ASK_ROOM] },
		).filter((issue) => issue.severity === "warning");

		expect(warnings.map((issue) => issue.message)).toEqual([
			'"arg1" is the Room argument of askRoom, which is not text a guardrail can screen.',
		]);
	});

	test("accepts a response check reading result from a model response", () => {
		const pipeline = createGuardrailPipeline("askRoom");
		pipeline.input = [];
		pipeline.output = [outputCheck("result")];

		// the output reactor unwraps the response, so result is screenable
		expect(
			collectGuardrailConfigIssues(
				{ pipelines: [pipeline] },
				{ methods: [ASK_ROOM], resultArgumentName: "result" },
			),
		).toEqual([]);
	});

	test("warns when the intercepted call returns no model response", () => {
		const pipeline = createGuardrailPipeline("listBatches");
		pipeline.input = [];
		pipeline.output = [outputCheck("result")];

		const warnings = collectGuardrailConfigIssues(
			{ pipelines: [pipeline] },
			{
				methods: [ASK_ROOM, LIST_BATCHES],
				resultArgumentName: "result",
			},
		).filter((issue) => issue.severity === "warning");

		expect(warnings.map((issue) => issue.message)).toEqual([
			'listBatches returns BatchListResponse rather than a model response, so "prompt" receives that object rather than screenable content.',
		]);
	});

	test("warns when an input check reads a result that does not exist yet", () => {
		const pipeline = createGuardrailPipeline("askRoom");
		const entry = pipeline.input[0];
		if (entry) {
			entry.guardrailEngineId = "guardrail-1";
			entry.inputMapping[0] = { id: "a", key: "prompt", args: "result" };
		}

		const warnings = collectGuardrailConfigIssues(
			{ pipelines: [pipeline] },
			{ methods: [ASK_ROOM], resultArgumentName: "result" },
		).filter((issue) => issue.severity === "warning");

		expect(warnings[0]?.message).toBe(
			'"result" only exists after the model runs, so an input guardrail receives nothing for "prompt".',
		);
	});
});

describe("guardrail settings response extraction", () => {
	test("reads the interceptable methods and the result argument", () => {
		const response = {
			interceptableMethods: [
				{
					name: "askRoom",
					deprecated: false,
					returnType: "AskModelEngineResponse",
					returnsModelResponse: true,
					arguments: [
						{
							name: "arg0",
							position: 0,
							nameIsFromSource: false,
							type: "InputMessage",
							guardable: true,
						},
						{ notAnArgument: true },
					],
				},
				{ missingName: true },
			],
			resultArgumentName: "result",
		};

		const methods = extractInterceptableMethods(response);
		expect(methods).toHaveLength(1);
		expect(methods[0]?.arguments.map((argument) => argument.name)).toEqual([
			"arg0",
		]);
		expect(extractResultArgumentName(response)).toBe("result");
	});

	test("falls back when the backend reports no methods", () => {
		expect(extractInterceptableMethods({})).toEqual([]);
		expect(extractInterceptableMethods(null)).toEqual([]);
		expect(extractResultArgumentName({})).toBe("result");
	});

	test("reads whether the engine loads a pipeline file", () => {
		expect(
			extractGuardrailFileStatus({
				configured: false,
				pipelineFileName: null,
				fileExists: false,
			}).state,
		).toBe("not-enabled");
		expect(
			extractGuardrailFileStatus({
				configured: true,
				pipelineFileName: "pipeline.json",
				fileExists: false,
			}),
		).toMatchObject({
			state: "file-missing",
			pipelineFileName: "pipeline.json",
		});
		expect(
			extractGuardrailFileStatus({
				configured: true,
				pipelineFileName: "pipeline.json",
				fileExists: true,
				parseError: "Expected a ','",
				rawContent: "{",
			}),
		).toMatchObject({
			state: "loaded",
			parseError: "Expected a ','",
			rawContent: "{",
		});
	});

	test("treats an engine with no reported details as usable", () => {
		const details = extractGuardrailEngineDetails({
			guardrailEngines: {
				"guardrail-1": { name: "Policy guardrail" },
				"guardrail-2": {
					name: null,
					exists: false,
					userCanView: false,
				},
			},
		});

		expect(details["guardrail-1"]).toMatchObject({
			name: "Policy guardrail",
			exists: true,
			userCanView: true,
		});
		expect(details["guardrail-2"]).toMatchObject({
			name: null,
			exists: false,
			userCanView: false,
		});
	});
});

describe("guardrail argument options", () => {
	test("offers a known method's arguments, adding result for the output phase", () => {
		expect(
			guardrailArgumentOptions({
				method: "askRoom",
				phase: "input",
				methods: [ASK_ROOM],
			}).map((option) => option.name),
		).toEqual(["arg0", "arg1"]);

		expect(
			guardrailArgumentOptions({
				method: "askRoom",
				phase: "output",
				methods: [ASK_ROOM],
			}).map((option) => option.name),
		).toEqual(["result", "arg0", "arg1"]);
	});

	test("cannot name arguments for a wildcard or unreported method", () => {
		expect(
			guardrailArgumentOptions({
				method: "*",
				phase: "input",
				methods: [ASK_ROOM],
			}),
		).toEqual([]);
		expect(
			guardrailArgumentOptions({
				method: "somethingElse",
				phase: "input",
				methods: [ASK_ROOM],
			}),
		).toEqual([]);
		expect(
			guardrailArgumentOptions({
				method: "*",
				phase: "output",
				methods: [ASK_ROOM],
			}).map((option) => option.name),
		).toEqual(["result"]);
	});
});
