import { screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import { GridDynamicFrameBlock } from "../../components/block-defaults/grid-dynamic-frame-block";
import * as useFrameHook from "../../hooks/useFrame";
import * as useFrameHeadersHook from "../../hooks/useFrameHeaders";
import { render } from "../utils";

const blocks = {
	gridDynamic: {
		data: {
			frame: {
				name: "testDynamicFrame",
			},
			columns: [
				{ name: "Column 1", width: undefined, selector: "col1" },
				{ name: "Column 2", width: undefined, selector: "col2" },
			],
			style: {
				display: "flex",
				flexDirection: "column",
				width: "450px",
				height: "350px",
			},
			view: {
				pagination: true,
			},
			contextMenu: {
				hideFilter: false,
				hideUnfilter: false,
			},
			show: true,
		},
		id: "gridDynamic",
		widget: "grid-dynamic-frame",
		slots: {},
		listeners: {},
	},
	gridDynamicHidden: {
		data: {
			frame: {
				name: "testDynamicFrame",
			},
			columns: [{ name: "Column 1", width: undefined, selector: "col1" }],
			style: {
				display: "flex",
				flexDirection: "column",
				width: "450px",
				height: "350px",
			},
			view: {
				pagination: true,
			},
			contextMenu: {
				hideFilter: false,
				hideUnfilter: false,
			},
			show: false,
		},
		id: "gridDynamicHidden",
		widget: "grid-dynamic-frame",
		slots: {},
		listeners: {},
	},
};

const mockFrameHeaders = {
	isLoading: false,
	data: {
		list: [
			{
				alias: "Column 1",
				header: "col1",
				dataType: "string",
				adtlType: "",
				qsName: null,
			},
			{
				alias: "Column 2",
				header: "col2",
				dataType: "string",
				adtlType: "",
				qsName: null,
			},
		],
	},
	error: undefined,
};

const mockFrameData = {
	isLoading: false,
	data: {
		headers: ["Column 1", "Column 2"],
		values: [
			["row1col1", "row1col2"],
			["row2col1", "row2col2"],
			["row3col1", "row3col2"],
		] as unknown[][],
	},
	count: 100,
	error: undefined,
	filter: vi.fn().mockResolvedValue(true),
	unfilter: vi.fn().mockResolvedValue(true),
};

describe("GridDynamicFrameBlock", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders grid with data and columns", async () => {
		const useFrameSpy = vi.spyOn(useFrameHook, "useFrame");
		const useFrameHeadersSpy = vi.spyOn(
			useFrameHeadersHook,
			"useFrameHeaders",
		);

		useFrameSpy.mockReturnValue(mockFrameData);
		useFrameHeadersSpy.mockReturnValue(mockFrameHeaders);

		const { container } = render(
			<GridDynamicFrameBlock id={blocks.gridDynamic.id} />,
			{
				blocks: blocks,
			},
		);

		await waitFor(() => {
			const element = container.querySelector(
				"[data-block='gridDynamic']",
			);
			expect(element).toBeInTheDocument();
			expect(screen.getByText("Column 1")).toBeInTheDocument();
			expect(screen.getByText("Column 2")).toBeInTheDocument();
			expect(screen.getByText("row1col1")).toBeInTheDocument();
		});
	});

	it("calls useFrame with correct selector format", () => {
		const useFrameSpy = vi.spyOn(useFrameHook, "useFrame");
		const useFrameHeadersSpy = vi.spyOn(
			useFrameHeadersHook,
			"useFrameHeaders",
		);

		useFrameSpy.mockReturnValue(mockFrameData);
		useFrameHeadersSpy.mockReturnValue(mockFrameHeaders);

		render(<GridDynamicFrameBlock id={blocks.gridDynamic.id} />, {
			blocks: blocks,
		});

		expect(useFrameSpy).toHaveBeenCalledWith("testDynamicFrame", {
			selector: "Select(col1, col2).as([Column 1, Column 2])",
			offset: 0,
			limit: 50,
			enableCount: true,
		});
	});

	it("renders pagination controls", async () => {
		const useFrameSpy = vi.spyOn(useFrameHook, "useFrame");
		const useFrameHeadersSpy = vi.spyOn(
			useFrameHeadersHook,
			"useFrameHeaders",
		);

		useFrameSpy.mockReturnValue(mockFrameData);
		useFrameHeadersSpy.mockReturnValue(mockFrameHeaders);

		render(<GridDynamicFrameBlock id={blocks.gridDynamic.id} />, {
			blocks: blocks,
		});

		await waitFor(() => {
			expect(screen.getByText("1–50 of 100")).toBeInTheDocument();
		});
	});

	it("handles empty data gracefully", () => {
		const useFrameSpy = vi.spyOn(useFrameHook, "useFrame");
		const useFrameHeadersSpy = vi.spyOn(
			useFrameHeadersHook,
			"useFrameHeaders",
		);

		const emptyFrameData = {
			...mockFrameData,
			data: { headers: [], values: [] as unknown[][] },
			count: 0,
		};

		useFrameSpy.mockReturnValue(emptyFrameData);
		useFrameHeadersSpy.mockReturnValue({
			...mockFrameHeaders,
			data: { list: [] },
		});

		const { container } = render(
			<GridDynamicFrameBlock id={blocks.gridDynamic.id} />,
			{
				blocks: blocks,
			},
		);

		expect(
			container.querySelector("[data-block='gridDynamic']"),
		).toBeInTheDocument();
	});

	it("does not render when show is false", () => {
		const useFrameSpy = vi.spyOn(useFrameHook, "useFrame");
		const useFrameHeadersSpy = vi.spyOn(
			useFrameHeadersHook,
			"useFrameHeaders",
		);

		useFrameSpy.mockReturnValue(mockFrameData);
		useFrameHeadersSpy.mockReturnValue(mockFrameHeaders);

		const { container } = render(
			<GridDynamicFrameBlock id={blocks.gridDynamicHidden.id} />,
			{
				blocks: blocks,
			},
		);

		const element = container.querySelector(
			"[data-block='gridDynamicHidden']",
		);
		expect(element).toBeInTheDocument();

		const gridElement = element?.querySelector(".MuiDataGrid-root");
		expect(gridElement).not.toBeInTheDocument();
	});
});
