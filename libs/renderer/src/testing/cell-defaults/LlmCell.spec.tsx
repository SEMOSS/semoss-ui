import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	LLMCell,
	type LLMCellDef,
	type LLMModelEntry,
} from "../../components/cell-defaults/llm-cell/llm-cell";
import { type CellState, type Registry, StateStore } from "../../store";

vi.mock("../../hooks/useBlocksPixel", () => ({
	useBlocksPixel: () => ({
		status: "INITIAL",
		data: undefined,
		refresh: vi.fn(),
	}),
}));

vi.mock("@semoss/shared", () => ({
	EngineSubtypeIcon: ({ alt }: { alt?: string }) => (
		<span data-testid="engine-icon">{alt ?? ""}</span>
	),
	EntityHeader: ({
		name,
		id,
		actions,
	}: {
		name?: string;
		id?: string;
		actions?: React.ReactNode;
	}) => (
		<div data-testid="entity-header">
			<span>{name}</span>
			<span>{id}</span>
			{actions}
		</div>
	),
}));

const runPixelMock = vi.fn(() =>
	Promise.resolve({
		pixelReturn: [
			{
				output: [
					{
						engine_id: "model-a",
						engine_name: "Model A",
						engine_type: "MODEL",
						engine_subtype: "OPEN_AI",
					},
					{
						engine_id: "model-b",
						engine_name: "Model B",
						engine_type: "MODEL",
						engine_subtype: "OPEN_AI",
					},
				],
			},
		],
	}),
);

vi.mock("@semoss/sdk/react", () => ({
	runPixel: (...args: unknown[]) => runPixelMock(...(args as [])),
}));

interface Overrides {
	command?: string;
	models?: LLMModelEntry[];
	operation?: string[];
	output?: unknown;
}

const createStoreWithCell = (overrides: Overrides = {}) => {
	const { command = "", models = [], operation, output } = overrides;

	const store = new StateStore({
		mode: "interactive",
		insightId: "test-insight",
		state: {
			queries: {
				q1: {
					id: "q1",
					cells: [
						{
							id: "0",
							widget: "llm",
							parameters: {
								command,
								models,
							},
						},
					],
				},
			},
			variables: {
				q1: { to: "q1", type: "query" },
				"q1--0": { type: "cell", to: "q1", cellId: "0" },
			},
			executionOrder: ["q1"],
			version: "1.0.0-alpha.17",
			blocks: {},
		},
		cellRegistry: {
			llm: {
				name: "LLM",
				widget: "llm",
				view: () => null,
				parameters: {
					command: "",
					models: [],
				},
				toPixel: () => "",
			},
		},
	});

	const cell = store.notebooks.q1.cells["0"] as CellState<LLMCellDef>;

	if (operation) {
		cell._update("operation", operation);
	}
	if (output !== undefined) {
		cell._update("output", output);
	}

	return { store, cell };
};

const renderCell = (overrides?: Overrides, isExpanded = true) => {
	const { store, cell } = createStoreWithCell(overrides);
	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<LLMCell cell={cell} isExpanded={isExpanded} />
		</Blocks>,
	);
	return { ...result, store, cell };
};

const sampleModel: LLMModelEntry = {
	id: "model-a",
	name: "Model A",
	engineType: "MODEL",
	engineSubtype: "OPEN_AI",
	params: "",
};

describe("LLMCell", () => {
	it("renders prompt textarea and Add model button and fetches engines on mount", () => {
		runPixelMock.mockClear();
		const { container } = renderCell();

		expect(container).toBeDefined();
		expect(screen.getByText("Prompt")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /add model/i }),
		).toBeInTheDocument();
		expect(runPixelMock).toHaveBeenCalledTimes(1);
		expect(runPixelMock).toHaveBeenCalledWith(
			'MyEngines(engineTypes=["MODEL"])',
		);
	});

	it("shows the empty state when no models are selected", () => {
		renderCell();
		expect(screen.getByText(/no models selected/i)).toBeInTheDocument();
	});

	it("renders the provided command value in the prompt textarea", () => {
		renderCell({ command: "hello world" });
		const textarea = screen.getByPlaceholderText(
			/enter the prompt to send to each selected model/i,
		) as HTMLTextAreaElement;
		expect(textarea.value).toBe("hello world");
	});

	it("renders a model card with params editor when a model is selected", () => {
		renderCell({ models: [sampleModel] });

		expect(screen.getByText("Model A")).toBeInTheDocument();
		expect(screen.getByText("Params (JSON)")).toBeInTheDocument();
		// Comparison section is gated on cell.isExecuted
		expect(screen.queryByText("Comparison")).not.toBeInTheDocument();
	});

	it("renders the comparison output and token counts after execution", () => {
		renderCell({
			models: [sampleModel],
			operation: ["LLM"],
			output: [
				{
					response: "hello back",
					numberOfTokensInPrompt: 5,
					numberOfTokensInResponse: 7,
				},
			],
		});

		expect(screen.getByText("Comparison")).toBeInTheDocument();
		expect(screen.getByText("hello back")).toBeInTheDocument();
		expect(screen.getByText(/prompt:/i)).toBeInTheDocument();
		expect(screen.getByText(/response:/i)).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
		expect(screen.getByText("7")).toBeInTheDocument();
	});

	it("shows the error indicator when the operation includes ERROR", () => {
		renderCell({
			models: [sampleModel],
			operation: ["ERROR"],
			output: ["boom"],
		});

		expect(
			screen.getByText(/one or more models returned an error/i),
		).toBeInTheDocument();
	});
});
