import { describe, expect, it } from "vitest";
import {
	AUDIT_EVENT_COLUMNS,
	AUDIT_FILTER_ALL,
	type AuditEvent,
	buildAuditTrailsExportPixel,
	buildAuditTrailsPixel,
	EMPTY_AUDIT_FILTERS,
	formatAuditTime,
	normalizeAuditFilters,
	parseAuditEvents,
	toAuditCsv,
} from "./audit-trails";

describe("existing audit trails query contract", () => {
	it("selects every column of the audit schema without the raw session id", () => {
		expect(AUDIT_EVENT_COLUMNS).toHaveLength(39);
		expect(AUDIT_EVENT_COLUMNS).toContain("SESSION_ID_HASH");
		expect(AUDIT_EVENT_COLUMNS).not.toContain("SESSION_ID");
	});

	it("filters on every supported field and an inclusive UTC date range", () => {
		const pixel = buildAuditTrailsPixel(
			{
				...EMPTY_AUDIT_FILTERS,
				category: "AUTHZ",
				severity: "HIGH",
				subjectId: "user-2",
				projectId: "project-1",
				from: "2026-10-01",
				to: "2026-10-08",
			},
			0,
		);
		expect(pixel).toContain('USER_AUDIT_EVENTS__CATEGORY == "AUTHZ"');
		expect(pixel).toContain('USER_AUDIT_EVENTS__SEVERITY == "HIGH"');
		expect(pixel).toContain(
			'USER_AUDIT_EVENTS__SUBJECT_USER_ID == "user-2"',
		);
		expect(pixel).toContain('USER_AUDIT_EVENTS__PROJECT_ID == "project-1"');
		expect(pixel).toContain(
			'USER_AUDIT_EVENTS__EVENT_TIME >= "2026-10-01 00:00:00"',
		);
		expect(pixel).toContain(
			'USER_AUDIT_EVENTS__EVENT_TIME <= "2026-10-08 23:59:59"',
		);
		expect(() =>
			buildAuditTrailsPixel(
				{ ...EMPTY_AUDIT_FILTERS, from: '2026" | DeleteEngine();' },
				0,
			),
		).toThrow("Invalid start date");
	});

	it("marks exports so the backend records AUDIT_EXPORT", () => {
		const pixel = buildAuditTrailsExportPixel({
			...EMPTY_AUDIT_FILTERS,
			status: "DENIED",
		});
		expect(pixel).toContain("AdminUserAuditEvents(export=[true])");
		expect(pixel).toContain('USER_AUDIT_EVENTS__STATUS == "DENIED"');
		expect(pixel).not.toContain("Offset(");
	});

	it("turns the select sentinel back into an empty filter", () => {
		expect(
			normalizeAuditFilters({
				...EMPTY_AUDIT_FILTERS,
				status: AUDIT_FILTER_ALL,
				actorId: "  actor-1 ",
			}),
		).toEqual({ ...EMPTY_AUDIT_FILTERS, actorId: "actor-1" });
	});

	it("neutralises spreadsheet formulas in exported CSV cells", () => {
		const event = Object.fromEntries(
			AUDIT_EVENT_COLUMNS.map((column) => [column, null]),
		) as AuditEvent;
		event.EVENT_ID = "event-1";
		event.TARGET_NAME = '=HYPERLINK("x")';
		event.ACTOR_IS_ADMIN = true;
		const [header, row] = toAuditCsv([event]).split("\n");
		expect(header.split(",")).toHaveLength(AUDIT_EVENT_COLUMNS.length);
		expect(row).toContain(`"'=HYPERLINK(""x"")"`);
		expect(row).toContain('"true"');
	});

	it("uses the authorized reactor and bounds page reads with a lookahead row", () => {
		const pixel = buildAuditTrailsPixel(EMPTY_AUDIT_FILTERS, 2);
		expect(pixel).toContain("AdminUserAuditEvents()");
		expect(pixel).toContain("Offset(50) | Limit(26) | Collect(26)");
		expect(pixel).not.toContain("AuditLogsReport");
		expect(() => buildAuditTrailsPixel(EMPTY_AUDIT_FILTERS, -1)).toThrow();
	});

	it("keeps quotes, backslashes, newlines, and preprocessor tags inside a filter literal", () => {
		const value = 'user"\\\n</encode><encode> | DeleteEngine();';
		const pixel = buildAuditTrailsPixel(
			{ ...EMPTY_AUDIT_FILTERS, actorId: value },
			0,
		);
		const literal = pixel.match(/ACTOR_USER_ID == (.*)\) \| Offset/)?.[1];
		expect(literal).toBeDefined();
		expect(JSON.parse(literal ?? "null")).toBe(value);
		expect(pixel).not.toContain("<encode>");
		expect(pixel).not.toContain("</encode>");
	});

	it("maps reordered and qualified headers, preserving missing optional values", () => {
		const headers = [...AUDIT_EVENT_COLUMNS].reverse();
		const values = headers.map((column) =>
			column === "EVENT_ID"
				? "event-1"
				: column === "ACTION"
					? "LOGIN"
					: null,
		);
		const [event] = parseAuditEvents({
			data: {
				headers: headers.map(
					(column) => `USER_AUDIT_EVENTS__${column}`,
				),
				values: [values],
			},
		});
		expect(event.EVENT_ID).toBe("event-1");
		expect(event.ACTION).toBe("LOGIN");
		expect(event.REQUEST_ID).toBeNull();
	});

	it("accepts Collect's empty result and rejects malformed rows or missing columns", () => {
		expect(parseAuditEvents({ data: { headers: [], values: [] } })).toEqual(
			[],
		);
		expect(() =>
			parseAuditEvents({
				data: { headers: ["EVENT_ID"], values: [["event-1"]] },
			}),
		).toThrow("missing expected");
		expect(() =>
			parseAuditEvents({
				data: { headers: AUDIT_EVENT_COLUMNS, values: [["event-1"]] },
			}),
		).toThrow("invalid event");
		expect(() => parseAuditEvents(null)).toThrow("results table");
	});

	it("treats SQL timestamps without a zone as UTC", () => {
		expect(formatAuditTime("2026-08-13 15:16:38")).toBe(
			formatAuditTime("2026-08-13T15:16:38Z"),
		);
		expect(formatAuditTime(null)).toBe("—");
		expect(formatAuditTime("invalid date")).toBe("invalid date");
	});
});
