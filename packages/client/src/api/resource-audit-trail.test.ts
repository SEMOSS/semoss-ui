import { describe, expect, it } from "vitest";
import { AUDIT_EVENT_COLUMNS, EMPTY_AUDIT_FILTERS } from "./audit-trail";
import {
	buildResourceAuditPixel,
	parseResourceAuditPage,
} from "./resource-audit-trail";

describe("resource-scoped audit contract", () => {
	it("uses a materialized reactor and cannot override the resource through filters", () => {
		const pixel = buildResourceAuditPixel(
			"ENGINE",
			"engine-a",
			{
				...EMPTY_AUDIT_FILTERS,
				engineId: "engine-b",
				targetId: "engine-b",
				actorId: 'user"\\\n</encode> | DeleteEngine();',
			},
			2,
			50,
			"STATUS",
			"ASC",
		);
		expect(pixel).toContain('EngineAuditEvents(id=["engine-a"]');
		expect(pixel).toContain(
			'page=[2],pageSize=[50],sort=["STATUS"],direction=["ASC"]',
		);
		expect(pixel).not.toContain("engine-b");
		expect(pixel).not.toContain("</encode>");
		expect(pixel).not.toContain(" | Collect");
	});
	it("supports projects and typed date filters", () => {
		expect(
			buildResourceAuditPixel(
				"PROJECT",
				"p",
				{
					...EMPTY_AUDIT_FILTERS,
					from: "2026-10-01",
					to: "2026-10-12",
				},
				0,
				25,
				"EVENT_TIME",
				"DESC",
			),
		).toContain('ProjectAuditEvents(id=["p"]');
	});
	it("validates complete owner fields and strips unexpected sensitive fields", () => {
		const event = Object.fromEntries(
			AUDIT_EVENT_COLUMNS.map((column) => [column, null]),
		);
		event.EVENT_ID = "event-1";
		event.EVENT_TYPE = "PROJECT_CREATE";
		const page = parseResourceAuditPage({
			events: [event],
			page: 0,
			pageSize: 25,
			hasNextPage: false,
		});
		expect(page.events[0]).not.toHaveProperty("IP_ADDR");
		expect(page.events[0]).not.toHaveProperty("SESSION_ID_HASH");
		expect(() =>
			parseResourceAuditPage({
				events: [{}],
				page: 0,
				pageSize: 25,
				hasNextPage: false,
			}),
		).toThrow();
		expect(() =>
			parseResourceAuditPage({ events: [], page: 0, pageSize: 25 }),
		).toThrow();
	});
	it("accepts the serialized project response when null fields are omitted", () => {
		const page = parseResourceAuditPage({
			page: 0,
			pageSize: 25,
			hasNextPage: false,
			events: [
				{
					EVENT_ID: "3daed8cd-5c7f-40ac-87c9-d44f3d2c997c",
					EVENT_TIME: "2026-10-12T08:26:46.053294Z",
					EVENT_TYPE: "PROJECT_CREATE",
					ACTION: "PROJECT_CREATE",
					STATUS: "SUCCESS",
					CATEGORY: "PROJECT",
					SEVERITY: "LOW",
					ACTOR_USER_ID: "imahaba",
					ACTOR_USER_TYPE: "NATIVE",
					ACTOR_USER_NAME: "Ibrahim Mahaba",
					TARGET_TYPE: "PROJECT",
					TARGET_ID: "a41c8a19-4a4c-4cca-ae3c-b6b4409cb144",
					TARGET_NAME: "New App test Audit",
				},
			],
		});
		expect(page.events).toHaveLength(1);
		expect(page.events[0].SUBJECT_USER_ID).toBeNull();
		expect(page.events[0].OLD_VALUE).toBeNull();
		expect(page.events[0].NEW_VALUE).toBeNull();
		expect(page.events[0].DETAILS).toBeNull();
	});
	it("still rejects invalid event identities and wrongly typed optional values", () => {
		const envelope = { page: 0, pageSize: 25, hasNextPage: false };
		expect(() =>
			parseResourceAuditPage({
				...envelope,
				events: [{ EVENT_TYPE: "PROJECT_CREATE" }],
			}),
		).toThrow();
		expect(() =>
			parseResourceAuditPage({
				...envelope,
				events: [{ EVENT_ID: "event-1" }],
			}),
		).toThrow();
		expect(() =>
			parseResourceAuditPage({
				...envelope,
				events: [
					{
						EVENT_ID: "event-1",
						EVENT_TYPE: "PROJECT_CREATE",
						DETAILS: { unexpected: true },
					},
				],
			}),
		).toThrow();
	});
});
