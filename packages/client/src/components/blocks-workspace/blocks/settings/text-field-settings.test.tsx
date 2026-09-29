import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { observable, runInAction } from "mobx";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";
import type { Variable } from "@semoss/renderer";
import { QueryInputSettings } from "./custom/query-input-settings";
import { QuerySelectionSettings } from "./custom/query-selection-settings";
import { BooleanSettings } from "./shared/boolean-settings";
import { InputModalSettings } from "./shared/InputModalSettings";
import { InputSettings } from "./shared/InputSettings";
import { SelectInputSettings } from "./shared/SelectInputSettings";

const BLOCK_ID = "input-1";
const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

const mocks = vi.hoisted(() => ({
	useBlocks: vi.fn(),
	useBlockSettings: vi.fn(),
}));

vi.mock("@/hooks/useBlockSettings", () => ({
	useBlockSettings: mocks.useBlockSettings,
}));
vi.mock("@/utility", () => ({ formatToDataTestId: (value: string) => value }));
vi.mock("@semoss/renderer", () => ({
	useBlocks: mocks.useBlocks,
	ActionMessages: { ADD_VARIABLE: "ADD_VARIABLE" },
	INPUT_BLOCK_TYPES: ["input"],
	getValueByPath: (data: Record<string, unknown>, path: string) => data[path],
}));

interface TestCell {
	id: string;
	_exposed: { output: string; isLoading: boolean };
}

const makeNotebook = () =>
	observable({
		cells: {
			"1": { id: "1", _exposed: { output: "result", isLoading: false } },
		} as Record<string, TestCell>,
		_exposed: { output: "result", isLoading: false },
		get cellList() {
			return Object.values(this.cells);
		},
		getCell(id: string) {
			return this.cells[id];
		},
	});

let data: Record<string, unknown>;
let state: ReturnType<typeof makeState>;
const setData = vi.fn((path: string, value: unknown) => {
	runInAction(() => {
		data[path] = value;
	});
});

function makeState() {
	return observable({
		variables: {} as Record<string, Variable>,
		notebooks: { query: makeNotebook() } as Record<
			string,
			ReturnType<typeof makeNotebook>
		>,
		blocks: {},
		getNotebook(id: string) {
			return this.notebooks[id];
		},
		getVariable: vi.fn(() => undefined),
		dispatch: vi.fn(() => true),
	});
}

beforeAll(() => {
	// jsdom has no layout observer or scrolling implementation.
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	HTMLElement.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
	data = observable({
		label: "Example Input",
		value: "Saved value",
		type: "text",
		show: "true",
		disabled: false,
		required: false,
		loading: false,
		options: ["keep"],
	});
	state = makeState();
	setData.mockClear();
	mocks.useBlockSettings.mockReturnValue({ data, setData });
	mocks.useBlocks.mockReturnValue({ state });
});

