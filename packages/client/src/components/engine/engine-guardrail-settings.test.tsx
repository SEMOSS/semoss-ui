import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { EngineGuardrailSettings } from "./engine-guardrail-settings";

class ResizeObserverMock {
	observe() {}
	unobserve() {}
	disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
HTMLElement.prototype.scrollIntoView = vi.fn();

const INPUT_REACTOR = "prerna.reactor.interceptor.GenericGuardrailInputReactor";

const INTERCEPTABLE_METHODS = vi.hoisted(() => [
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
			{
				name: "arg1",
				position: 1,
				nameIsFromSource: false,
				type: "Room",
				guardable: false,
			},
		],
	},
	{
		name: "ask",
		deprecated: true,
		returnType: "AskModelEngineResponse",
		returnsModelResponse: true,
		arguments: [
			{
				name: "arg0",
				position: 0,
				nameIsFromSource: false,
				type: "String",
				guardable: true,
			},
		],
	},
]);

/** Builds a GetModelGuardrailConfig response with the given overrides. */
const buildConfig = (overrides: Record<string, unknown> = {}) => ({
	engineId: "model-1",
	configured: true,
	pipelineFileName: "pipeline.json",
	fileExists: true,
	parseError: null,
	rawContent: null,
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
				{
					reactorClass: INPUT_REACTOR,
					params: {
						guardrailEngineId: "guardrail-2",
						blockOnGuardrailFailure: true,
						inputMapping: { prompt: "arg0" },
					},
				},
			],
		},
	},
	guardrailEngines: {
		"guardrail-1": {
			name: "Policy guardrail",
			exists: true,
			type: "GUARDRAIL",
			subtype: "policy",
			userCanView: true,
		},
		"guardrail-2": {
			name: "PII guardrail",
			exists: true,
			type: "GUARDRAIL",
			subtype: "gliner",
			userCanView: true,
		},
	},
	allowedReactorClasses: { input: [], output: [] },
	interceptableMethods: INTERCEPTABLE_METHODS,
	resultArgumentName: "result",
	...overrides,
});

const CONFIG = vi.hoisted(() => ({ current: null as unknown }));

vi.mock("@semoss/sdk/react", () => ({
	usePixel: (pixel: string) => {
		if (pixel.startsWith("GetModelGuardrailConfig")) {
			return {
				status: "SUCCESS",
				data: CONFIG.current,
				error: undefined,
				refresh: () => {},
			};
		}
		if (pixel.startsWith("GetEngineUsage")) {
			return {
				status: "SUCCESS",
				data: [
					{
						type: "guardrail",
						parameters: [
							{
								name: "prompt",
								type: "String",
								description: "The text to evaluate.",
								required: true,
							},
							{
								name: "labels",
								type: "List<String>",
								description: "Entity labels to detect.",
								required: true,
							},
							{
								name: "threshold",
								type: "Double",
								description: "Detection threshold.",
								required: false,
							},
						],
					},
				],
				error: undefined,
				refresh: () => {},
			};
		}
		return {
			status: "SUCCESS",
			data: [],
			error: undefined,
			refresh: () => {},
		};
	},
	// the shared engine select pages through the guardrail catalog itself
	useIteratorPixel: () => ({
		data: [
			{
				engine_id: "guardrail-1",
				engine_name: "Policy guardrail",
				engine_type: "GUARDRAIL",
				engine_subtype: "policy",
			},
			{
				engine_id: "guardrail-2",
				engine_name: "PII guardrail",
				engine_type: "GUARDRAIL",
				engine_subtype: "gliner",
			},
		],
		isLoading: false,
		hasMore: false,
		next: () => {},
	}),
}));

vi.mock("@/hooks", () => ({
	useRootStore: () => ({
		configStore: { runPixel: async () => ({ errors: [] }) },
	}),
}));

/** Renders the editor against a response built from the given overrides. */
const renderSettings = (overrides: Record<string, unknown> = {}) => {
	CONFIG.current = buildConfig(overrides);
	return render(
		<EngineGuardrailSettings engineId="model-1" permission="OWNER" />,
	);
};

