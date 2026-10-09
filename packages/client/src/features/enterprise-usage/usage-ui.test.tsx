import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { download, runPixel } from "@semoss/sdk";
import { loadEngineIcon } from "@semoss/shared";
import { EnterpriseUsagePage } from "@/pages/settings/enterprise-usage.page";
import { EnterpriseUsage } from "./enterprise-usage";
import { UsageBenchmark } from "./usage-benchmark";
import { UsageTrend, usageBrushRange } from "./usage-trend";

const mocks = vi.hoisted(() => ({
	usePixel: vi.fn(),
	isAdmin: true,
	refresh: vi.fn(),
}));
const charts = vi.hoisted(() => ({
	init: vi.fn(() => ({
		setOption: vi.fn<(options: unknown, settings: unknown) => void>(),
		on: vi.fn<(event: string, handler: (event: unknown) => void) => void>(),
		dispatchAction: vi.fn(),
		resize: vi.fn(),
		dispose: vi.fn(),
	})),
}));
vi.mock("echarts/core", () => ({ init: charts.init, use: vi.fn() }));
vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	runPixel: vi.fn(),
	download: vi.fn(),
}));
vi.mock("@semoss/sdk/react", () => ({
	usePixel: mocks.usePixel,
	useInsight: () => ({ insightId: "test-insight" }),
}));
vi.mock("@/hooks/use-session", () => ({ useSession: () => mocks.isAdmin }));

const summary = {
	REQUESTS: 2,
	TOKENS: 300,
	INPUT_TOKENS: 200,
	OUTPUT_TOKENS: 100,
	USERS: 1,
	APPS: 1,
	MODELS: 1,
	ROOMS: 1,
	MESSAGE_ROWS: 4,
	TOKEN_ROWS: 4,
	LATENCY_MS: 1500,
	CACHE_ROWS: 0,
	CACHE_CREATION_TOKENS: null,
	THINKING_ROWS: 0,
	EVENTS: 2,
	FAILED: 1,
	SUCCEEDED: 1,
	KNOWN_OUTCOMES: 2,
};
const logRow = {
	ROW_NUM: 1,
	TIME: "2024-03-01 10:00:00",
	MESSAGE_ID: "input-1",
	TRANSACTION_ID: "tx-1",
	MESSAGE_TYPE: "INPUT",
	USER_ID: "u-1",
	USER_NAME: "Test user",
	APP_ID: "app-1",
	APP_NAME: "Finance",
	MODEL_ID: "model-1",
	MODEL_NAME: "Model One",
	ROOM_ID: "room-1",
	METHOD: "ask",
	TOKENS: 100,
	LATENCY_MS: 1500,
};

function dataset(row: Record<string, unknown>): {
	rows: Record<string, unknown>[];
} {
	return { rows: [row] };
}

