import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, test, vi } from "vitest";
import "@testing-library/jest-dom";
import { usePixel } from "@semoss/sdk/react";
import { DefaultBlocks } from "../../components/block-defaults";
import { Blocks } from "../../components/blocks";
import { UnFilterDataCell } from "../../components/cell-defaults/unfilter-data-cell";
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
				widget: "unfilter-data",
				parameters: {
					frameName: "",
					unfilterQuery: "",
					targetCell: {
						id: "1",
						frameVariableName: "",
					},
				},
			},
		],
	},
};

describe("UnFilter Data Cell", () => {
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

		// Whenever we call getFrames() through UnFilterDataCell, it will return fake FRAMES
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

		// Replace the store's runSideEffect function with our mock one
		const runSideEffectMock = vi.fn(
			options?.runSideEffectImpl ?? defaultRunSideEffectImpl,
		);

		store.runSideEffect = runSideEffectMock as never;

		// Dispatch will be empty mock function
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

	test("renders frame selector and guidance text when target frame does not exist", async () => {
		vi.mocked(usePixel).mockReturnValue({ status: "SUCCESS" } as never);

		const cell = {
			id: "2",
			isLoading: false,
			query: query.mcp_driver,
			parameters: query.mcp_driver.cells[0].parameters,
		};

		renderWithBlocks(
			<UnFilterDataCell cell={cell as never} isExpanded={true} />,
		);

		// Wait for async state updates to settle
		await waitFor(() => {
			expect(screen.getByRole("combobox")).toBeInTheDocument();
		});
		expect(
			screen.getByText(
				"Run Cell 1 to define the target frame variable before applying filter.",
			),
		).toBeInTheDocument();
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
			<UnFilterDataCell cell={cell as never} isExpanded={true} />,
		);

		// Wait until runSideEffect which we replaced with a mock one in the store runs
		await waitFor(() => {
			expect(runSideEffectMock).toHaveBeenCalledWith("GetFrames();");
		});

		// Mock user clicking the combobox to select FRAME_1
		const frameInput = screen.getByRole("combobox");

		await user.click(frameInput);
		const frame1Option = await screen.findByText("FRAME_1");
		await user.click(frame1Option);

		await waitFor(() => {
			expect(frameInput).toHaveTextContent("FRAME_1");
		});
	});

	test("does not display help text when target frame exists", async () => {
		vi.mocked(usePixel).mockReturnValue({ status: "SUCCESS" } as never);

		const runSideEffectMock = vi.fn(async (pixel: string) => {
			if (pixel === "GetFrames();") {
				return {
					pixelReturn: [{ output: ["FRAME_1"] }],
				};
			}

			return {
				pixelReturn: [{ output: {} }],
			};
		});

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

		const cell = {
			id: "2",
			isLoading: false,
			query: query.mcp_driver,
			parameters: {
				frameName: "FRAME_1",
				unfilterQuery: "",
				targetCell: {
					id: "1",
					frameVariableName: "FRAME_1",
				},
			},
		};

		render(<UnFilterDataCell cell={cell as never} isExpanded={true} />);

		// Wait for async state updates to settle, then verify help text is not visible
		await waitFor(() => {
			expect(
				screen.queryByText(
					"Run Cell 1 to define the target frame variable before applying filter.",
				),
			).not.toBeInTheDocument();
		});

		useBlocksSpy.mockRestore();
	});

	test("dispatches action when frame is selected", async () => {
		vi.mocked(usePixel).mockReturnValue({ status: "SUCCESS" } as never);
		const user = userEvent.setup();

		const cell = {
			id: "2",
			isLoading: false,
			query: query.mcp_driver,
			parameters: query.mcp_driver.cells[0].parameters,
		};

		const dispatchMock = vi.fn();
		const { store } = renderWithBlocks(
			<UnFilterDataCell cell={cell as never} isExpanded={true} />,
		);
		store.dispatch = dispatchMock;

		const frameInput = screen.getByRole("combobox");

		await user.click(frameInput);
		const frame1Option = await screen.findByText("FRAME_1");
		await user.click(frame1Option);

		await waitFor(() => {
			// Check that dispatch was called to update the frame name
			expect(dispatchMock).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "UPDATE_CELL",
					payload: expect.objectContaining({
						path: "parameters.frameName",
						value: "FRAME_1",
					}),
				}),
			);

			// Check that dispatch was called to update the targetCell with extracted ID
			expect(dispatchMock).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "UPDATE_CELL",
					payload: expect.objectContaining({
						path: "parameters.targetCell",
						value: {
							id: 1,
							frameVariableName: "FRAME_1",
						},
					}),
				}),
			);
		});
	});

	test("displays frame options from GetFrames pixel", async () => {
		vi.mocked(usePixel).mockReturnValue({ status: "SUCCESS" } as never);
		const user = userEvent.setup();

		const cell = {
			id: "2",
			isLoading: false,
			query: query.mcp_driver,
			parameters: query.mcp_driver.cells[0].parameters,
		};

		renderWithBlocks(
			<UnFilterDataCell cell={cell as never} isExpanded={true} />,
		);

		const frameInput = screen.getByRole("combobox");
		await user.click(frameInput);

		await waitFor(() => {
			expect(screen.getByText("FRAME_1")).toBeInTheDocument();
			expect(screen.getByText("FRAME_2")).toBeInTheDocument();
		});
	});
});
