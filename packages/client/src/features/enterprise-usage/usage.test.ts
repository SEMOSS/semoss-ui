import { beforeEach, describe, expect, it, vi } from "vitest";
import { download, runPixel } from "@semoss/sdk";
import {
	exportUsageReport,
	parseUsageFilterOptions,
	parseUsageRows,
} from "@/api/enterprise-usage";
import {
	calendarDate,
	comparisonUsageFilters,
	detailQuery,
	logQuery,
	previousUsageFilters,
	rankingQuery,
	summaryQuery,
	usageExportPixel,
	usageFilterOptionsPixel,
	usagePixel,
	validateUsageFilters,
} from "@/api/enterprise-usage-requests";
import type { UsageFilters } from "./usage.types";
import {
	fillUsageDays,
	formatCost,
	messageTokenParts,
	modelKpis,
	numeric,
	percentage,
	periodChange,
} from "./usage-metrics";

vi.mock("@semoss/sdk", () => ({ runPixel: vi.fn(), download: vi.fn() }));
const filters: UsageFilters = {
	from: "2024-03-01",
	to: "2024-03-31",
	user: "",
	app: "",
	engine: "",
};

describe("enterprise usage reactor requests", () => {
	it("preserves Unicode identities while source literals remain ASCII", () => {
		const name =
			"Zo\u00eb Dvo\u0159\u00e1k \u2013 \u6771\u4eac \ud83d\ude80";
		expect(usageFilterOptionsPixel("user", name)).toContain(
			`search=[${JSON.stringify(name)}]`,
		);
		expect(
			usagePixel(summaryQuery("model", { ...filters, user: name })),
		).toContain(`user=[${JSON.stringify(name)}]`);
	});
	it("validates dates and computes an equal preceding calendar period", () => {
		expect(previousUsageFilters(filters)).toMatchObject({
			from: "2024-01-30",
			to: "2024-02-29",
		});
		expect(summaryQuery("model", filters)).toMatchObject({
			source: "model",
			view: "summary",
			filters,
		});
		expect(() => calendarDate("2024-02-30")).toThrow();
		expect(() =>
			validateUsageFilters({ ...filters, to: "2025-04-01" }),
		).toThrow();
		expect(() =>
			validateUsageFilters({ ...filters, to: "2024-02-01" }),
		).toThrow();
	});
	it("sends typed filters to dedicated reactors without query text", () => {
		const scope = {
			...filters,
			user: "O'Brien_50%",
			app: "=app-1",
			engine: "=model-1",
		};
		for (const source of ["model", "activity"] as const) {
			const request = summaryQuery(source, scope);
			expect(request).not.toHaveProperty("sql");
			expect(usagePixel(request)).toContain("AdminGetEnterpriseUsage(");
			expect(usagePixel(request)).toContain('user=["O\'Brien_50%"]');
			expect(usagePixel(request)).toContain('app=["=app-1"]');
			expect(usagePixel(request)).toContain('engine=["=model-1"]');
			expect(usagePixel(request)).not.toContain("model=[");
			expect(usagePixel(request)).not.toContain("AdminSqlQuery");
		}
		expect(() =>
			summaryQuery("model", { ...filters, user: "<encode>" }),
		).toThrow();
	});
	it("bounds searchable catalog requests and validates only identity fields", () => {
		expect(usageFilterOptionsPixel("user", "O'Brien", 1)).toContain(
			"offset=[50]",
		);
		expect(
			usageFilterOptionsPixel("engine", "", 0, "function-1"),
		).toContain('id=["function-1"]');
		expect(() => usageFilterOptionsPixel("user", "", -1)).toThrow();
		expect(() => usageFilterOptionsPixel("user", "<encode>")).toThrow();
		expect(
			parseUsageFilterOptions({
				rows: [
					{
						ENTITY_ID: "u-1",
						ENTITY_NAME: "Alex",
						ENTITY_TYPE: "SAML",
					},
				],
				hasMore: true,
			}),
		).toEqual({
			rows: [{ id: "u-1", name: "Alex", type: "SAML", subtype: "" }],
			hasMore: true,
		});
		expect(
			parseUsageFilterOptions({
				rows: [{ ENTITY_ID: "legacy" }],
				hasMore: false,
			}).rows[0],
		).toEqual({ id: "legacy", name: "legacy", type: "", subtype: "" });
		for (const data of [
			{ rows: [] },
			{ rows: [{ ENTITY_ID: "u", ENTITY_NAME: 1 }], hasMore: false },
			{
				rows: [{ ENTITY_ID: "engine", ENTITY_SUBTYPE: 1 }],
				hasMore: false,
			},
			{ rows: [{}], hasMore: false },
		])
			expect(() => parseUsageFilterOptions(data)).toThrow();
	});
	it("bounds metadata pages and sends only record identity for details", () => {
		const request = logQuery("model", filters, 2);
		expect(request).toMatchObject({ view: "logs", limit: 25, offset: 50 });
		expect(() => logQuery("model", filters, -1)).toThrow();
		expect(() => logQuery("model", filters, 0, 5001)).toThrow();
		const detail = detailQuery("model", {
			MESSAGE_ID: "input-1",
			TRANSACTION_ID: "tx-1",
			USER_ID: "u-1",
			MODEL_ID: "m-1",
			ROOM_ID: null,
		});
		expect(usagePixel(detail)).toBe(
			'AdminGetEnterpriseUsageDetail(source=["model"], recordId=["input-1"]);',
		);
	});
	it("reads an audit change by its event alone", () => {
		const detail = detailQuery("audit", {
			EVENT_ID: "limit-1",
			EVENT_TYPE: "USAGE_LIMIT_UPDATE",
			ACTOR_USER_ID: "owner-1",
		});
		expect(detail).toMatchObject({ source: "audit", limit: 1 });
		expect(usagePixel(detail)).toBe(
			'AdminGetEnterpriseUsageDetail(source=["audit"], recordId=["limit-1"]);',
		);
		expect(() => detailQuery("audit", { LOG_ID: "log-1" })).toThrow();
		expect(usagePixel(logQuery("audit", filters, 1))).toContain(
			'source=["audit"], view=["logs"]',
		);
	});
});