afterAll(() => {
	vi.unstubAllGlobals();
	HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

describe("text field settings", () => {
	test("keeps settings usable and saved values intact when a cell reference is missing", () => {
		runInAction(() => {
			state.variables.missing = {
				type: "cell",
				to: "query",
				cellId: "deleted",
			};
			data.show = "{{missing.output}}";
		});
		render(
			<QueryInputSettings id={BLOCK_ID} label="Show Block" path="show" />,
		);
		expect(screen.getByRole("alert")).toHaveTextContent("missing");
		expect(screen.getByRole("textbox", { name: "Show Block" })).toHaveValue(
			"{{missing.output}}",
		);
		expect(setData).not.toHaveBeenCalled();
		expect(state.variables.missing).toBeDefined();
	});

	test("recovers as a missing notebook or cell is restored without remounting", () => {
		runInAction(() => {
			state.variables.result = {
				type: "cell",
				to: "missingQuery",
				cellId: "1",
			};
		});
		render(
			<QueryInputSettings id={BLOCK_ID} label="Show Block" path="show" />,
		);
		expect(screen.getByRole("alert")).toHaveTextContent("result");
		act(() =>
			runInAction(() => {
				state.notebooks.missingQuery = makeNotebook();
			}),
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		act(() =>
			runInAction(() => {
				delete state.notebooks.missingQuery.cells["1"];
			}),
		);
		expect(screen.getByRole("alert")).toHaveTextContent("result");
		expect(setData).not.toHaveBeenCalled();
	});

	test.each(["disabled", "required"] as const)(
		"saves a real false boolean for %s without migrating legacy values on mount",
		async (path) => {
			runInAction(() => {
				data[path] = "false";
			});
			render(<BooleanSettings id={BLOCK_ID} label={path} path={path} />);
			expect(data[path]).toBe("false");
			expect(setData).not.toHaveBeenCalled();
			fireEvent.keyDown(screen.getByRole("combobox", { name: path }), {
				key: "ArrowDown",
			});
			fireEvent.click(
				await screen.findByRole("option", { name: "False" }),
			);
			expect(data[path]).toBe(false);
			expect(setData).toHaveBeenCalledWith(path, false);
		},
	);

	test("retains expressions and normalizes a manually entered false literal", () => {
		runInAction(() => {
			data.disabled = "{{query.isLoading}}";
		});
		render(
			<BooleanSettings id={BLOCK_ID} label="Disabled" path="disabled" />,
		);
		const input = screen.getByRole("textbox", {
			name: "Disabled expression",
		});
		expect(input).toHaveValue("{{query.isLoading}}");
		expect(setData).not.toHaveBeenCalled();
		fireEvent.change(input, { target: { value: "false" } });
		expect(data.disabled).toBe(false);
		expect(input).toHaveValue("false");
		fireEvent.change(input, { target: { value: "{{another.isLoading}}" } });
		expect(data.disabled).toBe("{{another.isLoading}}");
	});

	test("selects Loading with the keyboard and clears only its binding", async () => {
		render(
			<QuerySelectionSettings
				id={BLOCK_ID}
				label="Loading"
				path="loading"
				queryPath="isLoading"
				allowClear
			/>,
		);
		fireEvent.click(screen.getByRole("combobox", { name: "Loading" }));
		expect(
			screen.getByRole("combobox", { name: "Loading" }),
		).toHaveAttribute("aria-controls", screen.getByRole("dialog").id);
		const search = screen.getByPlaceholderText("Search references...");
		fireEvent.change(search, { target: { value: "query.isLoading" } });
		const option = await screen.findByRole("option", {
			name: "query.isLoading",
		});
		await waitFor(() =>
			expect(option).toHaveAttribute("data-selected", "true"),
		);
		fireEvent.keyDown(search, { key: "Enter" });
		expect(data.loading).toBe("{{query.isLoading}}");
		setData.mockClear();
		fireEvent.click(screen.getByRole("button", { name: "Clear loading" }));
		expect(data.loading).toBe(false);
		expect(setData.mock.calls).toEqual([["loading", false]]);
		expect(data.options).toEqual(["keep"]);
	});

	test("shows an empty state when no loading references are available", () => {
		runInAction(() => {
			state.notebooks = {};
		});
		render(
			<QuerySelectionSettings
				id={BLOCK_ID}
				label="Loading"
				path="loading"
				queryPath="isLoading"
				allowClear
			/>,
		);
		fireEvent.click(screen.getByRole("combobox", { name: "Loading" }));
		expect(screen.getByText("No matching references.")).toBeVisible();
		expect(screen.queryByRole("option")).not.toBeInTheDocument();
		expect(setData).not.toHaveBeenCalled();
	});

	test("names the label, type, value, and expanded value controls", async () => {
		render(
			<>
				<InputSettings id={BLOCK_ID} label="Label" path="label" />
				<SelectInputSettings
					id={BLOCK_ID}
					label="Type"
					path="type"
					options={[{ value: "text", display: "Text" }]}
				/>
				<InputModalSettings id={BLOCK_ID} label="Value" path="value" />
			</>,
		);
		expect(screen.getByRole("textbox", { name: "Label" })).toHaveValue(
			"Example Input",
		);
		expect(
			screen.getByRole("combobox", { name: "Type" }),
		).toHaveTextContent("Text");
		expect(screen.getByRole("textbox", { name: "Value" })).toHaveValue(
			"Saved value",
		);
		const expand = screen.getByRole("button", {
			name: "Expand value editor",
		});
		fireEvent.click(expand);
		const dialog = await screen.findByRole("dialog", {
			name: "Edit Value",
		});
		expect(
			within(dialog).getByRole("textbox", { name: "Value" }),
		).toHaveValue("Saved value");
		fireEvent.keyDown(dialog, { key: "Escape" });
		await waitFor(() => expect(expand).toHaveFocus());
	});

	test("inserts a reference through the shared Select and keeps the expanded editor in sync", async () => {
		runInAction(() => {
			data.show = "";
		});
		render(
			<QueryInputSettings id={BLOCK_ID} label="Show Block" path="show" />,
		);
		fireEvent.keyDown(
			screen.getByRole("combobox", {
				name: "Insert reference into show block",
			}),
			{ key: "ArrowDown" },
		);
		fireEvent.click(await screen.findByRole("option", { name: "query" }));
		expect(screen.getByRole("textbox", { name: "Show Block" })).toHaveValue(
			" {{query}} ",
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Expand show block editor" }),
		);
		const dialog = await screen.findByRole("dialog", {
			name: "Edit Show Block",
		});
		expect(
			within(dialog).getByRole("textbox", { name: "Show Block" }),
		).toHaveValue(" {{query}} ");
		await waitFor(() => expect(data.show).toBe(" {{query}} "));
	});
});
