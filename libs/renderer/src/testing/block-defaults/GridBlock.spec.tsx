import { screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import { GridBlock } from "../../components/block-defaults/grid-block";
import * as useFrameHook from "../../hooks/useFrame";
import { render } from "../utils";

const blocks = {
	grid: {
		data: {
			frame: {
				name: "Grid block column 1",
			},
			option: {
				chartTitleSettings: {
					chartTitle: "Grid block test",
					fontSize: "16",
					fontColor: "#000000",
				},
			},
			columns: [{ name: "Grid block column 1" }],
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

describe("grid block", () => {
	it("renders default grid", async () => {
		const useFrameSpy = vi.spyOn(useFrameHook, "useFrame");

		useFrameSpy.mockReturnValue({
			isLoading: false,
			data: {
				headers: ["Grid block column 1"],
				values: [["row 1"], ["row 2"]],
			},
			count: 2,
			error: undefined,
			filter: undefined,
			unfilter: undefined,
		});
		const { container } = render(<GridBlock id={blocks.grid.id} />, {
			blocks: blocks,
		});

		await waitFor(() => {
			const element = container.querySelector("[data-block='grid']");
			expect(element).toBeInTheDocument();
			expect(screen.getByText("Grid block test")).toBeInTheDocument();
			expect(screen.getByText("Grid block column 1")).toBeInTheDocument();
			expect(screen.getByText("row 1")).toBeInTheDocument();
			expect(screen.getByText("row 2")).toBeInTheDocument();
		});
	});
});