beforeEach(() => {
	charts.init.mockClear();
	Element.prototype.scrollIntoView = vi.fn();
	vi.mocked(runPixel).mockReset();
	vi.mocked(download).mockReset();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	mocks.isAdmin = true;
	mocks.usePixel.mockReset();
	mocks.usePixel.mockImplementation((pixel: string) => {
		if (pixel.includes("AdminGetEnterpriseUsageFilterOptions"))
			return {
				status: "SUCCESS",
				refresh: mocks.refresh,
				data: {
					hasMore: false,
					rows: [
						{
							ENTITY_ID: pixel.includes('dimension=["engine"]')
								? "model-1"
								: "u-1",
							ENTITY_NAME: pixel.includes('dimension=["engine"]')
								? "Model One"
								: "O'Brien",
							ENTITY_TYPE: "NATIVE",
						},
					],
				},
			};
		let row: Record<string, unknown> = summary;
		if (pixel.includes('view=["latency"]')) row = { P95_MS: 2000 };
		else if (pixel.includes('view=["feedback"]'))
			row = { RATINGS: 2, POSITIVE: 1 };
		else if (pixel.includes('view=["ranking"]'))
			row = {
				...summary,
				ENTITY_ID: "model-1",
				ENTITY_NAME: "Model One",
			};
		else if (pixel.includes('view=["logs"]')) row = logRow;
		else if (pixel.includes("AdminGetEnterpriseUsageDetail"))
			row = {
				MESSAGE_ID: "input-1",
				MESSAGE_TYPE: "INPUT",
				MESSAGE_DATA: '<img src="x">Stored prompt',
			};
		else if (pixel.includes('view=["trend"]'))
			row = { ...summary, DAY: "2024-03-01" };
		return {
			status: pixel ? "SUCCESS" : "INITIAL",
			data: dataset(row),
			refresh: mocks.refresh,
		};
	});
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("enterprise usage interactions", () => {
	it("recovers from an export error and downloads only a server-generated file", async () => {
		render(<EnterpriseUsage />);
		vi.mocked(runPixel).mockRejectedValueOnce(
			new Error("Export Permission Denied"),
		);
		const button = screen.getByRole("button", { name: "KPI CSV" });
		fireEvent.click(button);
		expect(button).toBeDisabled();
		expect(
			await screen.findByText("Export Permission Denied"),
		).toBeInTheDocument();
		await waitFor(() => expect(button).toBeEnabled());
		expect(download).not.toHaveBeenCalled();
		const fileKey = "88d34f7b-dd44-4f4c-b6a7-cad71479d8b3";
		vi.mocked(runPixel).mockResolvedValueOnce({
			errors: [],
			insightId: "test-insight",
			pixelReturn: [
				{
					output: fileKey,
					operationType: ["FILE_DOWNLOAD"],
					isMeta: false,
					pixelExpression: "",
					pixelId: "1",
					timeToRun: 0,
				},
			],
		});
		fireEvent.click(button);
		await waitFor(() =>
			expect(download).toHaveBeenCalledWith("test-insight", fileKey),
		);
		expect(runPixel).toHaveBeenLastCalledWith(
			expect.stringContaining("AdminExportEnterpriseUsage("),
			"test-insight",
		);
		expect(runPixel).toHaveBeenLastCalledWith(
			expect.stringContaining("comparisonStartDate="),
			"test-insight",
		);
	});
	it("does not mount queries for a non-administrator, including a direct URL", () => {
		mocks.isAdmin = false;
		render(
			<MemoryRouter initialEntries={["/settings/enterprise-usage"]}>
				<EnterpriseUsagePage />
			</MemoryRouter>,
		);
		expect(mocks.usePixel).not.toHaveBeenCalled();
	});
	it("edits catalog choices as a draft and applies an exact shared identity filter", async () => {
		render(<EnterpriseUsage />);
		const start = mocks.usePixel.mock.calls.length;
		fireEvent.click(screen.getByRole("combobox", { name: "User" }));
		const option = await screen.findByRole("option", {
			name: /O'Brien.*ID: u-1.*Type: NATIVE/,
		});
		fireEvent.click(option);
		expect(
			screen.getByRole("combobox", { name: "User" }),
		).toHaveTextContent("O'Brien | u-1 | NATIVE");
		expect(
			mocks.usePixel.mock.calls
				.slice(start)
				.some(
					([pixel]) =>
						String(pixel).startsWith("AdminGetEnterpriseUsage(") &&
						String(pixel).includes('user=["=u-1"]'),
				),
		).toBe(false);
		fireEvent.click(screen.getByRole("button", { name: "Apply Filters" }));
		await waitFor(() =>
			expect(
				mocks.usePixel.mock.calls.some(([pixel]) =>
					String(pixel).includes('user=["=u-1"]'),
				),
			).toBe(true),
		);
		expect(
			screen.getByRole("button", { name: /Clear User/ }),
		).toHaveTextContent("User ID: u-1");
	});
	it("lands on platform activity and keeps token consumption on its own tab", async () => {
		render(<EnterpriseUsage />);
		expect(screen.getByText("Activity Events")).toBeInTheDocument();
		expect(screen.queryByText("Model Requests")).not.toBeInTheDocument();
		expect(
			mocks.usePixel.mock.calls
				.filter(([pixel]) =>
					String(pixel).startsWith("AdminGetEnterpriseUsage("),
				)
				.every(([pixel]) =>
					String(pixel).includes('source=["activity"]'),
				),
		).toBe(true);
		fireEvent.mouseDown(
			screen.getByRole("tab", { name: "Token Consumption" }),
			{ button: 0, ctrlKey: false },
		);
		expect(await screen.findByText("Model Requests")).toBeInTheDocument();
		expect(screen.queryByText("Activity Events")).not.toBeInTheDocument();
	});

	it("highlights unapplied preset changes and exposes dates only for Custom", async () => {
		render(<EnterpriseUsage />);
		const apply = screen.getByRole("button", { name: "Apply Filters" });
		expect(apply).toBeDisabled();
		expect(screen.queryByLabelText("Start Date")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("combobox", { name: "Date Range" }));
		fireEvent.click(
			await screen.findByRole("option", { name: "Last 7 Days" }),
		);
		expect(apply).toBeEnabled();
		expect(apply).toHaveClass("bg-primary");
		expect(screen.getByText("Unapplied Changes")).toBeInTheDocument();
		fireEvent.click(apply);
		await waitFor(() => expect(apply).toBeDisabled());
		fireEvent.click(screen.getByRole("combobox", { name: "Date Range" }));
		fireEvent.click(await screen.findByRole("option", { name: "Custom" }));
		expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
		fireEvent.change(screen.getByLabelText("Start Date"), {
			target: { value: "2026-01-01" },
		});
		expect(apply).toBeEnabled();
	});
	it("drills from a model to its message log and loads bodies only after inspection", async () => {
		render(<EnterpriseUsage />);
		fireEvent.mouseDown(
			screen.getByRole("tab", { name: "Users, Apps & Models" }),
			{ button: 0, ctrlKey: false },
		);
		fireEvent.click(
			await screen.findByRole("button", { name: "Model One" }),
		);
		expect(screen.getByRole("tab", { name: "Messages" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(
			screen.getByRole("combobox", { name: "Engine" }),
		).toHaveTextContent("Model One | model-1");
		expect(
			screen.getByRole("button", { name: /Clear Engine/ }),
		).toHaveTextContent("Engine ID: model-1");
		expect(
			mocks.usePixel.mock.calls.some(([pixel]) =>
				String(pixel).includes("AdminGetEnterpriseUsageDetail"),
			),
		).toBe(false);
		const inspect = await screen.findByRole("button", {
			name: "View Message Details: input-1",
		});
		fireEvent.click(inspect);
		expect(await screen.findByRole("dialog")).toHaveAccessibleName(
			"Model Message Detail",
		);
		expect(
			screen.getByText('<img src="x">Stored prompt'),
		).toBeInTheDocument();
		expect(screen.getByRole("dialog").querySelector("img")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		await waitFor(() => expect(inspect).toHaveFocus());
	});
	it.each([
		["MODEL", "OPEN_AI", "OPEN_AI.svg"],
		["MODEL", "CLAUDE", "CLAUDE_AI.svg"],
		["DATABASE", "POSTGRES", "POSTGRES.svg"],
		["FUNCTION", "REST", "REST-API.svg"],
		["MODEL", null, "BRAIN.png"],
	])(
		"shows the shared %s / %s logo in engine choices and the selected filter",
		async (type, subtype, filename) => {
			const original = mocks.usePixel.getMockImplementation();
			mocks.usePixel.mockImplementation((pixel: string) => {
				if (
					pixel.includes("AdminGetEnterpriseUsageFilterOptions") &&
					pixel.includes('dimension=["engine"]')
				)
					return {
						status: "SUCCESS",
						refresh: mocks.refresh,
						data: {
							hasMore: false,
							rows: [
								{
									ENTITY_ID: "provider-engine",
									ENTITY_NAME: "Provider Engine",
									ENTITY_TYPE: type,
									ENTITY_SUBTYPE: subtype,
								},
							],
						},
					};
				return original?.(pixel);
			});
			const expected = await loadEngineIcon(filename);
			expect(expected).not.toBeNull();
			render(<EnterpriseUsage />);
			const trigger = screen.getByRole("combobox", { name: "Engine" });
			fireEvent.click(trigger);
			const option = await screen.findByRole("option", {
				name: /Provider Engine/,
			});
			await waitFor(() =>
				expect(option.querySelector("img")).toHaveAttribute(
					"src",
					expected,
				),
			);
			expect(option.querySelector("img")).toHaveAttribute("alt", "");
			expect(option.querySelector("[data-slot=avatar]")).toBeNull();
			fireEvent.click(option);
			await waitFor(() =>
				expect(trigger.querySelector("img")).toHaveAttribute(
					"src",
					expected,
				),
			);
			expect(trigger).toHaveTextContent(
				"Provider Engine | provider-engine",
			);
		},
	);
	it("keeps source errors visible and retryable instead of reporting zero KPIs", () => {
		mocks.usePixel.mockReturnValue({
			status: "ERROR",
			error: new Error("Logging disabled"),
			refresh: mocks.refresh,
		});
		render(<EnterpriseUsage />);
		expect(
			screen.getByText("Platform Activity Unavailable"),
		).toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("button", { name: "Retry Platform Activity" }),
		);
		expect(mocks.refresh).toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "KPI CSV" })).toBeDisabled();
	});
});

describe("chart tooltips and benchmarks", () => {
	it("uses native tooltips, applies a real brush directly, and resets locally", async () => {
		const onRange = vi.fn();
		const onClearRange = vi.fn();
		const rows = [
			{ DAY: "2024-03-01", REQUESTS: 10 },
			{ DAY: "2024-03-02", REQUESTS: 20 },
		];
		render(
			<UsageTrend
				title="Test Trend"
				rows={rows}
				comparisonRows={[
					{ DAY: "2024-02-01", REQUESTS: 5 },
					{ DAY: "2024-02-02", REQUESTS: 8 },
				]}
				series={[{ key: "REQUESTS", label: "Requests", color: 1 }]}
				selectedRange={{ from: "2024-03-01", to: "2024-03-02" }}
				onRange={onRange}
				onClearRange={onClearRange}
			/>,
		);
		const chart = charts.init.mock.results[0].value;
		const option = chart.setOption.mock.calls[0][0] as {
			toolbox: { show: boolean };
			brush: { brushType: string; brushStyle: { color: string } };
			tooltip: {
				formatter: (value: unknown) => string;
				renderMode: string;
			};
		};
		expect(option.tooltip.renderMode).toBe("richText");
		expect(option.toolbox.show).toBe(false);
		expect(option.brush.brushType).toBe("lineX");
		expect(option.brush.brushStyle.color).toBe("transparent");
		expect(option.tooltip.formatter([{ dataIndex: 1 }])).toBe(
			"Current: 2024-03-02\nRequests: 20\nBenchmark: 2024-02-02\nRequests: 8",
		);
		fireEvent.click(screen.getByRole("img", { name: "Test Trend Chart" }));
		expect(onRange).not.toHaveBeenCalled();
		const brush = chart.on.mock.calls.find(
			([event]) => event === "brushEnd",
		)?.[1];
		act(() => brush?.({ areas: [{ coordRange: [1, 1] }] }));
		await waitFor(() =>
			expect(onRange).toHaveBeenCalledWith({
				from: "2024-03-02",
				to: "2024-03-02",
			}),
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Reset Date Filter On Test Trend",
			}),
		);
		expect(onClearRange).toHaveBeenCalledOnce();
		expect(chart.dispatchAction).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "takeGlobalCursor",
				brushOption: { brushType: "lineX", brushMode: "single" },
			}),
		);
		expect(
			usageBrushRange({ areas: [{ coordRange: [Number.NaN, 1] }] }, rows),
		).toBeNull();
		expect(
			usageBrushRange({ areas: [{ coordRange: [20, -1] }] }, rows),
		).toEqual({ from: "2024-03-01", to: "2024-03-02" });
	});

	it("shows the full longer benchmark without padding the shorter period with zeroes", () => {
		const select = vi.fn();
		render(
			<UsageTrend
				title="Unequal Periods"
				rows={[{ DAY: "2024-03-01", REQUESTS: 10 }]}
				comparisonRows={[
					{ DAY: "2024-02-01", REQUESTS: 5 },
					{ DAY: "2024-02-02", REQUESTS: 8 },
					{ DAY: "2024-02-03", REQUESTS: 12 },
				]}
				series={[{ key: "REQUESTS", label: "Requests", color: 1 }]}
				selectedRange={null}
				onRange={select}
				onClearRange={vi.fn()}
			/>,
		);
		const option = charts.init.mock.results[0].value.setOption.mock
			.calls[0][0] as {
			xAxis: { data: string[] };
			series: { data: (number | null)[] }[];
			tooltip: { formatter: (params: unknown) => string };
		};
		expect(option.xAxis.data).toEqual(["Day 1", "Day 2", "Day 3"]);
		expect(option.series[0].data).toEqual([10, null, null]);
		expect(option.series[1].data).toEqual([5, 8, 12]);
		const chart = charts.init.mock.results[0].value;
		const brush = chart.on.mock.calls.find(
			([event]) => event === "brushEnd",
		)?.[1];
		act(() => brush?.({ areas: [{ coordRange: [1, 2] }] }));
		expect(select).not.toHaveBeenCalled();
		expect(chart.dispatchAction).toHaveBeenCalledWith({
			type: "brush",
			areas: [],
		});
		fireEvent.click(screen.getByRole("button", { name: "Daily Data" }));
		expect(screen.getByText("2024-02-03")).toBeInTheDocument();
		expect(option.tooltip.formatter([{ dataIndex: 2 }])).toContain(
			"Benchmark: 2024-02-03",
		);
		expect(
			usageBrushRange({ areas: [{ coordRange: [1, 2] }] }, [
				{ DAY: "2024-03-01" },
			]),
		).toBeNull();
	});
	it("allows a custom comparison and displays the applied dates", async () => {
		const onApply = vi.fn();
		render(
			<UsageBenchmark
				filters={{
					from: "2024-03-01",
					to: "2024-03-31",
					user: "",
					app: "",
					engine: "",
				}}
				value={{ mode: "custom", from: "2023-03-01", to: "2023-03-31" }}
				onApply={onApply}
			/>,
		);
		fireEvent.change(screen.getByLabelText("Comparison Start"), {
			target: { value: "2023-04-01" },
		});
		fireEvent.change(screen.getByLabelText("Comparison End"), {
			target: { value: "2023-04-30" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Apply Comparison" }),
		);
		await waitFor(() =>
			expect(onApply).toHaveBeenCalledWith(
				{ mode: "custom", from: "2023-04-01", to: "2023-04-30" },
				expect.anything(),
			),
		);
	});
});
