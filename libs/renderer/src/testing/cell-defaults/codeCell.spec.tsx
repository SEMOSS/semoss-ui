import "@testing-library/jest-dom";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button, ThemeProvider, useTheme } from "@semoss/ui/next";
import { Blocks } from "../../components/blocks";
import {
	CodeCell,
	type CodeCellDef,
} from "../../components/cell-defaults/code-cell/code-cell";
import { type CellState, type Registry, StateStore } from "../../store";

// Observe the editor boundary without loading Monaco's browser workers.
vi.mock("@semoss/shared", () => ({
	MonacoEditor: ({ theme, value }: { theme?: string; value?: string }) => (
		<div data-testid="code-editor" data-theme={theme}>
			{value}
		</div>
	),
	MonacoDiffEditor: () => null,
}));

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	document.documentElement.classList.remove("light", "dark");
	localStorage.removeItem("code-cell-theme-test");
});

function ThemeControls() {
	const { setTheme } = useTheme();
	return (
		<>
			<Button onClick={() => setTheme("light")}>Light</Button>
			<Button onClick={() => setTheme("dark")}>Dark</Button>
			<Button onClick={() => setTheme("system")}>System</Button>
		</>
	);
}

// Mock useBlocksPixel to avoid SDK interactions
vi.mock("../../hooks/useBlocksPixel", () => ({
	useBlocksPixel: () => ({
		status: "INITIAL",
		data: undefined,
		refresh: vi.fn(),
	}),
}));

// Mock runPixel to avoid network calls
vi.mock("@semoss/sdk/react", () => ({
	runPixel: vi.fn(() =>
		Promise.resolve({
			pixelReturn: [
				{
					output: {
						response: "mock response",
						someFunction: "value",
					},
				},
			],
		}),
	),
}));

const createCodeCellStore = () => {
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
							id: "0",
							widget: "query-import",
							parameters: {
								databaseId: "test-db",
								frameType: "PY",
								frameVariableName: "sourceFrame",
								selectQuery: "SELECT * FROM test",
								enableBatching: false,
								batchSize: 100,
								currentOffset: 0,
							},
						},
						{
							id: "1",
							widget: "code",
							parameters: {
								type: "py",
								code: "print('test')",
								targetCell: {
									id: "1",
									frameVariableName: "sourceFrame",
								},
								language: "python",
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
			"query-import": {
				name: "Query",
				widget: "query-import",
				view: () => null,
				parameters: {
					databaseId: "",
					frameType: "PY",
					frameVariableName: "",
					selectQuery: "",
					enableBatching: false,
					batchSize: 100,
					currentOffset: 0,
				},
				toPixel: () => "",
			},
			code: {
				name: "Code",
				widget: "code",
				view: () => null,
				parameters: {
					code: "",
					targetCell: { id: "", frameVariableName: "" },
					language: "python",
				},
				toPixel: () => "",
			},
		},
	});

	const codeCell = store.notebooks["query-1"]
		.cells[1] as CellState<CodeCellDef>;
	return { store, codeCell };
};

describe("CodeCell", () => {
	it("should render the CodeCell component", async () => {
		const { store, codeCell } = createCodeCellStore();

		const { container } = render(
			<Blocks state={store} registry={{} as Registry}>
				<CodeCell cell={codeCell} isExpanded={true} />
			</Blocks>,
		);

		expect(container).toBeDefined();
		expect(codeCell.widget).toBe("code");
		expect(await screen.findByTestId("code-editor")).toHaveTextContent(
			"print('test')",
		);
	});

	it.each([true, false])(
		"follows light, dark, and system changes without replacing code (expanded: %s)",
		async (isExpanded) => {
			const listeners = new Set<() => void>();
			const media = {
				matches: false,
				addEventListener: (_event: string, listener: () => void) => {
					listeners.add(listener);
				},
				removeEventListener: (_event: string, listener: () => void) => {
					listeners.delete(listener);
				},
			};
			vi.stubGlobal(
				"matchMedia",
				vi.fn(() => media),
			);
			const { store, codeCell } = createCodeCellStore();
			const savedState = store.toJSON();
			render(
				<ThemeProvider
					defaultTheme="dark"
					storageKey="code-cell-theme-test"
				>
					<ThemeControls />
					<Blocks state={store} registry={{} as Registry}>
						<CodeCell cell={codeCell} isExpanded={isExpanded} />
					</Blocks>
				</ThemeProvider>,
			);

			const editor = await screen.findByTestId("code-editor");
			expect(editor).toHaveAttribute("data-theme", "vs-dark");
			fireEvent.click(screen.getByRole("button", { name: "Light" }));
			expect(editor).toHaveAttribute("data-theme", "vs");
			fireEvent.click(screen.getByRole("button", { name: "Dark" }));
			expect(editor).toHaveAttribute("data-theme", "vs-dark");
			fireEvent.click(screen.getByRole("button", { name: "System" }));
			expect(editor).toHaveAttribute("data-theme", "vs");
			act(() => {
				media.matches = true;
				for (const listener of listeners) listener();
			});
			expect(editor).toHaveAttribute("data-theme", "vs-dark");
			act(() => {
				media.matches = false;
				for (const listener of listeners) listener();
			});
			expect(editor).toHaveAttribute("data-theme", "vs");
			expect(screen.getByTestId("code-editor")).toBe(editor);
			expect(editor).toHaveTextContent("print('test')");
			expect(store.toJSON()).toEqual(savedState);
		},
	);

	it("should have code parameter set correctly", () => {
		const { codeCell } = createCodeCellStore();
		const params = codeCell.parameters as Record<string, unknown>;

		expect(params.code).toBe("print('test')");
		expect(params.language).toBe("python");
	});

	it("should have target cell reference configured", () => {
		const { codeCell } = createCodeCellStore();
		const params = codeCell.parameters as Record<string, unknown>;
		const targetCell = params.targetCell as Record<string, unknown>;

		expect(targetCell).toBeDefined();
		expect(targetCell.id).toBe("1");
		expect(targetCell.frameVariableName).toBe("sourceFrame");
	});
});
