import { describe, expect, it } from "vitest";
import {
	type DataStoreEngine,
	matchDataStoreEngine,
} from "./bpmn-engine-match";

const engines: DataStoreEngine[] = [
	{ id: "db-1", names: ["Orders DB", "orders_db"], type: "DATABASE" },
	{ id: "db-2", names: ["Shared"], type: "DATABASE" },
	{ id: "vec-1", names: ["Shared"], type: "VECTOR" },
];

describe("matchDataStoreEngine", () => {
	it("matches by name or id, ignoring case and padding", () => {
		expect(matchDataStoreEngine(engines, " orders db ")?.id).toBe("db-1");
		expect(matchDataStoreEngine(engines, "ORDERS_DB")?.id).toBe("db-1");
		expect(matchDataStoreEngine(engines, "db-1")?.id).toBe("db-1");
	});

	it("returns nothing for unknown, empty or ambiguous names", () => {
		expect(matchDataStoreEngine(engines, "Missing")).toBeUndefined();
		expect(matchDataStoreEngine(engines, "  ")).toBeUndefined();
		expect(matchDataStoreEngine(engines, "Shared")).toBeUndefined();
	});
});