describe("usage data and KPI semantics", () => {
	it("rejects malformed responses rather than turning errors into zero usage", () => {
		expect(
			parseUsageRows({ rows: [{ REQUESTS: 2, TOKENS: null }] }),
		).toEqual([{ REQUESTS: 2, TOKENS: null }]);
		for (const payload of [
			null,
			{},
			{ rows: [null] },
			{ rows: [[1]] },
			{ rows: [{ VALUE: {} }] },
		])
			expect(() => parseUsageRows(payload)).toThrow();
	});
	it("requires each audit view's own fields", () => {
		const summary = summaryQuery("audit", filters);
		const counts = {
			EVENTS: 2,
			USAGE_LIMIT_CHANGES: 1,
			ACCESS_CHANGES: 1,
			DENIALS: 1,
			ACTORS: 1,
			PEOPLE_DENIED: 1,
			PEOPLE_AFFECTED: 2,
		};
		expect(parseUsageRows({ rows: [counts] }, summary)).toEqual([counts]);
		expect(() =>
			parseUsageRows({ rows: [{ EVENTS: 2, FAILED: 0 }] }, summary),
		).toThrow();
		const logs = logQuery("audit", filters);
		expect(
			parseUsageRows({ rows: [{ EVENT_ID: "limit-1" }] }, logs),
		).toEqual([{ EVENT_ID: "limit-1" }]);
		expect(() =>
			parseUsageRows({ rows: [{ LOG_ID: "log-1" }] }, logs),
		).toThrow();
	});
	it("preserves missing telemetry and zero-denominator rates", () => {
		expect(numeric({ TOKENS: null }, "TOKENS")).toBeNull();
		expect(numeric({ TOKENS: "0" }, "TOKENS")).toBe(0);
		expect(percentage(0, 0)).toBeNull();
		expect(percentage(2, 4)).toBe(50);
		expect(periodChange(10, 0)).toBe("New Activity Vs. Benchmark");
		expect(periodChange(0, 0)).toBe("No Change From Benchmark");
		expect(
			modelKpis({ REQUESTS: 10, LATENCY_MS: 1500 }).find(
				(kpi) => kpi.label === "Average Latency",
			)?.value,
		).toBe("1.5 s");
	});
	it("normalizes volume comparisons for unequal durations but keeps distinct counts intact", () => {
		const periods = { currentDays: 7, benchmarkDays: 30 };
		expect(periodChange(70, 300, periods)).toBe(
			"0% Vs. Benchmark (Per Day)",
		);
		expect(periodChange(null, 300, periods)).toBe("Benchmark Unavailable");
		const kpis = modelKpis(
			{ REQUESTS: 70, TOKENS: 700, USERS: 50 },
			{ REQUESTS: 300, TOKENS: 3000, USERS: 100 },
			undefined,
			undefined,
			periods,
		);
		expect(kpis[0]).toMatchObject({
			value: "70",
			description: "0% Vs. Benchmark (Per Day)",
		});
		expect(
			kpis.find((kpi) => kpi.label === "Active Users")?.description,
		).toBe("Benchmark: 100 | Unequal Period Lengths");
	});
	it("fills quiet days without inventing latency", () => {
		const rows = fillUsageDays([{ DAY: "2024-03-02", REQUESTS: 2 }], {
			...filters,
			to: "2024-03-03",
		});
		expect(rows).toHaveLength(3);
		expect(rows[0]).toMatchObject({
			DAY: "2024-03-01",
			REQUESTS: 0,
			LATENCY_MS: null,
		});
		expect(rows[1].REQUESTS).toBe(2);
		// a quiet day cost nothing; a day only unpriced models used stays unknown
		expect(rows[0].COST_MICROS).toBe(0);
	});
});

