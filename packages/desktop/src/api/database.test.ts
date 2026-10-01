import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DesktopInstanceProfile } from "@/types";
import {
	loadDatabaseWorkbench,
	parseDatabaseStructure,
	parseStatementResults,
	runDatabaseQuery,
} from "./database";
import { runPixel } from "./pixel";

vi.mock("./pixel", () => ({
	runPixel: vi.fn(),
}));

const profile: DesktopInstanceProfile = {
	id: "test",
	displayName: "Test",
	endpoint: "https://example.com",
	module: "/Monolith",
	platformPath: "/SemossWeb/",
	allowInsecureHttp: false,
};

describe("desktop database workbench", () => {
	beforeEach(() => {
		vi.mocked(runPixel).mockReset();
	});

	it("parses the exact database structure row shape", () => {
		expect(
			parseDatabaseStructure([
				["PEOPLE", "ID", "INT", true, "ID", "PEOPLE"],
				["PEOPLE", "NAME", "VARCHAR", false, "NAME", "PEOPLE"],
			]),
		).toEqual([
			{
				table: "PEOPLE",
				columns: [
					{ column: "ID", type: "INT" },
					{ column: "NAME", type: "VARCHAR" },
				],
			},
		]);
	});

	it("loads structure and derives SPARQL mode from the database category", async () => {
		vi.mocked(runPixel).mockResolvedValue({
			insightId: "insight",
			output: [["CONCEPT", "PROPERTY", "STRING"]],
			outputs: [
				[
					[
						"CONCEPT",
						"PROPERTY",
						"STRING",
						false,
						"PROPERTY",
						"CONCEPT",
					],
				],
				"RDF",
			],
		});

		await expect(
			loadDatabaseWorkbench(profile, {}, 'db-"1'),
		).resolves.toEqual({
			mode: "SPARQL",
			structure: [
				{
					table: "CONCEPT",
					columns: [{ column: "PROPERTY", type: "STRING" }],
				},
			],
		});
		expect(runPixel).toHaveBeenCalledWith(
			profile,
			{},
			'META|GetDatabaseTableStructure(database=["db-\\"1"]); GetDatabaseCategory(engine=["db-\\"1"]);',
		);
	});

	it("normalizes a SQL table response", async () => {
		vi.mocked(runPixel).mockResolvedValue({
			insightId: "insight",
			output: {
				data: {
					headers: ["ID", "NAME"],
					values: [[1, "Ada"]],
				},
			},
			outputs: [],
			returns: [
				{
					operationType: ["DATABASE"],
					output: {
						data: {
							headers: ["ID", "NAME"],
							values: [[1, "Ada"]],
						},
					},
					timeToRun: 18,
				},
			],
		});

		await expect(
			runDatabaseQuery(
				profile,
				{},
				"db-1",
				"SQL",
				"SELECT * FROM PEOPLE;",
			),
		).resolves.toEqual({
			type: "TABLE",
			output: {
				headers: ["ID", "NAME"],
				values: [[1, "Ada"]],
			},
			timeToRun: 18,
		});
	});

	it("parses multi-statement results without treating errors as success", () => {
		expect(
			parseStatementResults([
				{
					statement: 1,
					query: "UPDATE PEOPLE SET NAME = 'Ada';",
					route: "SQL",
					timeToRun: 4,
					type: "MESSAGE",
					status: "SUCCESS",
					message: "1 row updated",
				},
				{
					statement: 2,
					query: "SELECT * FROM MISSING;",
					route: "SQL",
					timeToRun: 2,
					type: "ERROR",
					status: "ERROR",
					message: "Table not found",
				},
			]),
		).toEqual([
			{
				statement: 1,
				query: "UPDATE PEOPLE SET NAME = 'Ada';",
				route: "SQL",
				timeToRun: 4,
				type: "MESSAGE",
				status: "SUCCESS",
				message: "1 row updated",
			},
			{
				statement: 2,
				query: "SELECT * FROM MISSING;",
				route: "SQL",
				timeToRun: 2,
				type: "ERROR",
				status: "ERROR",
				message: "Table not found",
			},
		]);
	});
});