test("separates request and response checks into tabs", async () => {
	renderSettings();

	const requestTab = await screen.findByRole("tab", { name: /Request/ });
	const responseTab = screen.getByRole("tab", { name: /Response/ });
	expect(requestTab).toHaveAttribute("data-state", "active");
	expect(requestTab).toHaveTextContent("2");
	expect(responseTab).toHaveTextContent("0");

	// the add control follows the list, so a new check lands at the bottom
	const requestPanel = screen.getByTestId(
		"engine-guardrail-settings--pipeline-0",
	);
	const addRequest = within(requestPanel).getByTestId(
		"engine-guardrail-settings--pipeline-0-input-add",
	);
	const lastCheck = within(requestPanel).getByTestId(
		"engine-guardrail-settings--pipeline-0-input-entry-1",
	);
	expect(
		lastCheck.compareDocumentPosition(addRequest) &
			Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();

	fireEvent.mouseDown(responseTab);
	expect(
		screen.getByText(
			"Nothing screens the response before it reaches the caller.",
		),
	).toBeInTheDocument();
});

test("selects the rule to edit from a top level selector", async () => {
	renderSettings({
		pipelines: {
			askRoom: {
				input: [
					{
						reactorClass: INPUT_REACTOR,
						params: {
							guardrailEngineId: "guardrail-1",
							blockOnGuardrailFailure: true,
							inputMapping: { prompt: "arg0" },
						},
					},
				],
			},
			"*": {
				input: [
					{
						reactorClass: INPUT_REACTOR,
						params: {
							guardrailEngineId: "guardrail-2",
							blockOnGuardrailFailure: true,
							inputMapping: { prompt: "arg0" },
						},
					},
				],
			},
		},
	});

	const ruleSelect = await screen.findByTestId(
		"engine-guardrail-settings--rule-select",
	);
	expect(ruleSelect).toHaveTextContent("askRoom");
	// the rail is gone, so the full width belongs to the selected rule
	expect(
		screen.queryByRole("navigation", { name: "Guardrail rules" }),
	).not.toBeInTheDocument();

	fireEvent.click(ruleSelect);
	fireEvent.click(await screen.findByRole("option", { name: /^\* / }));
	expect(
		screen.getByTestId("engine-guardrail-settings--pipeline-1-method"),
	).toHaveTextContent("*");
});

test("keeps the selected phase when switching rules", async () => {
	renderSettings({
		pipelines: {
			askRoom: {
				output: [
					{
						reactorClass:
							"prerna.reactor.interceptor.GenericGuardrailOutputReactor",
						params: {
							guardrailEngineId: "guardrail-1",
							blockOnGuardrailFailure: true,
							inputMapping: { prompt: "result" },
						},
					},
				],
			},
			"*": {
				input: [
					{
						reactorClass: INPUT_REACTOR,
						params: {
							guardrailEngineId: "guardrail-2",
							blockOnGuardrailFailure: true,
							inputMapping: { prompt: "arg0" },
						},
					},
				],
			},
		},
	});

	// askRoom has only response checks, so the editor opens on Response
	expect(
		await screen.findByRole("tab", { name: /Response/ }),
	).toHaveAttribute("data-state", "active");

	fireEvent.click(
		screen.getByTestId("engine-guardrail-settings--rule-select"),
	);
	fireEvent.click(await screen.findByRole("option", { name: /^\* / }));

	// the phase survives the switch rather than snapping back to Request
	expect(screen.getByRole("tab", { name: /Response/ })).toHaveAttribute(
		"data-state",
		"active",
	);
});

test("confirms before removing a rule", async () => {
	renderSettings();

	fireEvent.click(
		await screen.findByTestId(
			"engine-guardrail-settings--remove-pipeline-btn",
		),
	);
	expect(await screen.findByText("Remove this rule?")).toBeInTheDocument();
	expect(
		screen.getByText(/2 checks stop screening askRoom/),
	).toBeInTheDocument();

	fireEvent.click(
		screen.getByTestId(
			"engine-guardrail-settings--remove-pipeline-confirm",
		),
	);
	expect(
		screen.getByTestId("engine-guardrail-settings--empty-state"),
	).toBeInTheDocument();
});

test("switches to the rule that was just added", async () => {
	renderSettings();

	const ruleSelect = await screen.findByTestId(
		"engine-guardrail-settings--rule-select",
	);
	expect(ruleSelect).toHaveTextContent("askRoom");

	fireEvent.click(
		screen.getByTestId("engine-guardrail-settings--add-pipeline-btn"),
	);

	// the new rule becomes the one being edited, on a call nothing else covers
	expect(ruleSelect).toHaveTextContent("*");
	expect(
		screen.getByTestId("engine-guardrail-settings--pipeline-1-method"),
	).toHaveTextContent("*");
	expect(
		screen.queryByTestId("engine-guardrail-settings--pipeline-0-method"),
	).not.toBeInTheDocument();
	// it still needs an engine picked, but it does not arrive as a duplicate
	expect(
		screen.getByTestId("engine-guardrail-settings--errors"),
	).not.toHaveTextContent("used more than once");
});

test("cannot claim a call another rule already covers", async () => {
	renderSettings({
		pipelines: {
			askRoom: {
				input: [
					{
						reactorClass: INPUT_REACTOR,
						params: {
							guardrailEngineId: "guardrail-1",
							blockOnGuardrailFailure: true,
							inputMapping: { prompt: "arg0" },
						},
					},
				],
			},
			"*": {
				input: [
					{
						reactorClass: INPUT_REACTOR,
						params: {
							guardrailEngineId: "guardrail-2",
							blockOnGuardrailFailure: true,
							inputMapping: { prompt: "arg0" },
						},
					},
				],
			},
		},
	});

	// editing askRoom, so Every call belongs to the other rule
	fireEvent.click(
		await screen.findByTestId(
			"engine-guardrail-settings--pipeline-0-method",
		),
	);
	const everyCall = await screen.findByRole("option", {
		name: /already covered/,
	});
	expect(everyCall).toHaveAttribute("data-disabled");
	expect(everyCall).toHaveTextContent("*");
	// its own call stays selectable
	expect(
		screen.getByRole("option", { name: /^askRoom/ }),
	).not.toHaveAttribute("data-disabled");
});

test("offers the engine's reported methods instead of free text", async () => {
	renderSettings();

	const methodPicker = await screen.findByTestId(
		"engine-guardrail-settings--pipeline-0-method",
	);
	expect(methodPicker).toHaveTextContent("askRoom");

	fireEvent.click(methodPicker);
	expect(
		await screen.findByRole("option", { name: /every call with no rule/ }),
	).toBeInTheDocument();
	const deprecated = screen.getByRole("option", { name: /^ask deprecated/ });
	expect(deprecated).toHaveTextContent("deprecated");
	expect(
		screen.getByRole("option", { name: /Another method/ }),
	).toBeInTheDocument();
	fireEvent.keyDown(methodPicker, { key: "Escape" });
});

test("offers the selected method's arguments for a mapping row", async () => {
	renderSettings();

	const argumentPicker = await screen.findByTestId(
		"engine-guardrail-settings--pipeline-0-input-entry-0-mapping-0-args",
	);
	expect(argumentPicker).toHaveTextContent("arg0");

	fireEvent.click(argumentPicker);
	const plumbing = await screen.findByRole("option", { name: /arg1/ });
	expect(plumbing).toHaveTextContent("not screenable text");
	expect(screen.getByRole("option", { name: /arg0/ })).toHaveTextContent(
		"InputMessage",
	);
	fireEvent.keyDown(argumentPicker, { key: "Escape" });
});

test("exposes every failure option and reveals the block settings", async () => {
	renderSettings();

	expect(
		await screen.findByRole("tab", { name: /Request/ }),
	).toBeInTheDocument();
	expect(screen.getAllByLabelText(/^Block/)).toHaveLength(2);
	expect(screen.getAllByLabelText(/^Mask and continue/)).toHaveLength(2);
	expect(screen.getAllByLabelText(/^Return guardrail message/)).toHaveLength(
		2,
	);
	expect(
		screen.getAllByLabelText(/^Return guardrail message/)[0],
	).toBeChecked();

	const responseEntry = screen.getByTestId(
		"engine-guardrail-settings--pipeline-0-input-entry-0",
	);
	expect(
		within(responseEntry).queryByText("Close room after block"),
	).not.toBeInTheDocument();

	fireEvent.click(within(responseEntry).getByLabelText(/^Block/));
	expect(
		within(responseEntry).getByText("Close room after block"),
	).toBeInTheDocument();
	expect(
		within(responseEntry).getByLabelText("Custom block message"),
	).toBeInTheDocument();
});

test("shows the parameter wiring without an extra disclosure step", async () => {
	renderSettings();

	const responseEntry = await screen.findByTestId(
		"engine-guardrail-settings--pipeline-0-input-entry-0",
	);
	expect(
		within(responseEntry).queryByText("Advanced parameter wiring"),
	).not.toBeInTheDocument();
	expect(within(responseEntry).getByText("Inputs")).toBeInTheDocument();
	expect(within(responseEntry).getByText("Fixed values")).toBeInTheDocument();

	const deleteMapping = within(responseEntry).getByRole("button", {
		name: "Delete mapping 1",
	});
	expect(deleteMapping).toBeDisabled();

	const addFixedValue = within(responseEntry).getByRole("combobox", {
		name: "Add direct parameter",
	});
	fireEvent.click(addFixedValue);
	const mappedPrompt = await screen.findByRole("option", { name: /prompt/ });
	expect(mappedPrompt).toHaveAttribute("data-disabled");
	expect(mappedPrompt).toHaveTextContent("Mapped");
	fireEvent.click(await screen.findByRole("option", { name: /labels/ }));
	expect(responseEntry).toHaveTextContent("Entity labels to detect.");
	expect(responseEntry).toHaveTextContent("String array");
});

test("reorders checks within a phase", async () => {
	renderSettings();

	fireEvent.click(
		await screen.findByTestId(
			"engine-guardrail-settings--pipeline-0-input-entry-0-move-down",
		),
	);
	expect(
		screen.getByTestId(
			"engine-guardrail-settings--pipeline-0-input-entry-0",
		),
	).toHaveTextContent("PII guardrail");
});

test("reports that the engine loads no pipeline file", async () => {
	renderSettings({
		configured: false,
		pipelineFileName: null,
		fileExists: false,
		pipelines: {},
	});

	expect(
		await screen.findByTestId("engine-guardrail-settings--not-enabled"),
	).toHaveTextContent("Guardrails are not enabled yet");
});

test("keeps the unreadable stored file available after a parse failure", async () => {
	renderSettings({
		parseError: "Expected a ',' or '}'",
		rawContent: '{"pipelines": {',
		pipelines: {},
	});

	const alert = await screen.findByTestId(
		"engine-guardrail-settings--parse-error",
	);
	expect(alert).toHaveTextContent("Expected a ',' or '}'");
	// the empty editor is explained by the parse failure, not a missing rule set
	expect(
		screen.queryByTestId("engine-guardrail-settings--no-rules"),
	).not.toBeInTheDocument();
	fireEvent.click(
		screen.getByTestId("engine-guardrail-settings--raw-content-toggle"),
	);
	expect(
		screen.getByTestId("engine-guardrail-settings--raw-content"),
	).toHaveTextContent('{"pipelines": {');
});

test("flags a guardrail engine that no longer exists", async () => {
	renderSettings({
		guardrailEngines: {
			"guardrail-1": {
				name: "Policy guardrail",
				exists: false,
				type: null,
				subtype: null,
				userCanView: false,
			},
			"guardrail-2": {
				name: "PII guardrail",
				exists: true,
				type: "GUARDRAIL",
				subtype: "detoxify",
				userCanView: true,
			},
		},
	});

	expect(
		await screen.findByTestId(
			"engine-guardrail-settings--pipeline-0-input-entry-0-engine-missing",
		),
	).toHaveTextContent("This guardrail engine no longer exists");
});

test("lists every problem at once and navigates to the check that owns it", async () => {
	renderSettings({
		pipelines: {
			askRoom: {
				input: [
					{
						reactorClass: INPUT_REACTOR,
						params: {
							guardrailEngineId: "",
							blockOnGuardrailFailure: true,
							inputMapping: { prompt: "arg9" },
						},
					},
				],
			},
			"*": {
				input: [
					{
						reactorClass: INPUT_REACTOR,
						params: {
							guardrailEngineId: "",
							blockOnGuardrailFailure: true,
							inputMapping: { prompt: "arg0" },
						},
					},
				],
			},
		},
	});

	const errors = await screen.findByTestId(
		"engine-guardrail-settings--errors",
	);
	expect(errors).toHaveTextContent("2 problems block saving");
	expect(
		within(errors).getAllByText(/needs a guardrail engine/),
	).toHaveLength(2);

	const warnings = screen.getByTestId("engine-guardrail-settings--warnings");
	expect(warnings).toHaveTextContent('"arg9" is not an argument of askRoom');

	// selecting a problem opens the rule it belongs to
	fireEvent.click(
		within(warnings).getByRole("button", {
			name: /"arg9" is not an argument of askRoom/,
		}),
	);
	expect(
		screen.getByTestId("engine-guardrail-settings--pipeline-0-method"),
	).toHaveTextContent("askRoom");
});

test("accepts a response check reading result and serializes the output reactor", async () => {
	renderSettings({
		pipelines: {
			askRoom: {
				output: [
					{
						reactorClass:
							"prerna.reactor.interceptor.GenericGuardrailOutputReactor",
						params: {
							guardrailEngineId: "guardrail-1",
							blockOnGuardrailFailure: true,
							inputMapping: { prompt: "result" },
						},
					},
				],
			},
		},
	});

	expect(
		await screen.findByRole("tab", { name: /Request/ }),
	).toBeInTheDocument();
	// askRoom returns a model response, so reading result needs no warning
	expect(
		screen.queryByTestId("engine-guardrail-settings--warnings"),
	).not.toBeInTheDocument();

	fireEvent.mouseDown(screen.getByRole("tab", { name: "JSON" }));
	expect(
		screen.getByTestId("engine-guardrail-settings--config-json"),
	).toHaveTextContent("GenericGuardrailOutputReactor");
});

test("warns when the intercepted call returns no model response", async () => {
	renderSettings({
		pipelines: {
			listBatches: {
				output: [
					{
						reactorClass:
							"prerna.reactor.interceptor.GenericGuardrailOutputReactor",
						params: {
							guardrailEngineId: "guardrail-1",
							blockOnGuardrailFailure: true,
							inputMapping: { prompt: "result" },
						},
					},
				],
			},
		},
		interceptableMethods: [
			...INTERCEPTABLE_METHODS,
			{
				name: "listBatches",
				deprecated: false,
				returnType: "BatchListResponse",
				returnsModelResponse: false,
				arguments: [],
			},
		],
	});

	expect(
		await screen.findByTestId("engine-guardrail-settings--warnings"),
	).toHaveTextContent(
		"listBatches returns BatchListResponse rather than a model response",
	);
});

test("lets a viewer inspect the wiring without editing it", async () => {
	CONFIG.current = buildConfig();
	render(
		<EngineGuardrailSettings engineId="model-1" permission="READ_ONLY" />,
	);

	const responseEntry = await screen.findByTestId(
		"engine-guardrail-settings--pipeline-0-input-entry-0",
	);
	expect(within(responseEntry).getByText("Inputs")).toBeInTheDocument();
	expect(
		screen.queryByTestId("engine-guardrail-settings--save-btn"),
	).not.toBeInTheDocument();
	expect(
		screen.queryByTestId("engine-guardrail-settings--add-pipeline-btn"),
	).not.toBeInTheDocument();
});