describe("model cost and token parts", () => {
	it("shows costs in dollars, keeping the first digits of a cost under a cent", () => {
		expect(formatCost(null)).toBe("-");
		expect(formatCost(0)).toBe("$0.00");
		expect(formatCost(1_234_567_890)).toBe("$1,234.57");
		expect(formatCost(2_500)).toBe("$0.0025");
	});
	it("reports what calls cost and how many requests a cost covers", () => {
		const kpis = modelKpis(
			{ REQUESTS: 4, COST_MICROS: 3_000_000, PRICED_REQUESTS: 3 },
			{ REQUESTS: 4, COST_MICROS: 1_500_000 },
		);
		expect(kpis.find((kpi) => kpi.label === "Model Cost")).toMatchObject({
			value: "$3.00",
			description: "+100% Vs. Benchmark",
		});
		expect(kpis.find((kpi) => kpi.label === "Cost Coverage")?.value).toBe(
			"75%",
		);
		expect(
			modelKpis({ REQUESTS: 4 }).find((kpi) => kpi.label === "Model Cost")
				?.value,
		).toBe("-");
	});
	it("splits a prompt into uncached and cached tokens and a response into visible output and thinking", () => {
		expect(
			messageTokenParts({
				MESSAGE_TYPE: "INPUT",
				TOKENS: 1000,
				CACHE_READ_TOKENS: 600,
				CACHE_CREATION_TOKENS: 100,
			}),
		).toEqual([
			{ label: "Uncached Input", tokens: 300 },
			{ label: "Cache-Read", tokens: 600 },
			{ label: "Cache-Creation", tokens: 100 },
		]);
		expect(
			messageTokenParts({
				MESSAGE_TYPE: "RESPONSE",
				TOKENS: 300,
				THINKING_TOKENS: 120,
			}),
		).toEqual([
			{ label: "Visible Output", tokens: 180 },
			{ label: "Thinking", tokens: 120 },
		]);
		// parts a provider reports beyond the total are capped by it
		expect(
			messageTokenParts({
				MESSAGE_TYPE: "INPUT",
				TOKENS: 100,
				CACHE_READ_TOKENS: 150,
			}),
		).toEqual([{ label: "Cache-Read", tokens: 100 }]);
		expect(
			messageTokenParts({ MESSAGE_TYPE: "INPUT", TOKENS: 100 }),
		).toEqual([]);
		expect(
			messageTokenParts({
				MESSAGE_TYPE: "RESPONSE",
				TOKENS: null,
				THINKING_TOKENS: 5,
			}),
		).toEqual([]);
	});
});

