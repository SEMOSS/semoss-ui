import { beforeEach, describe, expect, it, vi } from "vitest";
import { createWorkbenchStore } from "@semoss/workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";
import {
	buildQueryPixel,
	createDatabaseWorkbenchStore,
	parseStatementResults,
	parseTransactionResult,
} from "./database-workbench.store";

const pixel = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	runPixel: pixel.run,
}));

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

describe("database SQL script run in one transaction", () => {
	it("parses the outcome and a script of one statement", () => {
		const parsed = parseTransactionResult({
			outcome: "COMMITTED",
			message:
				"All 1 statements ran and were committed in one transaction",
			statements: [
				{
					statement: 1,
					query: "UPDATE orders SET note = 'a';",
					route: "WRITE",
					status: "SUCCESS",
					type: "MESSAGE",
					message: "Statement executed successfully",
					timeToRun: 3,
					updateCount: 0,
				},
			],
		});

		expect(parsed?.transaction).toEqual({
			outcome: "COMMITTED",
			message:
				"All 1 statements ran and were committed in one transaction",
		});
		expect(parsed?.results).toHaveLength(1);
		expect(parsed?.results[0]).toMatchObject({
			status: "SUCCESS",
			updateCount: 0,
		});
	});

	it("parses rolled back, failed and skipped statements", () => {
		const parsed = parseTransactionResult({
			outcome: "ROLLED_BACK",
			message:
				"Statement 2 of 3 failed: duplicate key. The transaction was rolled back, so no changes were kept",
			statements: [
				{
					statement: 1,
					query: "INSERT INTO orders VALUES (1);",
					route: "WRITE",
					status: "ROLLED_BACK",
					type: "MESSAGE",
					message:
						"Statement executed, then rolled back because the transaction did not commit",
					timeToRun: 2,
					updateCount: 1,
				},
				{
					statement: 2,
					query: "INSERT INTO orders VALUES (1);",
					route: "WRITE",
					status: "ERROR",
					type: "ERROR",
					message: "duplicate key",
					timeToRun: 1,
					sqlState: "23505",
				},
				{
					statement: 3,
					query: "DELETE FROM orders;",
					route: "WRITE",
					status: "SKIPPED",
					type: "SKIPPED",
					message: "Not executed because an earlier statement failed",
					timeToRun: 0,
				},
			],
		});

		expect(parsed?.transaction.outcome).toBe("ROLLED_BACK");
		expect(parsed?.results.map((result) => result.status)).toEqual([
			"ROLLED_BACK",
			"ERROR",
			"SKIPPED",
		]);
		expect(parsed?.results[1]).toMatchObject({ sqlState: "23505" });
	});

	it("parses the rows a statement returned, rolled back or not", () => {
		const parsed = parseTransactionResult({
			outcome: "ROLLED_BACK",
			message:
				"Statement 2 of 2 failed: duplicate key. The transaction was rolled back, so no changes were kept",
			statements: [
				{
					statement: 1,
					query: "SELECT id FROM orders;",
					route: "READ",
					status: "ROLLED_BACK",
					type: "TABLE",
					output: { headers: ["ID"], values: [[1], [2]] },
					hasMoreRows: true,
					timeToRun: 2,
				},
				{
					statement: 2,
					query: "INSERT INTO orders VALUES (1);",
					route: "WRITE",
					status: "ERROR",
					type: "ERROR",
					message: "duplicate key",
					timeToRun: 1,
				},
			],
		});

		expect(parsed?.results[0]).toMatchObject({
			type: "TABLE",
			status: "ROLLED_BACK",
			output: { headers: ["ID"], values: [[1], [2]] },
			hasMoreRows: true,
		});
	});

	it("does not mistake another payload for a transaction result", () => {
		expect(parseTransactionResult([{ statement: 1 }])).toBeNull();
		expect(
			parseTransactionResult({
				outcome: "PARTIAL",
				message: "",
				statements: [],
			}),
		).toBeNull();
		expect(
			parseTransactionResult({
				outcome: "COMMITTED",
				message: "done",
				statements: [{ id: 1 }],
			}),
		).toBeNull();
	});
});

