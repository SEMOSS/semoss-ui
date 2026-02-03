import { screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import { GridBlock } from "../../components/block-defaults/grid-block";
import * as useFrameHook from "../../hooks/useFrame";
import * as useFrameHeadersHook from "../../hooks/useFrameHeaders";
import { render } from "../utils";

const blocks = {
	grid: {
		data: {
			frame: {
				name: "testGridBlock",
			},
			option: {
				chartTitleSettings: {
					chartTitle: "Grid block test",
					fontSize: "16",
					fontColor: "#000000",
				},
			},
			columns: [
				{ name: "Column 1", width: undefined, selector: "col1" },
				{ name: "Column 2", width: undefined, selector: "col2" },
			],
			variation: "grid-block",
			style: {
				display: "flex",
				flexDirection: "row",
				padding: "",
				gap: "",
				flexWrap: "wrap",
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
		id: "grid",
		widget: "grid",
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

const mockData = {
	isLoading: false,
	data: {
		headers: ["Column 1", "Column 2"],
		values: [["row1col1"], ["row1col2"], ["row2col1"], ["row2col2"]],
	},
	count: 100,
	error: undefined,
	filter: undefined,
	unfilter: undefined,
};

describe("grid block", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders grid with data and columns", async () => {
		const useFrameSpy = vi.spyOn(useFrameHook, "useFrame");

		const useFrameHeadersSpy = vi.spyOn(
			useFrameHeadersHook,
			"useFrameHeaders",
		);

		useFrameSpy.mockReturnValue(mockData);
		useFrameHeadersSpy.mockReturnValue(mockFrameHeaders);

		const { container } = render(<GridBlock id={blocks.grid.id} />, {
			blocks: blocks,
		});

		await waitFor(() => {
			const element = container.querySelector("[data-block='grid']");
			expect(element).toBeInTheDocument();
			expect(screen.getByText("Column 1")).toBeInTheDocument();
			expect(screen.getByText("Column 2")).toBeInTheDocument();
			expect(screen.getByText("row1col1")).toBeInTheDocument();
			expect(screen.getByText("row2col1")).toBeInTheDocument();
		});
	});

	it("calls useFrame with correct selector format", () => {
		const useFrameSpy = vi.spyOn(useFrameHook, "useFrame");
		const useFrameHeadersSpy = vi.spyOn(
			useFrameHeadersHook,
			"useFrameHeaders",
		);

		useFrameSpy.mockReturnValue(mockData);
		useFrameHeadersSpy.mockReturnValue(mockFrameHeaders);

		render(<GridBlock id={blocks.grid.id} />, {
			blocks: blocks,
		});

		expect(useFrameSpy).toHaveBeenCalledWith("testGridBlock", {
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

		useFrameSpy.mockReturnValue(mockData);
		useFrameHeadersSpy.mockReturnValue(mockFrameHeaders);

		render(<GridBlock id={blocks.grid.id} />, {
			blocks: blocks,
		});

		await waitFor(() => {
			expect(screen.getByText("1–50 of 100")).toBeInTheDocument();
		});
	});
});
