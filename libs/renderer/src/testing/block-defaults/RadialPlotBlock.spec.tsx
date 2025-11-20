import { expect, test } from "vitest";
import { VegaVisualizationBlock } from "../../components/block-defaults/vega-visualization-block/VegaVisualizationBlock";
import { render, screen } from "../utils/index";

const blocks = {
	"radial-plot-basic": {
		data: {
			variation: "radial-plot",
			specJson: JSON.stringify({
				$schema: "https://vega.github.io/schema/vega-lite/v5.json",
				title: "Radial Plot",
				width: 300,
				height: 300,
				data: {
					values: [12, 23, 47, 6, 52, 19],
				},
				layer: [
					{
						mark: {
							type: "arc",
							innerRadius: 20,
							stroke: "#fff",
						},
					},
					{
						mark: { type: "text", radiusOffset: 10 },
						encoding: {
							text: {
								field: "data",
								type: "quantitative",
							},
						},
					},
				],
				encoding: {
					theta: {
						field: "data",
						type: "quantitative",
						stack: true,
					},
					radius: {
						field: "data",
						scale: {
							type: "sqrt",
							zero: true,
							rangeMin: 20,
						},
					},
					color: {
						field: "data",
						type: "nominal",
						legend: null,
					},
				},
			}),
		},
		id: "radial-plot-basic",
		widget: "vega",
		slots: {},
		listeners: {},
	},

	"radial-plot-empty": {
		data: {
			variation: "radial-plot",
			specJson: "",
		},
		id: "radial-plot-empty",
		widget: "vega",
		slots: {},
		listeners: {},
	},

	"radial-plot-invalid-json": {
		data: {
			variation: "radial-plot",
			specJson: '{"invalid": json}',
		},
		id: "radial-plot-invalid-json",
		widget: "vega",
		slots: {},
		listeners: {},
	},

	"radial-plot-object-spec": {
		data: {
			variation: "radial-plot",
			specJson: {
				$schema: "https://vega.github.io/schema/vega-lite/v5.json",
				title: "Radial Plot",
				width: 250,
				height: 250,
				data: {
					values: [10, 20, 30, 40],
				},
				layer: [
					{
						mark: {
							type: "arc",
							innerRadius: 15,
							stroke: "#ccc",
						},
					},
				],
				encoding: {
					theta: {
						field: "data",
						type: "quantitative",
						stack: true,
					},
					radius: {
						field: "data",
						scale: {
							type: "sqrt",
							zero: true,
							rangeMin: 15,
						},
					},
					color: {
						field: "data",
						type: "nominal",
					},
				},
			},
		},
		id: "radial-plot-object-spec",
		widget: "vega",
		slots: {},
		listeners: {},
	},

	"radial-plot-custom-data": {
		data: {
			variation: "radial-plot",
			specJson: JSON.stringify({
				$schema: "https://vega.github.io/schema/vega-lite/v5.json",
				title: "Custom Radial Plot",
				width: 400,
				height: 400,
				data: {
					values: [
						{ category: "A", value: 28 },
						{ category: "B", value: 55 },
						{ category: "C", value: 43 },
						{ category: "D", value: 91 },
						{ category: "E", value: 81 },
					],
				},
				layer: [
					{
						mark: {
							type: "arc",
							innerRadius: 30,
							stroke: "#fff",
							strokeWidth: 2,
						},
					},
				],
				encoding: {
					theta: {
						field: "value",
						type: "quantitative",
						stack: true,
					},
					radius: {
						field: "value",
						scale: {
							type: "sqrt",
							zero: true,
							rangeMin: 30,
						},
					},
					color: {
						field: "category",
						type: "nominal",
					},
				},
			}),
		},
		id: "radial-plot-custom-data",
		widget: "vega",
		slots: {},
		listeners: {},
	},
};

const blockIds = {
	radialPlotBasic: "radial-plot-basic",
	radialPlotEmpty: "radial-plot-empty",
	radialPlotInvalidJson: "radial-plot-invalid-json",
	radialPlotObjectSpec: "radial-plot-object-spec",
	radialPlotCustomData: "radial-plot-custom-data",
};

describe("Radial Plot Block", () => {
	test("renders correctly with basic configuration", () => {
		const { container } = render(
			<VegaVisualizationBlock id={blockIds.radialPlotBasic} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			`[data-block='${blockIds.radialPlotBasic}']`,
		);
		expect(element).toBeInTheDocument();
	});

	test("renders chart when valid JSON spec is provided", () => {
		render(<VegaVisualizationBlock id={blockIds.radialPlotBasic} />, {
			blocks: blocks,
		});

		expect(
			screen.queryByText("Add JSON to render your visualization"),
		).not.toBeInTheDocument();
	});

	test("shows no data message when specJson is empty", () => {
		render(<VegaVisualizationBlock id={blockIds.radialPlotEmpty} />, {
			blocks: blocks,
		});

		expect(
			screen.getByText("Add JSON to render your visualization"),
		).toBeInTheDocument();
	});

	test("shows error message when JSON is invalid", () => {
		render(<VegaVisualizationBlock id={blockIds.radialPlotInvalidJson} />, {
			blocks: blocks,
		});

		expect(
			screen.getByText("There was an issue parsing your JSON."),
		).toBeInTheDocument();
	});

	test("renders correctly with object spec", () => {
		const { container } = render(
			<VegaVisualizationBlock id={blockIds.radialPlotObjectSpec} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			`[data-block='${blockIds.radialPlotObjectSpec}']`,
		);
		expect(element).toBeInTheDocument();
		expect(
			screen.queryByText("Add JSON to render your visualization"),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("There was an issue parsing your JSON."),
		).not.toBeInTheDocument();
	});

	test("handles custom data structure", () => {
		const { container } = render(
			<VegaVisualizationBlock id={blockIds.radialPlotCustomData} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			`[data-block='${blockIds.radialPlotCustomData}']`,
		);
		expect(element).toBeInTheDocument();
	});
});
