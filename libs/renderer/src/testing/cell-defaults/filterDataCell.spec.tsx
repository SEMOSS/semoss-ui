import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom";
import { usePixel } from "@semoss/sdk/react";
import { DefaultBlocks } from "../../components/block-defaults";
import { Blocks } from "../../components/blocks";
import { FilterDataCell } from "../../components/cell-defaults/filter-data-cell";
import * as hooks from "../../hooks";
import { StateStore } from "../../store";

// Radix Select uses pointer capture APIs not available in JSDOM
beforeAll(() => {
	HTMLElement.prototype.hasPointerCapture = vi.fn();
	HTMLElement.prototype.setPointerCapture = vi.fn();
	HTMLElement.prototype.releasePointerCapture = vi.fn();
	Element.prototype.scrollIntoView = vi.fn();
});

vi.mock("@semoss/sdk/react", () => ({
	usePixel: vi.fn(),
}));

const query = {
	mcp_driver: {
		id: "mcp_driver",
		cells: [
			{
				id: "2",
				widget: "filter-data",
				parameters: {
					frameName: "",
					filterQuery: "",
					targetCell: {
						id: "1",
						frameVariableName: "",
					},
				},
			},
		],
	},
};

describe("Filter Data Cell", () => {
	const renderWithBlocks = (
		ui: React.ReactElement,
		options?: {
			runSideEffectImpl?: (pixel: string) => Promise<unknown>;
		},
	) => {
		// Mocks a state store
		const store = new StateStore({
			mode: "interactive",
			insightId: "new",
			state: {
				executionOrder: [],
				queries: {},
				variables: {},
				version: "",
				blocks: {},
			},
			cellRegistry: {},
		});
		//Whenever we call getFrames() through FilterDataCell, it will return fake FRAMEs
		const defaultRunSideEffectImpl = async (pixel: string) => {
			if (pixel === "GetFrames();") {
				return {
					pixelReturn: [{ output: ["FRAME_1", "FRAME_2"] }],
				};
			}

			return {
				pixelReturn: [{ output: {} }],
			};
		};
		//replace the store's runSideEffect function with our mock one
		const runSideEffectMock = vi.fn(
			options?.runSideEffectImpl ?? defaultRunSideEffectImpl,
		);

		store.runSideEffect = runSideEffectMock as never;

		//dispatch will be empty mock function
		store.dispatch = vi.fn() as never;

		return {
			store,
			runSideEffectMock,
			...render(
				<Blocks state={store} registry={DefaultBlocks}>
					{ui}
				</Blocks>,
			),
		};
	};

	test("renders frame selector and guidance text when target frame does not exist", () => {
		vi.mocked(usePixel).mockReturnValue({ status: "SUCCESS" } as never); // Any usage of usePixel will return SUCCESS as status

		const cell = {
			id: "2",
			isLoading: false,
			query: query.mcp_driver,
			parameters: query.mcp_driver.cells[0].parameters,
		}; // sets up an empty Filter Data Cell prop

		renderWithBlocks(
			<FilterDataCell cell={cell as never} isExpanded={true} />,
		);

		expect(screen.getByRole("combobox")).toBeInTheDocument(); //Shows accurate selector
		expect(
			screen.getByText(
				"Run Cell 1 to define the target frame variable before applying filter.",
			),
		).toBeInTheDocument(); //Default prompt
	});

	test("loads frame options and updates selected frame", async () => {
		vi.mocked(usePixel).mockReturnValue({ status: "SUCCESS" } as never);
		const user = userEvent.setup();

		const cell = {
			id: "2",
			isLoading: false,
			query: query.mcp_driver,
			parameters: {
				...query.mcp_driver.cells[0].parameters,
				targetCell: {
					id: "",
					frameVariableName: "",
				},
			},
		};

		const { runSideEffectMock } = renderWithBlocks(
			<FilterDataCell cell={cell as never} isExpanded={true} />,
		);

		//Wait until runSidEffect which we replaced with a mock one in the state to run
		await waitFor(() => {
			expect(runSideEffectMock).toHaveBeenCalledWith("GetFrames();");
		});

		//Mocks user expanding the combobox to have FRAME_1
		const frameInput = screen.getByRole("combobox");

		await user.click(frameInput);
		const frame1Option = await screen.findByText("FRAME_1");
		await user.click(frame1Option);

		await waitFor(() => {
			expect(frameInput).toHaveTextContent("FRAME_1");
		});
	});

	test("shows Select Header, Select Operator, and Select Data controls when target frame exists", async () => {
		vi.mocked(usePixel).mockReturnValue({ status: "SUCCESS" } as never);
		//Additional Reactors mocks for headers and Data inputs
		const runSideEffectMock = vi.fn(async (pixel: string) => {
			if (pixel === "GetFrames();") {
				return {
					pixelReturn: [{ output: ["FRAME_1"] }],
				};
			}
			if (pixel.includes("FrameHeaders();")) {
				return {
					pixelReturn: [
						{
							output: {
								headerInfo: {
									headers: [
										{
											displayName: "name",
											dataType: "STRING",
										},
									],
								},
							},
						},
					],
				};
			}
			if (pixel.includes("QueryAll()")) {
				return {
					pixelReturn: [
						{
							output: {
								data: {
									values: [["Alice"], ["Bob"]],
								},
								headerInfo: [
									{
										header: "name",
										dataType: "STRING",
									},
								],
							},
						},
					],
				};
			}

			return {
				pixelReturn: [{ output: {} }],
			};
		});

		//Whenever useBlocks hook is called, it will always return the mockvalues
		const useBlocksSpy = vi.spyOn(hooks, "useBlocks").mockReturnValue({
			state: {
				notebooks: {
					mcp_driver: {
						id: "mcp_driver",
						cells: {
							"1": {
								id: "1",
								isExecuted: true,
								output: { data: [] },
								parameters: {
									frameVariableName: "FRAME_1",
								},
							},
						},
					},
				},
				runSideEffect: runSideEffectMock,
				dispatch: vi.fn(),
			},
		} as never);

		//Mocks filtering of the data through cell params
		const cell = {
			id: "2",
			isLoading: false,
			query: query.mcp_driver,
			parameters: {
				frameName: "FRAME_1",
				filterQuery: '(name == ["Alice"])',
				targetCell: {
					id: "1",
					frameVariableName: "FRAME_1",
				},
			},
		};

		render(<FilterDataCell cell={cell as never} isExpanded={true} />);

		expect(await screen.findByText("name")).toBeInTheDocument();
		expect(await screen.findByText("Equals")).toBeInTheDocument();
		expect(await screen.findByText("Alice")).toBeInTheDocument();

		useBlocksSpy.mockRestore();
	});
});
