import { describe, expect, it } from "vitest";
import {
	type AuditLogFilterValue,
	buildAuditLogReportPixel,
	buildFilterOptionListPixel,
	filterValueToReportParams,
} from "./pixel";

const filterValue = (
	overrides: Partial<AuditLogFilterValue>,
): AuditLogFilterValue => ({
	scope: { engineId: "orders-model" },
	dateRangeType: "DAY",
	dateRangeValue: 1,
	customDateRange: { from: null, to: null },
	methodNames: [],
	engineTypes: [],
	accessReasons: [],
	filterUserId: "",
	roomId: "",
	searchTerm: "",
	...overrides,
});

describe("the access reason filter", () => {
	it("sends the reasons picked in the report's search", () => {
		const pixel = buildAuditLogReportPixel(
			filterValueToReportParams(
				filterValue({ accessReasons: ["DELEGATED", "REFUSED"] }),
			),
			50,
			0,
		);

		expect(pixel).toContain(
			'"search":{"accessReason":["DELEGATED","REFUSED"]}',
		);
	});

	it("sends no search when no reason, method or engine type is picked", () => {
		const pixel = buildAuditLogReportPixel(
			filterValueToReportParams(filterValue({})),
			50,
			0,
		);

		expect(pixel).not.toContain('"search"');
	});

	it("asks for the reasons the engine's rows record as its options", () => {
		expect(
			buildFilterOptionListPixel({
				filterName: "accessReason",
				scope: { engineId: "orders-model" },
			}),
		).toContain('"filterName":"accessReason"');
	});
});
