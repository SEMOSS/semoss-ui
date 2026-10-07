import { describe, expect, it } from "vitest";
import {
	AUDIT_EVENT_COLUMNS,
	buildAuditTrailsPixel,
	EMPTY_AUDIT_FILTERS,
	formatAuditTime,
	parseAuditEvents,
} from "./audit-trails";

describe("existing audit trails query contract", () => {
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
