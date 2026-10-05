import { describe, expect, it } from "vitest";
import { getDataImportDatabases } from "../components/shared/data-import-databases";

describe("Query Builder database responses", () => {
	it("reads current engine fields and display names", () => {
		expect(
			getDataImportDatabases([
				{
					engine_id: "db-1",
					engine_name: "internal",
					engine_display_name: "Sales",
					engine_type: "DATABASE",
					engine_subtype: "POSTGRES",
				},
			]),
		).toEqual([
			{
				engine_id: "db-1",
				engine_name: "Sales",
				engine_type: "DATABASE",
				engine_subtype: "POSTGRES",
			},
		]);
	});
	it("reads the legacy fields returned by GetDatabaseList, including its subtype alias", () => {
		expect(
			getDataImportDatabases([
				{
					database_id: "db-1",
					database_name: "Sales",
					database_type: "DATABASE",
					app_subtype: "H2_DB",
				},
			]),
		).toEqual([
			{
				engine_id: "db-1",
				engine_name: "Sales",
				engine_type: "DATABASE",
				engine_subtype: "H2_DB",
			},
		]);
	});
	it("prefers engine fields when both formats exist", () => {
		expect(
			getDataImportDatabases([
				{
					engine_id: "new-id",
					engine_name: "New name",
					database_id: "legacy-id",
					database_name: "Legacy name",
				},
			])[0],
		).toMatchObject({ engine_id: "new-id", engine_name: "New name" });
	});
	it("avoids blank options and duplicate IDs without modifying the response", () => {
		const response = [
			{ engine_id: "db-1" },
			{ engine_id: "db-1", engine_name: "Duplicate" },
			{ engine_name: "No ID" },
			null,
		];
		const snapshot = structuredClone(response);
		expect(getDataImportDatabases(response)).toEqual([
			{
				engine_id: "db-1",
				engine_name: "db-1",
				engine_type: "DATABASE",
				engine_subtype: undefined,
			},
		]);
		expect(response).toEqual(snapshot);
	});
	it.each([undefined, null, {}, "invalid"])(
		"treats a non-list response as empty: %s",
		(data) => {
			expect(getDataImportDatabases(data)).toEqual([]);
		},
	);
});
