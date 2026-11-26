import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CustomizeValueLabels } from "./bar-chart/CustomizeValueLabels";
import { VisualizationStyles } from "./bar-chart/VisualizationStyles";
import { CustomizeSymbol } from "./Gantt/CustomizeSymbol";
import { LineValueLabels } from "./line-chart/LineValueLabel";

const mocks = vi.hoisted(() => ({
	data: {
		option: {
			series: [] as {
				type: string;
				label?: object;
				barWidth?: number;
			}[],
			customSettings: { gantttools: {} },
		},
	},
	setData: vi.fn(),
}));

vi.mock("@/hooks/useBlockSettings", () => ({
	useBlockSettings: () => mocks,
}));

vi.mock("../../../shared/ColorPickerSettings", () => ({
	ColorPickerSettings: () => null,
}));

beforeEach(() => {
	mocks.setData.mockReset();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

test.each([
	{ type: "bar", Component: CustomizeValueLabels },
	{ type: "line", Component: LineValueLabels },
])(
	"updates value labels for the selected $type series",
	async ({ type, Component }) => {
		mocks.data.option = {
			series: [
				{ type, label: { show: false } },
				{ type, label: { show: false } },
			],
			customSettings: { gantttools: {} },
		};

		const chartId = "chart";
		render(
			<Component
				id={chartId}
				path="option"
				option={mocks.data.option}
				chartType={type}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Series 2" }));
		fireEvent.click(
			screen.getByRole("switch", { name: "Show Value Labels" }),
		);

		await waitFor(() => {
			expect(mocks.setData).toHaveBeenCalledWith(
				"option",
				expect.objectContaining({
					series: [
						expect.objectContaining({
							label: expect.objectContaining({ show: false }),
						}),
						expect.objectContaining({
							label: expect.objectContaining({ show: true }),
						}),
					],
				}),
			);
		});
	},
);

test("changes the selected bar series width with the keyboard", async () => {
	mocks.data.option = {
		series: [
			{ type: "bar", barWidth: 10 },
			{ type: "bar", barWidth: 12 },
		],
		customSettings: { gantttools: {} },
	};
	const chartId = "chart";
	render(
		<VisualizationStyles
			id={chartId}
			path="option"
			option={mocks.data.option}
			chartType="bar"
			updateChart={vi.fn()}
		/>,
	);

	fireEvent.click(screen.getByRole("button", { name: "Series 2" }));
	fireEvent.keyDown(screen.getByRole("slider"), {
		key: "ArrowRight",
	});

	await waitFor(() => {
		expect(mocks.setData).toHaveBeenCalledWith(
			"option",
			expect.objectContaining({
				series: [
					expect.objectContaining({ barWidth: 10 }),
					expect.objectContaining({ barWidth: 13 }),
				],
			}),
		);
	});
});

test("enables a Gantt symbol color and saves it", async () => {
	mocks.data.option = {
		series: [],
		customSettings: { gantttools: {} },
	};
	const chartId = "chart";
	render(<CustomizeSymbol id={chartId} path="option" />);

	fireEvent.click(
		screen.getByRole("switch", { name: "Select Symbol Color" }),
	);
	fireEvent.change(screen.getByDisplayValue("#000000"), {
		target: { value: "#123456" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Execute" }));

	await waitFor(() => {
		expect(mocks.setData).toHaveBeenCalledWith(
			"option",
			expect.objectContaining({
				customSettings: {
					gantttools: {
						customizeSymbol: [
							expect.objectContaining({
								symbolColorSelected: true,
								symbolColor: "#123456",
							}),
						],
					},
				},
			}),
		);
	});
});