beforeEach(() => vi.clearAllMocks());

describe("server-controlled usage exports", () => {
	const request = {
		source: "model",
		view: "ranking",
		format: "csv",
		dimension: "model",
		filters,
	} as const;
	const fileKey = "88d34f7b-dd44-4f4c-b6a7-cad71479d8b3";
	const response = (output: unknown, errors: string[] = []) => ({
		errors,
		insightId: "test-insight",
		pixelReturn: [
			{
				output,
				operationType: ["FILE_DOWNLOAD"],
				isMeta: false,
				pixelExpression: "",
				pixelId: "1",
				timeToRun: 0,
			},
		],
	});
	it("sends only scope and selection to the export reactor, then downloads its file", async () => {
		vi.mocked(runPixel).mockResolvedValue(response(fileKey));
		await exportUsageReport(request, "test-insight");
		expect(runPixel).toHaveBeenCalledWith(
			usageExportPixel(request),
			"test-insight",
		);
		expect(usageExportPixel(request)).toContain(
			"AdminExportEnterpriseUsage(",
		);
		expect(usageExportPixel(request)).not.toMatch(/rows=|sql=|limit=/);
		expect(download).toHaveBeenCalledWith("test-insight", fileKey);
	});
	it("does not download when generation fails or a file key is invalid", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			response(fileKey, ["Export Denied"]),
		);
		await expect(
			exportUsageReport(request, "test-insight"),
		).rejects.toThrow("Export Denied");
		vi.mocked(runPixel).mockResolvedValue(response("invalid-key"));
		await expect(
			exportUsageReport(request, "test-insight"),
		).rejects.toThrow("Download Key");
		expect(download).not.toHaveBeenCalled();
	});
});

describe("nullable metrics and comparison windows", () => {
	it("accepts omitted SQL-null ranking fields while preserving real schema errors", () => {
		const query = rankingQuery(filters, "app");
		expect(
			parseUsageRows({ rows: [{ REQUESTS: 1, USERS: 1 }] }, query),
		).toEqual([
			{
				REQUESTS: 1,
				USERS: 1,
				ENTITY_ID: null,
				ENTITY_NAME: null,
				TOKENS: null,
			},
		]);
		expect(
			parseUsageRows(
				{ rows: [{ ENTITY_ID: "m-1", REQUESTS: 2 }] },
				query,
			)[0],
		).toMatchObject({ ENTITY_ID: "m-1", TOKENS: null });
		expect(() =>
			parseUsageRows({ rows: [{ unrelated: 1 }] }, query),
		).toThrow("Required Fields");
	});
	it("resolves previous, prior-year, and custom windows including leap days", () => {
		expect(
			comparisonUsageFilters(filters, {
				mode: "previous-period",
				from: "",
				to: "",
			}),
		).toMatchObject({ from: "2024-01-30", to: "2024-02-29" });
		expect(
			comparisonUsageFilters(
				{ ...filters, from: "2024-02-29" },
				{ mode: "previous-year", from: "", to: "" },
			),
		).toMatchObject({ from: "2023-02-28", to: "2023-03-31" });
		const custom = comparisonUsageFilters(filters, {
			mode: "custom",
			from: "2023-05-01",
			to: "2023-05-31",
		});
		expect(custom).toMatchObject({ from: "2023-05-01", to: "2023-05-31" });
		expect(
			usageExportPixel({
				source: "model",
				view: "overview",
				format: "pdf",
				filters,
				comparison: custom,
			}),
		).toContain('comparisonStartDate=["2023-05-01"]');
		expect(() =>
			comparisonUsageFilters(filters, {
				mode: "custom",
				from: "2023-05-31",
				to: "2023-05-01",
			}),
		).toThrow();
	});
});
