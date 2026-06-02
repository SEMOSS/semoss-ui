import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Blocks } from "../../components/blocks";
import {
	MCPToolCell,
	type MCPToolCellDef,
} from "../../components/cell-defaults/mcp-tool-cell/MCPToolCell";
import { type CellState, type Registry, StateStore } from "../../store";

// Mock useBlocksPixel to avoid SDK interactions
vi.mock("../../hooks/useBlocksPixel", () => ({
	useBlocksPixel: () => ({
		status: "INITIAL",
		data: undefined,
		refresh: vi.fn(),
	}),
}));

// Mock runPixel — default returns a tool with one param
const mockRunPixel = vi.fn();
vi.mock("@semoss/sdk", () => ({
	runPixel: (...args: unknown[]) => mockRunPixel(...args),
}));

/**
 * Helper to create a StateStore with a query containing an mcp-tool cell.
 */
const createMCPToolCellStore = (overrides?: {
	projectId?: string;
	name?: string;
	params?: Record<string, unknown>;
	paramType?: "python" | "pixel";
}) => {
	const {
		projectId = "test-project",
		name = "test-tool",
		params = {},
		paramType = "python",
	} = overrides || {};

	const store = new StateStore({
		mode: "interactive",
		insightId: "test-insight",
		state: {
			executionOrder: [],
			queries: {
				"query-1": {
					id: "query-1",
					cells: [
						{
							id: "1",
							widget: "mcp-tool",
							parameters: {
								projectId,
								name,
								params,
								paramType,
							},
						},
					],
				},
			},
			variables: {},
			version: "1",
			blocks: {},
		},
		cellRegistry: {
			"mcp-tool": {
				name: "MCP tool",
				widget: "mcp-tool",
				view: () => null,
				parameters: {
					projectId: "",
					name: "",
					params: {},
					paramType: "python",
				},
				toPixel: () => "",
			},
		},
	});

	const mcpCell = store.notebooks["query-1"].cells[
		"1"
	] as CellState<MCPToolCellDef>;
	return { store, mcpCell };
};

/**
 * Renders the MCPToolCell within a Blocks provider.
 */
const renderMCPToolCell = (
	overrides?: Parameters<typeof createMCPToolCellStore>[0],
) => {
	const { store, mcpCell } = createMCPToolCellStore(overrides);

	const result = render(
		<Blocks state={store} registry={{} as Registry}>
			<MCPToolCell cell={mcpCell} isExpanded={true} />
		</Blocks>,
	);

	return { ...result, store, mcpCell };
};

describe("MCPToolCell", () => {
	beforeAll(() => {
		vi.stubGlobal("jest", {
			advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
		});
		vi.useFakeTimers();
	});

	afterAll(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		vi.clearAllTimers();
		vi.unstubAllGlobals();
	});

	it("renders loading state while fetching params", () => {
		mockRunPixel.mockReturnValue(new Promise(() => {}));

		renderMCPToolCell();

		expect(screen.getByText("Loading parameters...")).toBeInTheDocument();
	});

	it("renders param inputs after successful fetch", async () => {
		mockRunPixel.mockResolvedValue({
			pixelReturn: [
				{
					output: JSON.stringify({
						tools: [
							{
								name: "test-tool",
								inputSchema: {
									properties: {
										query: {
											type: "string",
											description: "Search query",
										},
										limit: {
											type: "number",
											description: "Max results",
										},
									},
								},
							},
						],
					}),
				},
			],
		});

		await act(async () => {
			renderMCPToolCell();
			await vi.runAllTimersAsync();
		});

		await waitFor(() => {
			expect(screen.getByText("query")).toBeInTheDocument();
		});
		expect(screen.getByText("limit")).toBeInTheDocument();
	});

	it("renders empty message when tool has no params", async () => {
		mockRunPixel.mockResolvedValue({
			pixelReturn: [
				{
					output: JSON.stringify({
						tools: [
							{
								name: "test-tool",
								inputSchema: { properties: {} },
							},
						],
					}),
				},
			],
		});

		await act(async () => {
			renderMCPToolCell();
			await vi.runAllTimersAsync();
		});

		await waitFor(() => {
			expect(
				screen.getByText("No params found for test-tool"),
			).toBeInTheDocument();
		});
	});

	it("renders empty message on fetch error", async () => {
		const consoleSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		mockRunPixel.mockRejectedValue(new Error("Network error"));

		await act(async () => {
			renderMCPToolCell();
			await vi.runAllTimersAsync();
		});

		await waitFor(() => {
			expect(
				screen.getByText("No params found for test-tool"),
			).toBeInTheDocument();
		});
		consoleSpy.mockRestore();
	});
});