describe("database query pixels", () => {
	const base = { engineId: "db-1", query: "SELECT 1", raw: true };

	it("runs SQL one statement at a time unless asked for one transaction", () => {
		expect(
			buildQueryPixel({ ...base, mode: "SQL", transaction: false }),
		).toBe(
			'SqlQuery(database=["db-1"], query=["<encode>SELECT 1</encode>"], commit=[true]);',
		);
		expect(
			buildQueryPixel({
				...base,
				mode: "SQL",
				transaction: true,
				timeout: 30,
			}),
		).toBe(
			'SqlQuery(database=["db-1"], query=["<encode>SELECT 1</encode>"], commit=[true], transaction=[true], timeout=[30]);',
		);
		expect(
			buildQueryPixel({ ...base, mode: "SQL", transaction: true }),
		).toBe(
			'SqlQuery(database=["db-1"], query=["<encode>SELECT 1</encode>"], commit=[true], transaction=[true]);',
		);
	});

	it("never sends a transaction for SPARQL or admin SQL", () => {
		expect(
			buildQueryPixel({
				...base,
				mode: "SPARQL",
				transaction: true,
				timeout: 30,
			}),
		).toBe(
			'SparqlQuery(database=["db-1"], query=["<encode>SELECT 1</encode>"], raw=[true], commit=[true]);',
		);
		expect(
			buildQueryPixel({
				...base,
				mode: "ADMIN_SQL",
				transaction: true,
				timeout: 30,
			}),
		).toBe(
			'AdminSqlQuery(database=["db-1"], query=["<encode>SELECT 1</encode>"], commit=[true]);',
		);
	});
});

describe("database query runs", () => {
	/** A workbench store for one engine, in the given mode, without its first reads. */
	const makeStore = (mode: "SQL" | "SPARQL" = "SQL") => {
		const workbench = createWorkbenchStore({
			components: {
				[WORKBENCH_COMPONENTS.DATABASE_QUERY]: {
					name: "Query",
					content: () => null,
				},
				[WORKBENCH_COMPONENTS.DATABASE_RESULTS]: {
					name: "Results",
					content: () => null,
				},
			},
		});
		const store = createDatabaseWorkbenchStore({ workbench });
		store.setState({ engineId: "engine-1", mode });
		return store;
	};

	/** The reply of a pixel whose only return is the given output. */
	const replyWith = (output: unknown) => ({
		errors: [],
		pixelReturn: [{ output, timeToRun: 4 }],
	});

	beforeEach(() => {
		pixel.run.mockReset();
		// the structure read after a run gets an empty reply
		pixel.run.mockResolvedValue({ errors: [], pixelReturn: [] });
	});

	it("shows a script run in one transaction as its statements and their outcome", async () => {
		const store = makeStore();
		pixel.run.mockResolvedValueOnce(
			replyWith({
				outcome: "ROLLED_BACK",
				message: "Statement 1 failed, so nothing was kept",
				statements: [
					{
						statement: 1,
						query: "UPDATE orders SET note = 'a';",
						route: "WRITE",
						status: "ERROR",
						type: "ERROR",
						message: "Table not found",
						timeToRun: 2,
					},
				],
			}),
		);

		await store.getState().onQuery({
			panelId: "query-1",
			query: "UPDATE orders SET note = 'a';",
			transaction: true,
			timeout: 30,
		});

		expect(pixel.run.mock.calls[0][0]).toContain("transaction=[true]");
		expect(pixel.run.mock.calls[0][0]).toContain("timeout=[30]");
		expect(store.getState().results["query-1"]).toMatchObject({
			type: "BATCH",
			transaction: {
				outcome: "ROLLED_BACK",
				message: "Statement 1 failed, so nothing was kept",
			},
		});
	});

	it("reads a reply that is not a transaction result as any other reply", async () => {
		const store = makeStore();
		pixel.run.mockResolvedValueOnce(replyWith("Script ran"));

		await store.getState().onQuery({
			panelId: "query-1",
			query: "UPDATE orders SET note = 'a';",
			transaction: true,
		});

		expect(store.getState().results["query-1"]).toMatchObject({
			type: "MESSAGE",
			message: "Script ran",
		});
	});

	it("never runs SPARQL in one transaction", async () => {
		const store = makeStore("SPARQL");
		pixel.run.mockResolvedValueOnce(replyWith("Done"));

		await store.getState().onQuery({
			panelId: "query-1",
			query: "SELECT ?s WHERE { ?s ?p ?o }",
			transaction: true,
			timeout: 30,
		});

		expect(pixel.run.mock.calls[0][0]).not.toContain("transaction=");
		expect(store.getState().results["query-1"]).toMatchObject({
			type: "MESSAGE",
		});
	});
});
