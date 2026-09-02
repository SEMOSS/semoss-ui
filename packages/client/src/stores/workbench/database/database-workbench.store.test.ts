import { describe, expect, it } from "vitest";
import { parseStatementResults } from "./database-workbench.store";

describe("database SQL batch results", () => {
	it("parses ordered table, error, and skipped statement results", () => {
		const results = parseStatementResults([
			{
				statement: 1,
				query: "SELECT id FROM orders",
				route: "READ",
				status: "SUCCESS",
				type: "TABLE",
				output: { headers: ["id"], values: [[1]] },
				timeToRun: 4,
			},
			{
				statement: 2,
				query: "UPDATE orders SET id = 2",
				route: "WRITE",
				status: "ERROR",
				type: "ERROR",
				message: "Update denied",
				timeToRun: 1,
			},
			{
				statement: 3,
				query: "SELECT id FROM orders",
				route: "READ",
				status: "SKIPPED",
				type: "SKIPPED",
				message: "Not executed",
				timeToRun: 0,
			},
		]);

		expect(results).toHaveLength(3);
		expect(results?.[0]).toMatchObject({
			type: "TABLE",
			output: { headers: ["id"], values: [[1]] },
		});
		expect(results?.[1]).toMatchObject({
			type: "ERROR",
			message: "Update denied",
		});
		expect(results?.[2]).toMatchObject({ type: "SKIPPED" });
	});

	it("does not mistake an arbitrary JSON array for a SQL batch", () => {
		expect(parseStatementResults([{ id: 1 }, { id: 2 }])).toBeNull();
	});
});
