import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuditLogsDataTable } from "./audit-logs-data-table";
import type { EventData } from "./common";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	// each label reads as its key, so the test does not depend on a locale
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string }) =>
			options?.defaultValue ?? key,
		i18n: { language: "en" },
	}),
}));

afterEach(cleanup);

const event = (overrides: Partial<EventData>): EventData => ({
	requestId: "request-1",
	startTime: "2026-10-16T12:00:00.000Z",
	endTime: "2026-10-16T12:00:01.000Z",
	logTimestamp: "2026-10-16T12:00:01.000Z",
	request: "",
	response: "",
	tokens: "15",
	latency: 1000,
	status: "true",
	engineName: "Model One",
	engineType: "MODEL",
	methodName: "ask",
	userName: "O'Brien",
	userId: "u-1",
	sessionId: "session-1",
	spanId: "span-1",
	...overrides,
});

describe("the activity log's Billed To column", () => {
	it("names the usage limit a model call was billed to, in the row and its details", () => {
		render(
			<AuditLogsDataTable
				logs={[
					event({
						billedSourceType: "TEAM",
						billedSubjectId: "Ops",
						billedSubjectType: "CUSTOM",
					}),
					// a guardrail run, or a call no limit was billed to
					event({
						requestId: "request-2",
						spanId: "span-2",
						engineType: "GUARDRAIL",
						engineName: "PII Guardrail",
					}),
				]}
				totalCount={2}
				page={0}
				rowsPerPage={50}
				onPaginationChange={vi.fn()}
			/>,
		);
		expect(
			screen.getByRole("columnheader", {
				name: "table.columns.billedTo",
			}),
		).toBeTruthy();
		// only the billed call names a limit
		expect(screen.getAllByText("Ops Team Limit")).toHaveLength(1);

		fireEvent.click(screen.getByText("Ops Team Limit"));
		expect(screen.getByText("detail.fields.billedTo")).toBeTruthy();
		expect(screen.getAllByText("Ops Team Limit")).toHaveLength(2);
	});
});
